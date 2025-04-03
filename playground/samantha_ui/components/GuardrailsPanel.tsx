import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";

// When rendering DialogContent, add a DialogDescription component:
<DialogContent>
  <DialogDescription className="sr-only">
    Guardrails configuration panel
  </DialogDescription>
  {/* ...existing content... */}
</DialogContent>