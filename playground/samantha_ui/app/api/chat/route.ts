import { NextResponse } from 'next/server';
import openai from '@/lib/openai';
import { loadPersonalityProfiles } from '@/lib/personalityLoader';
import { generateSystemPrompt } from '@/lib/personalityPrompt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Load personality profiles
    const profileData = await loadPersonalityProfiles();
    
    // Create system message with personality context
    const systemMessage = {
      role: "system",
      content: generateSystemPrompt(profileData)
    };
    
    // Combine system message with user messages
    const apiMessages = [
      systemMessage,
      ...messages
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: apiMessages,
      temperature: 0.7,
      stream: false,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}