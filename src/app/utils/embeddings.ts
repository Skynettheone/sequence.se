import OpenAI from 'openai';

// Initialize OpenAI (similar to how Gemini was initialized)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function getEmbeddings(input: string, retryCount = 0): Promise<number[]> {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      throw new Error('OPENAI_API_KEY environment variable not set');
    }

    if (!input || input.trim().length === 0) {
      throw new Error('Input text is empty');
    }

    // Use OpenAI embedding model: text-embedding-3-small (1536 dimensions)
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Using small model for cost-effectiveness
      input: input.replace(/\n/g, ' ').trim(),
    });

    // Extract embedding values
    const embedding = response.data[0]?.embedding;

    if (!embedding || embedding.length === 0) {
      throw new Error('Failed to extract embedding from OpenAI response');
    }

    // OpenAI text-embedding-3-small returns 1536 dimensions
    // Validate dimension count
    if (embedding.length !== 1536) {
      console.warn(`Expected 1536 dimensions, got ${embedding.length}. Using as-is.`);
    }

    // Return 1536-dimensional embedding
    return embedding;
  } catch (e: any) {
    // Retry once on failure (for transient errors)
    if (retryCount < 1 && (e.status === 429 || e.status >= 500)) {
      console.log(`OpenAI embedding API error, retrying... (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
      return getEmbeddings(input, retryCount + 1);
    }
    
    console.error('Error calling OpenAI embedding API: ', e);
    throw new Error(`Error calling OpenAI embedding API: ${e.message || e}`);
  }
}

