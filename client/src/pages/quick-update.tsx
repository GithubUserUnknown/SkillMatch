import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import QuickUpload from "@/components/quick-upload";
import DiffViewModal from "@/components/diff-view-modal";
import { Moon, User, ArrowLeft, FileText, Edit, Zap, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function QuickUpdate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [uploadedSections, setUploadedSections] = useState<Array<{ name: string; content: string }>>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    original: Array<{ name: string; content: string }>;
    optimized: Array<{ name: string; content: string }>;
  } | null>(null);

  // Batch optimize mutation
  const batchOptimizeMutation = useMutation({
    mutationFn: async (data: {
      sections: Array<{ header: string; content: string }>;
      jobDescription: string;
    }) => {
      const response = await apiRequest("POST", "/api/batch-optimize", data);
      return response.json();
    },
    onSuccess: (result) => {
      setOptimizationResult({
        original: uploadedSections,
        optimized: result.optimizedSections.map((section: any) => ({
          name: section.header,
          content: section.optimizedContent,
        })),
      });
      setShowDiffModal(true);
    },
    onError: (error) => {
      toast({
        title: "Optimization failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartOptimization = () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description for optimization.",
        variant: "destructive",
      });
      return;
    }

    if (uploadedSections.length === 0) {
      toast({
        title: "No resume uploaded",
        description: "Please upload a resume file first.",
        variant: "destructive",
      });
      return;
    }

    const sections = uploadedSections.map(section => ({
      header: section.name,
      content: section.content,
    }));

    batchOptimizeMutation.mutate({
      sections,
      jobDescription,
    });
  };

  const handleAcceptOptimization = () => {
    setShowDiffModal(false);
    toast({
      title: "Optimization completed",
      description: "Your resume has been optimized! You can now download it.",
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FileText className="text-primary text-xl" />
              <h1 className="text-xl font-bold">SkillMatch Resume Maker</h1>
            </div>
            <nav className="flex space-x-1">
              <Button
                variant="ghost"
                onClick={() => setLocation("/")}
              >
                <FileText className="h-4 w-4 mr-2" />Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/resume-editor")}
                data-testid="edit-mode-btn"
              >
                <Edit className="h-4 w-4 mr-2" />Edit Resume
              </Button>
              <Button
                className="bg-primary text-primary-foreground"
                data-testid="quick-mode-btn"
              >
                <Zap className="h-4 w-4 mr-2" />Quick Update
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/dashboard")}
              >
                <Target className="h-4 w-4 mr-2" />Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/profile")}
              >
                <User className="h-4 w-4 mr-2" />Profile
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Moon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">John Doe</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setLocation("/edit")}
              className="mb-4"
              data-testid="back-to-editor"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Editor
            </Button>
            <h2 className="text-2xl font-bold mb-2">Quick Resume Update</h2>
            <p className="text-muted-foreground">
              Upload your existing resume and optimize it for a specific job description using AI.
            </p>
          </div>

          {/* Step 1: File Upload */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 1: Upload Your Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <QuickUpload
                onUploadSuccess={setUploadedSections}
                data-testid="resume-upload"
              />
            </CardContent>
          </Card>

          {/* Step 2: Job Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 2: Job Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Paste the job description you're applying for:
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="h-40 resize-none overflow-auto"
                  placeholder="We are looking for a Senior Backend Engineer with experience in microservices, APIs, and distributed systems..."
                  data-testid="job-description-input"
                />
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="secondary" size="sm" data-testid="paste-clipboard">
                  <i className="fas fa-paste mr-2"></i>Paste from Clipboard
                </Button>
                <Button variant="secondary" size="sm" data-testid="import-url">
                  <i className="fas fa-link mr-2"></i>Import from URL
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Optimization Options */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Optimization Level</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="optimization" value="quick" className="text-primary" defaultChecked />
                      <div>
                        <div className="font-medium text-sm">Quick Optimization</div>
                        <div className="text-xs text-muted-foreground">
                          Fast AI-powered keyword matching and phrasing improvements
                        </div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="radio" name="optimization" value="comprehensive" className="text-primary" />
                      <div>
                        <div className="font-medium text-sm">Comprehensive Rewrite</div>
                        <div className="text-xs text-muted-foreground">
                          Deep content restructuring and enhancement
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">ATS Optimization</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="text-primary" defaultChecked />
                      <span className="text-sm">Optimize for Applicant Tracking Systems</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="text-primary" />
                      <span className="text-sm">Include industry-specific keywords</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input type="checkbox" className="text-primary" />
                      <span className="text-sm">Quantify achievements with metrics</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <Button variant="secondary" data-testid="save-draft">
              <i className="fas fa-save mr-2"></i>Save as Draft
            </Button>
            <Button
              size="lg"
              onClick={handleStartOptimization}
              disabled={batchOptimizeMutation.isPending}
              data-testid="start-optimization"
            >
              {batchOptimizeMutation.isPending ? (
                <>
                  <i className="fas fa-spinner animate-spin mr-2"></i>
                  Optimizing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Start AI Optimization
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Diff Modal */}
      <DiffViewModal
        open={showDiffModal}
        onOpenChange={setShowDiffModal}
        original={optimizationResult?.original.map(s => s.content).join('\n\n') || ""}
        optimized={optimizationResult?.optimized.map(s => s.content).join('\n\n') || ""}
        changes={[]}
        onAccept={handleAcceptOptimization}
        isApplying={false}
        data-testid="batch-diff-modal"
      />
    </div>
  );
}
