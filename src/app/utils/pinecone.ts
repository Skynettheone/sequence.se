import { Pinecone } from '@pinecone-database/pinecone';

export type Metadata = {
  url?: string;
  text?: string;
  chunk?: string;
  content?: string;
  hash?: string;
  [key: string]: any;
};

// Initialize Pinecone client (singleton pattern)
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

// The function `getMatchesFromEmbeddings` is used to retrieve matches for the given embeddings
const getMatchesFromEmbeddings = async (
  embeddings: number[],
  topK: number,
  namespace: string
): Promise<Array<{
  id: string;
  score?: number;
  metadata?: Metadata;
}>> => {
  let indexName: string = process.env.PINECONE_INDEX || '';
  if (indexName === '') {
    throw new Error('PINECONE_INDEX environment variable not set');
  }

  // Clean index name - remove any URL prefixes or trailing slashes
  indexName = indexName.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  // If it looks like a hostname, extract just the index name (part before first dot)
  if (indexName.includes('.svc.')) {
    indexName = indexName.split('.')[0];
  }

  // Validate embeddings
  if (!embeddings || embeddings.length === 0) {
    throw new Error('Embeddings array is empty');
  }

  // Validate dimension count (should be 1536 for OpenAI text-embedding-3-small)
  // But allow flexibility for different embedding models
  if (embeddings.length === 0) {
    throw new Error('Embeddings array is empty');
  }
  
  // Log dimension for debugging (OpenAI typically uses 1536, but can vary)
  if (embeddings.length !== 1536 && embeddings.length !== 768) {
    console.warn(`Unexpected embedding dimensions: ${embeddings.length}. Expected 1536 (OpenAI) or 768 (Gemini). Proceeding anyway.`);
  }

  // Get Pinecone client
  const pc = getPineconeClient();

  // Get the Pinecone index directly (SDK v6 handles host resolution automatically)
  const index = pc.index(indexName);

  // Get the namespace (default to empty string if not provided)
  const pineconeNamespace = index.namespace(namespace || '');

  try {
    // Query the index with the defined request
    // Using includeValues: false to reduce response size, but we need metadata
    // Add timeout and retry logic for connection issues
    const queryResult = await Promise.race([
      pineconeNamespace.query({
        vector: embeddings,
        topK,
        includeMetadata: true,
        includeValues: false, // We don't need the vectors back
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Pinecone query timeout after 10 seconds')), 10000)
      )
    ]) as any;
    
    // Return matches in the expected format
    // Handle both old API (metadata) and new API (fields) formats
    const matches = ((queryResult.matches || []) as any[]).map((match: any) => {
      // New Pinecone API might return data in 'fields' instead of 'metadata'
      const metadata = (match.metadata || match.fields || {}) as Metadata;
      
      // Log first match structure for debugging
      if (match === queryResult.matches?.[0]) {
        console.log('First match structure:', {
          id: match.id,
          score: match.score,
          hasMetadata: !!match.metadata,
          hasFields: !!match.fields,
          metadataKeys: match.metadata ? Object.keys(match.metadata) : [],
          fieldsKeys: match.fields ? Object.keys(match.fields) : [],
        });
      }
      
      return {
        id: match.id || '',
        score: match.score,
        metadata: metadata,
      };
    });
    
    return matches;
  } catch (e: any) {
    // Log detailed error information
    console.error('Error querying embeddings:', {
      error: e.message || e,
      indexName,
      namespace: namespace || '(default)',
      embeddingLength: embeddings.length,
      topK,
      errorType: e.constructor?.name,
    });
    throw new Error(`Error querying embeddings: ${e.message || e}`);
  }
};

export { getMatchesFromEmbeddings };

