import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  outcome: string | null;
  headsLabel: string;
  tailsLabel: string;
  decisionContext: string;
  aiSuggestion: string;
}

export default function AIInsightModal({
  isOpen,
  onClose,
  outcome,
  headsLabel,
  tailsLabel,
  aiSuggestion,
  decisionContext,
}: AIInsightModalProps) {
  if (!outcome) return null;

  const resultLabel = outcome === "heads" ? headsLabel : tailsLabel;
  const resultInitial = outcome === "heads" ? "H" : "T";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-secondary-bg text-white border-copper sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-bold text-white">
              AI Insight
            </DialogTitle>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-6 w-6 p-0 text-accent-text hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 rounded-full bg-copper flex items-center justify-center mr-2">
              <span className="text-white font-bold">{resultInitial}</span>
            </div>
            <p className="text-white font-medium">
              The coin landed on{" "}
              <span id="modal-result-text">{resultLabel}</span>!
            </p>
          </div>

          <div>
            <p className="text-accent-text text-sm mb-1">AI Suggestion:</p>
            <p id="modal-suggestion" className="text-white">
              {aiSuggestion || "Analyzing your coin flip result..."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex justify-end">
          <Button
            className="bg-copper text-white py-2 px-4 rounded font-medium hover:bg-opacity-90 transition-colors mr-2"
            onClick={onClose}
          >
            Accept
          </Button>
          <Button
            variant="outline"
            className="bg-secondary-bg text-white py-2 px-4 rounded font-medium hover:bg-opacity-90 transition-colors border-accent-text"
            onClick={onClose}
          >
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
