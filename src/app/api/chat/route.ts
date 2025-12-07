import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getContext } from '@/app/utils/context';

// Initialize OpenAI (similar to how Gemini was initialized)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    // Safely parse request body with error handling
    let body;
    try {
      const text = await req.text();
      if (!text || text.trim().length === 0) {
        console.error('Request body is empty');
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON parse error:', {
        message: parseError.message,
        stack: parseError.stack,
      });
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { messages } = body || {};

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    // Get the last message
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content) {
      return NextResponse.json(
        { error: 'Last message content is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      console.error('OPENAI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // Get the context from the last message (following pinecone-vercel-starter pattern)
    // Make context retrieval optional - if Pinecone fails, continue without context
    let context = '';
    const namespace = process.env.PINECONE_NAMESPACE || '';
    
    if (process.env.PINECONE_INDEX) {
      try {
        // Retry logic: try once, if it fails, retry once more
        const getContextWithRetry = async (retryCount = 0): Promise<string> => {
          try {
            const contextResult = await getContext(lastMessage.content, namespace, 3000, 0.0);
            return typeof contextResult === 'string' ? contextResult : '';
          } catch (error: any) {
            if (retryCount < 1) {
              // Retry once after a short delay
              console.log(`Pinecone request failed, retrying... (attempt ${retryCount + 1})`);
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay before retry
              return getContextWithRetry(retryCount + 1);
            }
            throw error; // Re-throw if retry also fails
          }
        };

        context = await getContextWithRetry();
      } catch (error: any) {
        // Log the error but continue without context
        console.error('Failed to retrieve context from Pinecone after retries:', {
          message: error.message || error,
          errorType: error.constructor?.name,
        });
        // Continue with empty context - chat will work with general knowledge
        context = ''; // Explicitly set to empty string
      }
    }

    const hasContext = context.trim().length > 0;
    
    console.log('Context retrieval complete:', {
      hasContext: hasContext,
      contextLength: context.length,
      willProceedToOpenAI: hasContext,
    });

    // If no context found, don't proceed with OpenAI
    if (!hasContext) {
      return NextResponse.json({
        error: 'No relevant context found. Please try rephrasing your question.',
      }, { status: 400 });
    }

    // Build conversation history for OpenAI
    const conversationHistory = messages
      .slice(0, -1) // Exclude the last message (current query)
      .map((msg: { role: string; content: string }) => {
        if (msg.role === 'user' || msg.role === 'assistant') {
          return {
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ role: 'user' | 'assistant'; content: string }>;

    // Create system prompt with context - optimized for SQ3/Sequence3 questions
    const systemPrompt = `You are the Sequence3.ai, an expert AI assistant for Sequence3, an AI-powered unified inbox platform for businesses.

CRITICAL RESPONSE RULES:
- Keep responses SHORT and CREATIVE - maximum 2-4 sentences
- Be direct, engaging, and avoid lengthy explanations
- No bullet points or verbose paragraphs
- Be conversational and friendly, but concise
- Use creative, punchy language when appropriate

Your role is to help users understand Sequence3 (SQ3) - its features, capabilities, and how it works. Answer questions about the SQ3 platform, unified inbox, AI features, multi-channel messaging, etc.

IMPORTANT INSTRUCTIONS:
1. ALWAYS be helpful and informative about Sequence3
2. Use the context provided below when available, but you can also use your general knowledge about Sequence3/SQ3
3. Keep answers SHORT - 2-4 sentences maximum
4. Be conversational, friendly, and creative
5. If the question is about Sequence3, do your best to answer using available information
6. Only say "I don't know" if the question is completely unrelated to Sequence3/SQ3 and you have no relevant information

${hasContext ? `START CONTEXT BLOCK (Knowledge Base Information):
${context}
END OF CONTEXT BLOCK

Use the context above as your primary source of information, but feel free to supplement with your general knowledge about Sequence3/SQ3 when helpful.` : `Note: No specific context was found in the knowledge base, but you can still answer questions about Sequence3/SQ3 using your general knowledge.`}

Answer the user's question about Sequence3 in a SHORT, CREATIVE, and CONCISE way - maximum 2-4 sentences.`;

    // Validate OpenAI API key before making the call
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Call OpenAI API with retry logic for empty responses
    const getOpenAIResponse = async (retryCount = 0): Promise<string> => {
      try {
        console.log('Calling OpenAI API...', {
          model: 'gpt-4o-mini',
          messageCount: conversationHistory.length + 2, // system + user + history
          hasContext: hasContext,
          apiKeyPresent: !!process.env.OPENAI_API_KEY,
          apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        });

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini', // Using GPT-4o-mini for cost-effectiveness
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: lastMessage.content },
          ],
          temperature: 0.8,
          max_tokens: 256, // Reduced to enforce shorter responses
        });

        const text = completion.choices[0]?.message?.content?.trim() || '';

        console.log('OpenAI response received:', {
          hasText: !!text,
          textLength: text.length,
          finishReason: completion.choices[0]?.finish_reason,
        });

        // If response is empty, retry (up to 2 times)
        if (!text && retryCount < 2) {
          console.log(`OpenAI returned empty response, retrying... (attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          return getOpenAIResponse(retryCount + 1);
        }

        // If still empty after retries, return a fallback message
        if (!text) {
          console.warn('OpenAI returned empty response after retries, using fallback');
          return "I'm having trouble generating a response right now. Could you please rephrase your question?";
        }

        return text;
      } catch (error: any) {
        console.error('OpenAI API error:', {
          message: error.message || error,
          status: error.status,
          statusCode: error.statusCode,
          code: error.code,
          type: error.type,
          retryCount,
          errorName: error.name,
          errorStack: error.stack?.substring(0, 500), // First 500 chars of stack
        });

        // Handle specific OpenAI API errors
        if (error.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.');
        }
        if (error.status === 429) {
          // Rate limit - retry
          if (retryCount < 2) {
            console.log(`OpenAI rate limit hit, retrying... (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for rate limit
            return getOpenAIResponse(retryCount + 1);
          }
        }
        if (error.status && error.status >= 500) {
          // Server error - retry
          if (retryCount < 2) {
            console.log(`OpenAI server error, retrying... (attempt ${retryCount + 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return getOpenAIResponse(retryCount + 1);
          }
        }
        throw error;
      }
    };

    let text: string;
    try {
      text = await getOpenAIResponse();
    } catch (error: any) {
      console.error('Failed to get OpenAI response after all retries:', {
        message: error.message || error,
        status: error.status,
      });
      // Return a user-friendly error message instead of crashing
      text = "I'm experiencing technical difficulties right now. Please try again in a moment.";
    }

    return NextResponse.json({
      message: text,
    });
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error('Chat API error:', {
      message: error.message || error,
      stack: error.stack,
      name: error.name,
      status: error.status,
      statusCode: error.statusCode,
      code: error.code,
    });
    // Only return generic error message to client, details logged server-side
    return NextResponse.json(
      {
        error: 'Failed to process chat request. Please try again.',
      },
      { status: 500 }
    );
  }
}

