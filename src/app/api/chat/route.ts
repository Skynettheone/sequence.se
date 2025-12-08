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
        // Retry logic with exponential backoff for connection errors
        const getContextWithRetry = async (retryCount = 0): Promise<string> => {
          try {
            const contextResult = await getContext(lastMessage.content, namespace, 6000, 0.0); // Increased maxTokens for more context
            return typeof contextResult === 'string' ? contextResult : '';
          } catch (error: any) {
            const isConnectionError = error.message?.includes('failed to reach Pinecone') || 
                                     error.message?.includes('ConnectionError') ||
                                     error.message?.includes('network') ||
                                     error.message?.includes('timeout');
            
            // Retry up to 3 times for connection errors, 1 time for other errors
            const maxRetries = isConnectionError ? 3 : 1;
            
            if (retryCount < maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
              console.log(`Pinecone request failed (${isConnectionError ? 'connection' : 'other'} error), retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              return getContextWithRetry(retryCount + 1);
            }
            throw error; // Re-throw if retries exhausted
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

    // Log the actual retrieved context for debugging
    if (hasContext) {
      console.log('Retrieved context content:', {
        fullContext: context,
        contextPreview: context.substring(0, 500) + (context.length > 500 ? '...' : ''),
        contextWordCount: context.split(/\s+/).length,
      });
    } else {
      console.log('No context retrieved - context is empty');
    }

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
    const systemPrompt = `You are Sequence3.ai, an AI assistant for Sequence3 / SQ3 , an AI-powered unified inbox platform for businesses.

    PROJECT CONTEXT:
    - Sequence3/SQ3 is a second-year Software Development Group project
    - Developed by students from Informatics Institute of Technology (IIT) Sri Lanka
    - Group: CS-22
    - Module Leader (Software Development Group Project module): Mr. Banuka Athuruliya
    - Supervisor (Sequence3 project): Mr. Torin Wirasingha (always refer to as "Mr. Torin Wirasingha")
    - Team Leader: Tharuka Karunanayaka
    - Team Members: Hasal Dharmagunawardana, Pamindu Rashmika Hennadige, Siyath Dharmarathne, Dharani Wasundara, Thevindu Wickramaarachchi
    - IMPORTANT: Sequence3/SQ3 is currently in development and has NOT launched yet
    
    CRITICAL RESPONSE RULES:
    - Identify yourself as Sequence3.ai
    - Keep responses SHORT and CREATIVE - maximum 2-4 sentences
    - Be direct, engaging, and avoid lengthy explanations
    - No bullet points or verbose paragraphs
    - Be conversational and friendly, but concise
    - Use creative, punchy language when appropriate
    - Always use "Mr." when referring to Mr. Banuka Athuruliya or Mr. Torin Wirasingha
    - CRITICAL: Use SIMPLE, BUSINESS-FRIENDLY language - NO technical jargon
    - Focus on BUSINESS BENEFITS (save time, grow sales, happy customers) not technical features
    - Speak like you're talking to a business owner, not a developer
    - Avoid words like "engine", "algorithm", "API", "system", "platform" - use simple alternatives
    - Use words like "helps you", "makes it easy", "saves you time", "grows your business"
    
    ${hasContext ? `CRITICAL CONTEXT RULES - READ CAREFULLY:
    - You MUST ONLY use information that is EXPLICITLY stated in the context provided below
    - DO NOT make assumptions, inferences, or add information that is not directly in the context
    - DO NOT use general knowledge to fill in gaps - if information is not in the context, you cannot use it
    - DO NOT invent details about people, roles, features, or capabilities that are not explicitly mentioned in the context
    - When asked about a feature or capability:
      1. FIRST analyze the context to see if that feature is mentioned
      2. If the feature IS in the context, describe it in SIMPLE BUSINESS TERMS - focus on what it DOES for the business owner, not how it works technically
      3. If the feature is NOT in the context, clearly state that it's not mentioned in the available information
      4. Remember: the platform hasn't launched yet, so features are in development
      5. ALWAYS translate technical features into business benefits (e.g., "Conversation Prioritization Engine" → "helps you see the most important messages first so you never miss a sale")
    - Answer questions naturally and conversationally - DO NOT mention "context", "knowledge base", "from the information provided", or any reference to where the information came from
    - Be helpful but accurate - accuracy is more important than being helpful with wrong information
    
    START CONTEXT BLOCK (Knowledge Base Information - USE ONLY WHAT IS EXPLICITLY STATED):
    ${context}
    END OF CONTEXT BLOCK
    
    IMPORTANT: 
    - Only use information that is EXPLICITLY written in the context above
    - When asked about features, analyze the context first - if it's not there, say it's not mentioned
    - Remember: Sequence3 is in development and hasn't launched yet` : `IMPORTANT: No specific context was found in the knowledge base. You should respond that you don't have enough information to answer the question accurately. Remember that Sequence3 is in development and hasn't launched yet.`}
    
    Answer the user's question in a SHORT, CREATIVE, and CONCISE way - maximum 2-4 sentences.`;

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

