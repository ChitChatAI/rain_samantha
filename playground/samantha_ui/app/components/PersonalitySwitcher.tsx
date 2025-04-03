'use client';

import { motion } from 'framer-motion';
import { Personality } from '../types';
import { cn } from '@/lib/utils';

interface PersonalitySwitcherProps {
  currentPersonality: Personality;
  onPersonalityChange: (personality: Personality) => void;
}

const personalities: Personality[] = ['work', 'playful', 'therapy', 'custom'];

export default function PersonalitySwitcher({
  currentPersonality,
  onPersonalityChange,
}: PersonalitySwitcherProps) {
  return (
    <div className="w-64 h-full bg-card border-r p-4 flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-4">Personality</h2>
      {personalities.map((personality) => (
        <button
          key={personality}
          onClick={() => onPersonalityChange(personality)}
          className={cn(
            'relative w-full px-4 py-3 rounded-md text-sm font-medium transition-colors',
            'hover:bg-primary/10',
            currentPersonality === personality
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-primary'
          )}
        >
          {currentPersonality === personality && (
            <motion.div
              layoutId="personality-indicator"
              className="absolute inset-0 bg-primary rounded-md -z-10"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          {personality.charAt(0).toUpperCase() + personality.slice(1)}
        </button>
      ))}
    </div>
  );
}