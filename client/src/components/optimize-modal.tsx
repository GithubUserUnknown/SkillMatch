import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface OptimizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionName: string;
  onSubmit: (data: { jobDescription: string; additionalDetails?: string }) => void;
  isLoading: boolean;
}

export default function OptimizeModal({
  open,
  onOpenChange,
  sectionName,
  onSubmit,
  isLoading,
}: OptimizeModalProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [isAdvanced, setIsAdvanced] = useState(false);

  const handleSubmit = () => {
    if (!jobDescription.trim()) return;

    onSubmit({
      jobDescription,
      additionalDetails: additionalDetails.trim() || undefined,
    });

    // Reset form
    setJobDescription("");
    setAdditionalDetails("");
    setIsAdvanced(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isAdvanced ? "Advanced" : ""} Optimize {sectionName} Section
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="job-description">Job Description *</Label>
            <Textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="h-24 mt-2"
              placeholder="Paste the relevant job description..."
              data-testid="job-description-textarea"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="advanced-mode"
              checked={isAdvanced}
              onCheckedChange={(checked) => setIsAdvanced(checked === true)}
              data-testid="advanced-mode-checkbox"
            />
            <Label htmlFor="advanced-mode">Advanced optimization</Label>
          </div>

          {isAdvanced && (
            <>
              <div>
                <Label htmlFor="additional-details">Additional Details (Optional)</Label>
                <Textarea
                  id="additional-details"
                  value={additionalDetails}
                  onChange={(e) => setAdditionalDetails(e.target.value)}
                  className="h-24 mt-2"
                  placeholder="Add specific achievements, metrics, or examples you want to highlight..."
                  data-testid="additional-details-textarea"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Optimization Focus</Label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <Checkbox defaultChecked />
                    <span className="text-sm">Keywords matching</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Quantify achievements</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Action-oriented language</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Industry terminology</span>
                  </label>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => onOpenChange(false)}
              data-testid="cancel-optimization"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !jobDescription.trim()}
              data-testid="submit-optimization"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Optimizing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  {isAdvanced ? "Advanced " : ""}Optimize
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
