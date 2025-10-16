import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";

interface DiffViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  original: string;
  optimized: string;
  changes: string[];
  onAccept: (editedContent?: string) => void;
  isApplying: boolean;
}

export default function DiffViewModal({
  open,
  onOpenChange,
  original,
  optimized,
  changes,
  onAccept,
  isApplying,
}: DiffViewModalProps) {
  const [editedContent, setEditedContent] = useState(optimized);

  // Update edited content when optimized content changes
  useEffect(() => {
    setEditedContent(optimized);
  }, [optimized]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-5/6 flex flex-col">
        <DialogHeader>
          <DialogTitle>Optimization Results</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          <div className="flex flex-col">
            <h4 className="font-medium mb-2 text-sm">Before (Original)</h4>
            <ScrollArea className="flex-1 bg-input rounded-md p-4">
              <div className="diff-removed p-2 rounded text-sm font-mono whitespace-pre-wrap">
                {original}
              </div>
            </ScrollArea>
          </div>
          
          <div className="flex flex-col">
            <h4 className="font-medium mb-2 text-sm">After (AI Optimized - Editable)</h4>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="flex-1 bg-input rounded-md p-4 text-sm font-mono resize-none"
              placeholder="Edit the optimized content here..."
            />
          </div>
        </div>

        {changes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2 text-sm">Key Changes Made:</h4>
            <ScrollArea className="h-20 bg-input rounded-md p-2">
              <ul className="text-sm space-y-1">
                {changes.map((change, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            data-testid="reject-changes"
          >
            <X className="h-4 w-4 mr-2" />
            Reject Changes
          </Button>
          <Button
            onClick={() => onAccept(editedContent)}
            disabled={isApplying}
            data-testid="accept-changes"
          >
            {isApplying ? (
              <>
                <i className="fas fa-spinner animate-spin mr-2"></i>
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Accept Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
