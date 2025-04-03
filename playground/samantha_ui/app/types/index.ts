export type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

export type Personality = 'work' | 'playful' | 'therapy' | 'custom';

export type Guardrails = {
  role: string;
  initialPrompt: string;
  limitations: string[];
  guidelines: string[];
};

export type PersonalityConfig = {
  [key in Personality]: Guardrails;
};