'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings } from 'lucide-react';
import { Guardrails } from '../types';

interface GuardrailsPanelProps {
  guardrails: Guardrails;
  onUpdate: (guardrails: Guardrails) => void;
}

export default function GuardrailsPanel({ guardrails, onUpdate }: GuardrailsPanelProps) {
  const [localGuardrails, setLocalGuardrails] = useState(guardrails);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(localGuardrails);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Assistant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Input
              value={localGuardrails.role}
              onChange={(e) =>
                setLocalGuardrails({ ...localGuardrails, role: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Prompt</label>
            <Textarea
              value={localGuardrails.initialPrompt}
              onChange={(e) =>
                setLocalGuardrails({
                  ...localGuardrails,
                  initialPrompt: e.target.value,
                })
              }
            />
          </div>
          <Button type="submit">Save Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}