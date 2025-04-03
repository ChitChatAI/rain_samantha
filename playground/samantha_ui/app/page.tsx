'use client';

import { useState } from 'react';
import { Message, Personality, Guardrails } from './types';
import { defaultPersonalities } from './config/personalities';
import { sendMessage } from './utils/api';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import GuardrailsPanel from './components/GuardrailsPanel';
import PersonalitySwitcher from './components/PersonalitySwitcher';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [personality, setPersonality] = useState<Personality>('work');
  const [guardrails, setGuardrails] = useState<Guardrails>(
    defaultPersonalities.work
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: uuidv4(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // We need to include conversation history to maintain context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add the new user message
      conversationHistory.push({
        role: 'user',
        content
      });
      
      // Send the full conversation history
      const response = await sendMessage(content);
      
      const assistantMessage: Message = {
        id: uuidv4(),
        content: response.message,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalityChange = (newPersonality: Personality) => {
    setPersonality(newPersonality);
    setGuardrails(defaultPersonalities[newPersonality]);
  };

  return (
    <div className="flex h-screen bg-background">
      <PersonalitySwitcher
        currentPersonality={personality}
        onPersonalityChange={handlePersonalityChange}
      />
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-2xl font-bold">Samantha</h1>
          <GuardrailsPanel guardrails={guardrails} onUpdate={setGuardrails} />
        </header>
        <ChatWindow messages={messages} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}