#!/usr/bin/env tsx
/**
 * RAG Data Loader with Recursive Text Splitter
 * 
 * This script processes documents (PDF, TXT, MD, MDX) and uploads them to Pinecone
 * with aggressive chunking for maximum vector coverage.
 * 
 * Usage:
 *   pnpm tsx scripts/load-rag-data.ts <file1> <file2> ...
 *   or
 *   pnpm run load-rag-data <file1> <file2> ...
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import type { Metadata } from '../src/app/utils/pinecone';

// Load environment variables from .env file
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  // Try .env.local first, then .env
  const filePath = fs.existsSync(envLocalPath) ? envLocalPath : envPath;
  
  if (fs.existsSync(filePath)) {
    const envContent = fs.readFileSync(filePath, 'utf-8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value.trim();
        }
      }
    }
  }
}

// Load env before anything else
loadEnvFile();

// ============================================================
// Configuration
// ============================================================

const INDEX_DIM = 1536; // OpenAI text-embedding-3-small dimension

// Ultra aggressive chunking for maximum vectors
const CHUNK_SIZE = 100; // characters per chunk (very small!)
const CHUNK_OVERLAP = 50; // overlap characters
const SEPARATORS = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', '']; // Extended split hierarchy

const BATCH_SIZE = 100; // Embedding batch size
const UPLOAD_BATCH_SIZE = 100; // Pinecone upload batch size

// ============================================================
// Setup Clients
// ============================================================

function getPineconeClient(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable not set');
  }
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
}

function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable not set');
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// ============================================================
// Text Splitting (Simple Recursive Splitter)
// ============================================================

class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
    separators: string[] = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', '']
  ) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.separators = separators;
  }

  splitText(text: string): string[] {
    const chunks: string[] = [];
    
    // Try each separator in order
    for (const separator of this.separators) {
      if (text.length <= this.chunkSize) {
        chunks.push(text);
        return chunks;
      }

      const splits = separator ? text.split(separator) : [text];
      
      if (splits.length > 1) {
        let currentChunk = '';
        
        for (let i = 0; i < splits.length; i++) {
          const split = splits[i];
          const separatorText = i < splits.length - 1 ? separator : '';
          const potentialChunk = currentChunk + (currentChunk ? separatorText : '') + split;
          
          if (potentialChunk.length <= this.chunkSize) {
            currentChunk = potentialChunk;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
            }
            
            // Handle splits that are larger than chunk size
            if (split.length > this.chunkSize) {
              // Recursively split large splits
              const subSplits = this.splitText(split);
              chunks.push(...subSplits.slice(0, -1)); // Add all but last
              currentChunk = subSplits[subSplits.length - 1] || split.substring(0, this.chunkSize);
            } else {
              currentChunk = split;
            }
          }
        }
        
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // Add overlap between chunks
        if (chunks.length > 1 && this.chunkOverlap > 0) {
          const overlappedChunks: string[] = [chunks[0]];
          
          for (let i = 1; i < chunks.length; i++) {
            const prevChunk = chunks[i - 1];
            const currentChunk = chunks[i];
            
            // Take overlap from end of previous chunk
            const overlap = prevChunk.substring(Math.max(0, prevChunk.length - this.chunkOverlap));
            overlappedChunks.push(overlap + currentChunk);
          }
          
          return overlappedChunks;
        }
        
        return chunks;
      }
    }
    
    // Fallback: split by character if no separator works
    const fallbackChunks: string[] = [];
    for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
      fallbackChunks.push(text.substring(i, i + this.chunkSize));
    }
    return fallbackChunks;
  }
}

// ============================================================
// Text Preprocessing
// ============================================================

function preprocessText(text: string): string {
  // Normalize whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  
  // Remove control characters
  text = text.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f-\x9f]/g, '');
  
  return text.trim();
}

// ============================================================
// File Reading
// ============================================================

function readTextFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  if (['.txt', '.md', '.mdx'].includes(ext)) {
    return fs.readFileSync(filePath, 'utf-8');
  } else if (ext === '.pdf') {
    throw new Error('PDF support requires pdfplumber. Install with: pnpm add pdfplumber');
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }
}

// ============================================================
// Main Processing Function
// ============================================================

async function processFiles(filePaths: string[], namespace: string = 'default') {
  const pc = getPineconeClient();
  const openai = getOpenAIClient();
  
  // Get index name from environment
  const indexName = process.env.PINECONE_INDEX || '';
  if (!indexName) {
    throw new Error('PINECONE_INDEX environment variable not set');
  }
  
  // Clean index name
  const cleanIndexName = indexName.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const finalIndexName = cleanIndexName.includes('.svc.') 
    ? cleanIndexName.split('.')[0] 
    : cleanIndexName;
  
  const index = pc.index(finalIndexName);
  const pineconeNamespace = index.namespace(namespace);
  
  console.log('✓ Initialized Pinecone (dim=1536) + OpenAI text-embedding-3-small');
  console.log(`✓ Using RecursiveCharacterTextSplitter`);
  console.log(`✓ Chunk settings: ${CHUNK_SIZE} chars, ${CHUNK_OVERLAP} overlap\n`);
  
  // Initialize text splitter
  const textSplitter = new RecursiveCharacterTextSplitter(
    CHUNK_SIZE,
    CHUNK_OVERLAP,
    SEPARATORS
  );
  
  // Process documents
  const allChunks: Array<{
    id: string;
    text: string;
    metadata: Metadata & {
      source: string;
      chunk_index: number;
      total_chunks: number;
      char_count: number;
      chunk_position: string;
      preview: string;
    };
  }> = [];
  
  for (const filePath of filePaths) {
    console.log(`\n📄 Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`⚠️  File not found: ${filePath}`);
      continue;
    }
    
    // Read file
    let text: string;
    try {
      text = readTextFile(filePath);
    } catch (error: any) {
      console.error(`❌ Error reading file: ${error.message}`);
      continue;
    }
    
    // Preprocess text
    text = preprocessText(text);
    
    const filename = path.basename(filePath);
    const prefix = path.basename(filePath, path.extname(filePath));
    const charCount = text.length;
    
    console.log(`   Characters: ${charCount.toLocaleString()}`);
    
    // Split into chunks using multiple strategies
    console.log(`🔄 Splitting: ${filename}`);
    
    // Strategy 1: Recursive splitter
    const chunksPrimary = textSplitter.splitText(text);
    
    // Strategy 2: Sliding window
    const chunksSliding: string[] = [];
    const stepSize = CHUNK_SIZE - CHUNK_OVERLAP;
    for (let start = 0; start < text.length; start += stepSize) {
      const end = start + CHUNK_SIZE;
      const chunk = text.substring(start, end);
      if (chunk.trim().length >= 50) {
        chunksSliding.push(chunk);
      }
      if (end >= text.length) break;
    }
    
    // Strategy 3: Sentence-based splitting
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunksSentence: string[] = [];
    let current = '';
    for (const sentence of sentences) {
      if (current.length + sentence.length < CHUNK_SIZE) {
        current += (current ? ' ' : '') + sentence;
      } else {
        if (current) chunksSentence.push(current);
        current = sentence;
      }
    }
    if (current) chunksSentence.push(current);
    
    // Combine and deduplicate
    const allStrategyChunks = [...chunksPrimary, ...chunksSliding, ...chunksSentence];
    const uniqueChunks: string[] = [];
    const seenTexts = new Set<string>();
    
    for (const chunk of allStrategyChunks) {
      const normalized = chunk.trim().toLowerCase().substring(0, 100);
      if (!seenTexts.has(normalized) && chunk.trim().length >= 50) {
        uniqueChunks.push(chunk);
        seenTexts.add(normalized);
      }
    }
    
    console.log(`   Generated ${uniqueChunks.length} chunks (primary: ${chunksPrimary.length}, sliding: ${chunksSliding.length}, sentence: ${chunksSentence.length})`);
    
    const avgChars = uniqueChunks.length > 0 
      ? Math.round(uniqueChunks.reduce((sum, c) => sum + c.length, 0) / uniqueChunks.length)
      : 0;
    console.log(`   Avg chars/chunk: ${avgChars}`);
    
    // Create chunk objects
    for (let i = 0; i < uniqueChunks.length; i++) {
      const chunkText = uniqueChunks[i];
      allChunks.push({
        id: `${prefix}_chunk_${i.toString().padStart(4, '0')}`,
        text: chunkText,
        metadata: {
          source: filename,
          chunk_index: i,
          total_chunks: uniqueChunks.length,
          char_count: chunkText.length,
          chunk_position: `${i + 1}/${uniqueChunks.length}`,
          preview: chunkText.substring(0, 100).replace(/\n/g, ' ') + '...',
          // Store text in 'text' field for retrieval
          text: chunkText,
          content: chunkText,
          chunk: chunkText,
        },
      });
    }
  }
  
  console.log(`\n✓ Total chunks prepared: ${allChunks.length}`);
  
  if (allChunks.length === 0) {
    console.log('⚠️  No chunks to upload');
    return;
  }
  
  // Generate embeddings
  console.log('\n🔢 Generating embeddings...');
  const texts = allChunks.map(c => c.text);
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      });
      
      const batchEmbeddings = response.data.map(item => item.embedding);
      
      // Validate dimensions
      for (const emb of batchEmbeddings) {
        if (emb.length !== INDEX_DIM) {
          throw new Error(`Embedding dimension ${emb.length} != expected ${INDEX_DIM}`);
        }
      }
      
      embeddings.push(...batchEmbeddings);
      
      if ((i + BATCH_SIZE) % 500 === 0 || (i + BATCH_SIZE) >= texts.length) {
        console.log(`   Embedded ${Math.min(i + BATCH_SIZE, texts.length)}/${texts.length} chunks`);
      }
    } catch (error: any) {
      console.error(`❌ Error embedding batch ${i}-${i + batch.length}: ${error.message}`);
      throw error;
    }
  }
  
  console.log(`✓ Generated ${embeddings.length} embeddings`);
  
  // Prepare records for upsert (Pinecone v6 API format)
  // For vector records, we need to use the Record format with values array
  const recordsToUpsert = allChunks.map((chunk, idx) => ({
    id: chunk.id,
    values: embeddings[idx],
    metadata: chunk.metadata,
  }));
  
  // Upsert to Pinecone (v6 API)
  console.log('\n📤 Uploading vectors to Pinecone...');
  let successfulUploads = 0;
  let failedUploads = 0;
  
  for (let i = 0; i < recordsToUpsert.length; i += UPLOAD_BATCH_SIZE) {
    const batch = recordsToUpsert.slice(i, i + UPLOAD_BATCH_SIZE);
    
    try {
      // Pinecone v6 uses upsert method with array of records
      await pineconeNamespace.upsert(batch);
      successfulUploads += batch.length;
      console.log(`   Uploaded ${successfulUploads}/${recordsToUpsert.length} vectors`);
    } catch (error: any) {
      failedUploads += batch.length;
      console.error(`❌ Error uploading batch ${i}-${i + batch.length}: ${error.message}`);
    }
  }
  
  // Verify upload
  console.log('\n🔍 Verifying upload...');
  try {
    const stats = await index.describeIndexStats();
    console.log(`✓ Index stats:`, JSON.stringify(stats, null, 2));
  } catch (error: any) {
    console.log(`⚠️  Could not retrieve stats: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('✅ UPLOAD COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📊 Summary:`);
  console.log(`   Documents processed: ${filePaths.length}`);
  console.log(`   Total chunks created: ${allChunks.length}`);
  console.log(`   Vectors generated: ${embeddings.length}`);
  console.log(`   Successful uploads: ${successfulUploads}`);
  if (failedUploads > 0) {
    console.log(`   Failed uploads: ${failedUploads}`);
  }
  console.log(`   Namespace: ${namespace}`);
  console.log(`   Dimensions: ${INDEX_DIM}`);
  console.log('='.repeat(70));
  
  if (allChunks.length > 0) {
    const charCounts = allChunks.map(c => c.metadata.char_count);
    console.log(`\n📈 Chunk Statistics:`);
    console.log(`   Min chars: ${Math.min(...charCounts)}`);
    console.log(`   Max chars: ${Math.max(...charCounts)}`);
    console.log(`   Avg chars: ${Math.round(charCounts.reduce((a, b) => a + b, 0) / charCounts.length)}`);
    console.log(`   Total chars indexed: ${charCounts.reduce((a, b) => a + b, 0).toLocaleString()}`);
  }
  
  console.log('\n💡 Your vectors are ready for RAG retrieval!');
  console.log('   Use query embeddings to retrieve relevant context for your LLM.');
  console.log('='.repeat(70));
}

// ============================================================
// Main Entry Point
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: pnpm tsx scripts/load-rag-data.ts <file1> <file2> ...');
    console.error('Example: pnpm tsx scripts/load-rag-data.ts documents/doc1.txt documents/doc2.md');
    process.exit(1);
  }
  
  // Get namespace from environment or use default
  const namespace = process.env.PINECONE_NAMESPACE || 'default';
  
  try {
    await processFiles(args, namespace);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { processFiles };

