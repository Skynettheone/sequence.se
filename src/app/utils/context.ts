import { getMatchesFromEmbeddings } from './pinecone';
import { getEmbeddings } from './embeddings';
import type { Metadata } from './pinecone';

type MatchResult = {
  id: string;
  score?: number;
  metadata?: Metadata;
};

// The function `getContext` is used to retrieve the context of a given message
export const getContext = async (
  message: string,
  namespace: string = '',
  maxTokens: number = 3000,
  minScore: number = 0.0, // Very low threshold to get all relevant results
  getOnlyText: boolean = true
): Promise<string | MatchResult[]> => {
  try {
    // Get the embeddings of the input message
    const embedding = await getEmbeddings(message);
    console.log('Embeddings generated:', {
      embeddingLength: embedding.length,
      messageLength: message.length,
    });

    // Retrieve more matches for better context (increased from 3 to 8)
    const matches = await getMatchesFromEmbeddings(embedding, 8, namespace);
    console.log('Pinecone matches received:', {
      totalMatches: matches.length,
      scores: matches.map(m => m.score).filter(Boolean),
      hasMatches: matches.length > 0,
    });

    // Filter out the matches that have a score lower than the minimum score
    // Lower threshold means we get more potentially relevant results
    const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);
    console.log('Qualifying documents after score filter:', {
      minScore,
      totalMatches: matches.length,
      qualifyingCount: qualifyingDocs.length,
      qualifyingScores: qualifyingDocs.map(m => m.score).filter(Boolean),
    });

  if (!getOnlyText) {
    // Return the full matches
    return qualifyingDocs;
  }

    // Extract text from metadata (support multiple field names)
    // First, log what metadata fields we actually have
    if (qualifyingDocs.length > 0) {
      console.log('Sample metadata structure:', {
        firstMatchId: qualifyingDocs[0].id,
        firstMatchMetadata: qualifyingDocs[0].metadata,
        firstMatchMetadataKeys: Object.keys(qualifyingDocs[0].metadata || {}),
        firstMatchMetadataValues: Object.entries(qualifyingDocs[0].metadata || {}).map(([k, v]) => ({
          key: k,
          type: typeof v,
          valueLength: typeof v === 'string' ? v.length : 'not string',
          valuePreview: typeof v === 'string' ? v.substring(0, 50) : v,
        })),
      });
    }

    let docs = qualifyingDocs.map((match, index) => {
      const metadata = match.metadata || {};
      
      // Try multiple possible field names in order of likelihood
      let text = metadata.chunk || 
                 metadata.content || 
                 metadata.text || 
                 metadata.body ||
                 metadata.message ||
                 metadata.description ||
                 metadata.pageContent ||
                 metadata.value ||
                 // Try getting first non-empty string value if no standard fields
                 (Object.values(metadata).find(v => typeof v === 'string' && v && v.trim().length > 0) as string) || '';
      
      // If still no text, try to stringify the entire metadata object
      if (!text && Object.keys(metadata).length > 0) {
        // Try to find any field that looks like content
        const contentFields = Object.entries(metadata).filter(([k, v]) => 
          typeof v === 'string' && v.length > 10
        );
        if (contentFields.length > 0) {
          text = contentFields[0][1] as string;
          console.log(`Found text in unexpected field: ${contentFields[0][0]}`);
        }
      }
      
      if (!text && index === 0) {
        console.warn('No text found in first match:', {
          availableFields: Object.keys(metadata),
          metadataSample: JSON.stringify(metadata).substring(0, 200),
        });
      }
      
      return text;
    }).filter((text) => text && text.trim().length > 0);

    console.log('Extracted documents:', {
      qualifyingDocsCount: qualifyingDocs.length,
      docsWithText: docs.length,
      totalTextLength: docs.join('\n').length,
      finalContextLength: Math.min(docs.join('\n').length, maxTokens),
    });

    // Join all the chunks of text together, truncate to the maximum number of tokens, and return the result
    const result = docs.join('\n').substring(0, maxTokens);
    console.log('Final context result:', {
      resultLength: result.length,
      hasContent: result.length > 0,
    });
    return result;
  } catch (error: any) {
    console.error('Error in getContext:', {
      message: error.message || error,
      stack: error.stack,
    });
    throw error;
  }
};

