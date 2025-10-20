import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import QuickUpload from "@/components/quick-upload";
import DiffViewModal from "@/components/diff-view-modal";
import ApiKeyDialog from "@/components/api-key-dialog";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { hasValidApiKey, getApiKey } from "@/lib/api-key-manager";

export default function QuickUpdate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [uploadedSections, setUploadedSections] = useState<Array<{ name: string; content: string }>>([]);
  const [uploadedLatex, setUploadedLatex] = useState<string>("");
  const [jobDescription, setJobDescription] = useState("");
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<{
    original: Array<{ name: string; content: string }>;
    optimized: Array<{ name: string; content: string }>;
  } | null>(null);
  const [optimizedLatex, setOptimizedLatex] = useState<string>("");

  // Batch optimize mutation
  const batchOptimizeMutation = useMutation({
    mutationFn: async (data: {
      sections: Array<{ header: string; content: string }>;
      jobDescription: string;
      apiKey: string;
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

  // Full resume optimization mutation
  const fullOptimizeMutation = useMutation({
    mutationFn: async (data: {
      latexContent: string;
      jobDescription: string;
      apiKey: string;
    }) => {
      const response = await apiRequest("POST", "/api/optimize-full-resume", data);
      return response.json();
    },
    onSuccess: (result) => {
      setOptimizedLatex(result.optimizedLatex);
      toast({
        title: "Full Resume Optimized",
        description: "Your complete resume has been optimized. Check the LaTeX editor below.",
      });
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
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

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

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    const sections = uploadedSections.map(section => ({
      header: section.name,
      content: section.content,
    }));

    batchOptimizeMutation.mutate({
      sections,
      jobDescription,
      apiKey,
    });
  };

  const handleAcceptOptimization = () => {
    setShowDiffModal(false);
    toast({
      title: "Optimization completed",
      description: "Your resume has been optimized! You can now download it.",
    });
  };

  const handleFullOptimization = () => {
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please provide a job description for optimization.",
        variant: "destructive",
      });
      return;
    }

    if (!uploadedLatex) {
      toast({
        title: "No resume uploaded",
        description: "Please upload a resume file first.",
        variant: "destructive",
      });
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    fullOptimizeMutation.mutate({
      latexContent: uploadedLatex,
      jobDescription,
      apiKey,
    });
  };

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-background overflow-hidden relative">
        <Navbar currentPage="quick-update" />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8 blur-sm">
          <div className="max-w-4xl mx-auto">
            {/* Existing content is blurred */}
          </div>
        </main>

        {/* Coming Soon Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center p-8 bg-background rounded-lg shadow-2xl">
            <h2 className="text-4xl font-bold mb-4 text-primary">Coming Soon!</h2>
            <p className="text-muted-foreground text-xl">
              We're putting the final touches on this feature. It'll be worth the wait!
            </p>
            <Button onClick={() => setLocation("/")} className="mt-6">
              Back to Homepage
            </Button>
          </div>
        </div>

        {/* Modals and Dialogs (kept for structure, but won't be reachable) */}
        <DiffViewModal
          open={false}
          onOpenChange={() => {}}
          original=""
          optimized=""
          changes={[]}
          onAccept={() => {}}
          isApplying={false}
        />
        <ApiKeyDialog
          open={false}
          onOpenChange={() => {}}
          onApiKeySet={() => {}}
        />
      </div>
    </ProtectedRoute>
  );
}


// return (
//     <ProtectedRoute>
//       <div className="h-screen flex flex-col bg-background overflow-hidden">
//         <Navbar currentPage="quick-update" />

//       {/* Main Content */}
//       <main className="flex-1 overflow-auto p-8">
//         <div className="max-w-4xl mx-auto">
//           <div className="mb-8">
//             <Button
//               variant="ghost"
//               onClick={() => setLocation("/edit")}
//               className="mb-4"
//               data-testid="back-to-editor"
//             >
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Editor
//             </Button>
//             <h2 className="text-2xl font-bold mb-2">Quick Resume Update</h2>
//             <p className="text-muted-foreground">
//               Upload your existing resume and optimize it for a specific job description using AI.
//             </p>
//           </div>

//           {/* Step 1: File Upload */}
//           <Card className="mb-6">
//             <CardHeader>
//               <CardTitle>Step 1: Upload Your Resume</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <QuickUpload
//                 onUploadSuccess={(sections, latex) => {
//                   setUploadedSections(sections);
//                   setUploadedLatex(latex);
//                 }}
//                 data-testid="resume-upload"
//               />
//             </CardContent>
//           </Card>

//           {/* Step 2: Job Description */}
//           <Card className="mb-6">
//             <CardHeader>
//               <CardTitle>Step 2: Job Description</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-2">
//                   Paste the job description you're applying for:
//                 </label>
//                 <Textarea
//                   value={jobDescription}
//                   onChange={(e) => setJobDescription(e.target.value)}
//                   className="h-40 resize-none overflow-auto"
//                   placeholder="We are looking for a Senior Backend Engineer with experience in microservices, APIs, and distributed systems..."
//                   data-testid="job-description-input"
//                 />
//               </div>
//               <div className="flex items-center space-x-4">
//                 <Button variant="secondary" size="sm" data-testid="paste-clipboard">
//                   <i className="fas fa-paste mr-2"></i>Paste from Clipboard
//                 </Button>
//                 <Button variant="secondary" size="sm" data-testid="import-url">
//                   <i className="fas fa-link mr-2"></i>Import from URL
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Step 3: Optimization Options */}
//           <Card className="mb-6">
//             <CardHeader>
//               <CardTitle>Step 3: Optimization Settings</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="font-medium mb-3">Optimization Level</h4>
//                   <div className="space-y-2">
//                     <label className="flex items-center space-x-3">
//                       <input type="radio" name="optimization" value="quick" className="text-primary" defaultChecked />
//                       <div>
//                         <div className="font-medium text-sm">Quick Optimization</div>
//                         <div className="text-xs text-muted-foreground">
//                           Fast AI-powered keyword matching and phrasing improvements
//                         </div>
//                       </div>
//                     </label>
//                     <label className="flex items-center space-x-3">
//                       <input type="radio" name="optimization" value="comprehensive" className="text-primary" />
//                       <div>
//                         <div className="font-medium text-sm">Comprehensive Rewrite</div>
//                         <div className="text-xs text-muted-foreground">
//                           Deep content restructuring and enhancement
//                         </div>
//                       </div>
//                     </label>
//                   </div>
//                 </div>
//                 <div>
//                   <h4 className="font-medium mb-3">ATS Optimization</h4>
//                   <div className="space-y-2">
//                     <label className="flex items-center space-x-3">
//                       <input type="checkbox" className="text-primary" defaultChecked />
//                       <span className="text-sm">Optimize for Applicant Tracking Systems</span>
//                     </label>
//                     <label className="flex items-center space-x-3">
//                       <input type="checkbox" className="text-primary" />
//                       <span className="text-sm">Include industry-specific keywords</span>
//                     </label>
//                     <label className="flex items-center space-x-3">
//                       <input type="checkbox" className="text-primary" />
//                       <span className="text-sm">Quantify achievements with metrics</span>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Action Buttons */}
//           <div className="flex items-center justify-between">
//             <Button variant="secondary" data-testid="save-draft">
//               <i className="fas fa-save mr-2"></i>Save as Draft
//             </Button>
//             <div className="flex gap-3">
//               <Button
//                 size="lg"
//                 onClick={handleStartOptimization}
//                 disabled={batchOptimizeMutation.isPending}
//                 data-testid="start-optimization"
//               >
//                 {batchOptimizeMutation.isPending ? (
//                   <>
//                     <i className="fas fa-spinner animate-spin mr-2"></i>
//                     Optimizing...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-magic mr-2"></i>
//                     Quick Optimization
//                   </>
//                 )}
//               </Button>
//               <Button
//                 size="lg"
//                 variant="default"
//                 onClick={handleFullOptimization}
//                 disabled={fullOptimizeMutation.isPending}
//                 data-testid="full-optimization"
//               >
//                 {fullOptimizeMutation.isPending ? (
//                   <>
//                     <i className="fas fa-spinner animate-spin mr-2"></i>
//                     Optimizing Full Resume...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fas fa-wand-magic-sparkles mr-2"></i>
//                     Full Resume Optimization
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>

//           {/* Optimized LaTeX Display */}
//           {optimizedLatex && (
//             <Card className="mt-6">
//               <CardHeader>
//                 <CardTitle>Optimized Resume (LaTeX)</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <Textarea
//                   value={optimizedLatex}
//                   readOnly
//                   className="h-96 font-mono text-sm resize-none overflow-auto"
//                   data-testid="optimized-latex"
//                 />
//                 <div className="mt-4 flex gap-3">
//                   <Button
//                     onClick={() => {
//                       navigator.clipboard.writeText(optimizedLatex);
//                       toast({
//                         title: "Copied to clipboard",
//                         description: "LaTeX code has been copied to your clipboard.",
//                       });
//                     }}
//                   >
//                     <i className="fas fa-copy mr-2"></i>Copy LaTeX
//                   </Button>
//                   <Button
//                     variant="secondary"
//                     onClick={() => {
//                       const blob = new Blob([optimizedLatex], { type: 'text/plain' });
//                       const url = URL.createObjectURL(blob);
//                       const a = document.createElement('a');
//                       a.href = url;
//                       a.download = 'optimized-resume.tex';
//                       a.click();
//                       URL.revokeObjectURL(url);
//                     }}
//                   >
//                     <i className="fas fa-download mr-2"></i>Download .tex
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </main>

//       {/* Diff Modal */}
//       <DiffViewModal
//         open={showDiffModal}
//         onOpenChange={setShowDiffModal}
//         original={optimizationResult?.original.map(s => s.content).join('\n\n') || ""}
//         optimized={optimizationResult?.optimized.map(s => s.content).join('\n\n') || ""}
//         changes={[]}
//         onAccept={handleAcceptOptimization}
//         isApplying={false}
//         data-testid="batch-diff-modal"
//       />

//       {/* API Key Dialog */}
//       <ApiKeyDialog
//         open={showApiKeyDialog}
//         onOpenChange={setShowApiKeyDialog}
//         onApiKeySet={() => {
//           setShowApiKeyDialog(false);
//           toast({
//             title: 'API Key Saved',
//             description: 'You can now use AI-powered optimization features.',
//           });
//         }}
//       />
//     </div>
//     </ProtectedRoute>
//   );
// }
