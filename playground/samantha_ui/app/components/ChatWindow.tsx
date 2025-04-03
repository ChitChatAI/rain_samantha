'use client';

import { useEffect, useRef } from 'react';
import { Message } from '../types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'flex max-w-[80%] rounded-lg p-4',
            message.role === 'user'
              ? 'ml-auto bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="text-sm">{message.content}</p>
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}