import { useState, useEffect, useRef } from "react";

interface ResumeSection {
  name: string;
  content: string;
  startLine: number;
  endLine: number;
}

// Function to extract sections from LaTeX content (client-side version)
function extractSectionsFromLatex(latexContent: string): ResumeSection[] {
  const lines = latexContent.split('\n');
  const sections: ResumeSection[] = [];

  // Regex to match \section{} and \section*{} commands
  const sectionRegex = /\\section\*?\{([^}]+)\}/;

  const sectionLines: Array<{ lineIndex: number; name: string }> = [];

  // Find all section lines
  lines.forEach((line, index) => {
    const match = line.match(sectionRegex);
    if (match) {
      sectionLines.push({
        lineIndex: index,
        name: match[1].trim()
      });
    }
  });

  // Extract content between sections
  for (let i = 0; i < sectionLines.length; i++) {
    const currentSection = sectionLines[i];
    const nextSection = sectionLines[i + 1];

    const startLine = currentSection.lineIndex;
    const endLine = nextSection ? nextSection.lineIndex : lines.length;

    // Get content from the line after the section header to the line before the next section
    const contentStartLine = startLine + 1;
    const contentEndLine = endLine;

    const content = lines.slice(contentStartLine, contentEndLine).join('\n').trim();

    if (content) {
      sections.push({
        name: currentSection.name,
        content,
        startLine: startLine + 1, // Use the actual section line (1-based)
        endLine: contentEndLine
      });
    }
  }

  return sections;
}

interface Resume {
  id: string;
  name: string;
  latexContent: string;
  pdfUrl?: string;
  sections: ResumeSection[];
}

import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SectionSidebar from "@/components/section-sidebar";
import LatexEditor, { LatexEditorRef } from "@/components/latex-editor";
import PdfPreview from "@/components/pdf-preview";
import OptimizeModal from "@/components/optimize-modal";
import DiffViewModal from "@/components/diff-view-modal";
import { Play, Moon, User, FileText, Edit, Zap, Target } from "lucide-react";
import { defaultLatexTemplate } from "@/lib/latex-templates";
import { apiRequest } from "@/lib/queryClient";

export default function ResumeEditor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [latexContent, setLatexContent] = useState(defaultLatexTemplate);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const isSavingRef = useRef(false);
  const editorRef = useRef<LatexEditorRef>(null);
  const [optimizationResult, setOptimizationResult] = useState<{
    original: string;
    optimized: string;
    changes: string[];
  } | null>(null);

  // State for manually updated sections (updated only on Ctrl+S)
  const [currentSections, setCurrentSections] = useState<ResumeSection[]>([]);

  // State for compilation errors
  const [compilationError, setCompilationError] = useState<{
    error: string;
    errorLine?: number;
    errorMessage?: string;
    logs?: string;
  } | null>(null);

  // Fetch resumes
  const { data: resumes = [] } = useQuery({
    queryKey: ["/api/resumes"],
  });

  // Fetch current resume
  const { data: currentResume } = useQuery<Resume>({
    queryKey: ["/api/resumes", currentResumeId],
    enabled: !!currentResumeId,
  });

  // Create resume mutation
  const createResumeMutation = useMutation({
    mutationFn: async (data: { name: string; latexContent: string; template: string }) => {
      const response = await apiRequest("POST", "/api/resumes", data);
      return response.json();
    },
    onSuccess: (resume) => {
      setCurrentResumeId(resume.id);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
      toast({ title: "Resume created successfully" });
    },
  });

  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async (data: { id: string; latexContent: string }) => {
      const response = await apiRequest("PUT", `/api/resumes/${data.id}`, {
        latexContent: data.latexContent,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", currentResumeId] });
    },
  });

  // Compile resume mutation
  const compileMutation = useMutation({
    mutationFn: async (id: string) => {
      // Use fetch directly to handle error responses properly
      const response = await fetch(`/api/resumes/${id}/compile`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      // If compilation failed, throw error with details
      if (!response.ok || !data.success) {
        throw {
          message: data.error || "Compilation failed",
          errorLine: data.errorLine,
          errorMessage: data.errorMessage,
          logs: data.logs
        };
      }

      return data;
    },
    onSuccess: () => {
      // Clear any previous compilation errors
      setCompilationError(null);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", currentResumeId] });
      toast({ title: "Resume compiled successfully" });
    },
    onError: (error: any) => {
      // Set compilation error state
      setCompilationError({
        error: error.message || "Compilation failed",
        errorLine: error.errorLine,
        errorMessage: error.errorMessage,
        logs: error.logs
      });

      toast({
        title: "Compilation failed",
        description: error.errorMessage || error.message,
        variant: "destructive"
      });
    },
  });

  // Optimize section mutation
  const optimizeSectionMutation = useMutation({
    mutationFn: async (data: {
      section: string;
      currentContent: string;
      jobDescription: string;
      additionalDetails?: string;
    }) => {
      const response = await apiRequest(
        "POST", 
        `/api/resumes/${currentResumeId}/optimize-section`, 
        data
      );
      return response.json();
    },
    onSuccess: (result) => {
      setOptimizationResult({
        original: optimizeSectionMutation.variables!.currentContent,
        optimized: result.optimizedContent,
        changes: result.changes,
      });
      setShowOptimizeModal(false);
      setShowDiffModal(true);
    },
  });

  // Apply optimization mutation
  const applyOptimizationMutation = useMutation({
    mutationFn: async (data: { sectionName: string; optimizedContent: string }) => {
      const response = await apiRequest(
        "POST",
        `/api/resumes/${currentResumeId}/apply-optimization`,
        data
      );
      return response.json();
    },
    onSuccess: (resume) => {
      setLatexContent(resume.latexContent);
      setShowDiffModal(false);
      queryClient.invalidateQueries({ queryKey: ["/api/resumes", currentResumeId] });
      toast({ title: "Optimization applied successfully" });
    },
  });

  // Initialize with default resume if none exists
  useEffect(() => {
    if (Array.isArray(resumes) && resumes.length === 0 && !createResumeMutation.isPending) {
      createResumeMutation.mutate({
        name: "My Resume",
        latexContent: defaultLatexTemplate,
        template: "modern",
      });
    } else if (Array.isArray(resumes) && resumes.length > 0 && !currentResumeId) {
      setCurrentResumeId(resumes[0].id);
    }
  }, [resumes, createResumeMutation.isPending, currentResumeId]);

  // Update latex content when resume data changes (but not during save operations)
  useEffect(() => {
    if (currentResume && currentResumeId && !isSavingRef.current) {
      setLatexContent(currentResume.latexContent);
      // Extract sections from the loaded content
      const sections = extractSectionsFromLatex(currentResume.latexContent);
      setCurrentSections(sections);
    }
  }, [currentResume?.latexContent, currentResumeId]);

  // Initialize sections from default template on first load
  useEffect(() => {
    if (!currentResumeId && latexContent) {
      const sections = extractSectionsFromLatex(latexContent);
      setCurrentSections(sections);
    }
  }, [currentResumeId, latexContent]);

  // Handle save and compile when Ctrl+S is pressed
  const handleSaveAndCompile = async () => {
    if (!currentResumeId || !currentResume || updateResumeMutation.isPending || compileMutation.isPending) {
      return;
    }

    // Get current content from editor
    const content = editorRef.current?.getContent() || latexContent;

    // Update sections from current editor content
    const updatedSections = extractSectionsFromLatex(content);
    setCurrentSections(updatedSections);

    // Update latexContent state
    setLatexContent(content);

    // Save to backend only if content changed
    if (content !== currentResume.latexContent) {
      isSavingRef.current = true;
      try {
        await updateResumeMutation.mutateAsync({
          id: currentResumeId,
          latexContent: content,
        });

        // Compile after saving
        await compileMutation.mutateAsync(currentResumeId);

        // Force PDF preview refresh
        queryClient.invalidateQueries({ queryKey: ['resume', currentResumeId] });

        toast({ title: "Resume compiled successfully" });
      } catch (error) {
        toast({
          title: "Compilation failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        // Reset the saving flag after a delay to allow the query to update
        setTimeout(() => {
          isSavingRef.current = false;
        }, 1000);
      }
    } else {
      // Content hasn't changed, just compile
      try {
        await compileMutation.mutateAsync(currentResumeId);
        queryClient.invalidateQueries({ queryKey: ['resume', currentResumeId] });
        toast({ title: "Resume compiled successfully" });
      } catch (error) {
        toast({
          title: "Compilation failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    }
  };

  // Global Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSaveAndCompile();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentResumeId, currentResume, updateResumeMutation.isPending, compileMutation.isPending]);

  const handleOptimizeSection = (sectionName: string) => {
    setSelectedSection(sectionName);
    setShowOptimizeModal(true);
  };

  const handleSectionClick = (_sectionName: string, startLine: number) => {
    if (editorRef.current) {
      editorRef.current.scrollToLine(startLine);
    }
  };

  const handleErrorLineClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.scrollToLine(line);
    }
  };

  const handleOptimizationSubmit = (data: {
    jobDescription: string;
    additionalDetails?: string;
  }) => {
    if (!currentResume) return;

    const section = currentSections.find((s: ResumeSection) => s.name === selectedSection);
    if (!section) return;

    optimizeSectionMutation.mutate({
      section: selectedSection,
      currentContent: section.content,
      jobDescription: data.jobDescription,
      additionalDetails: data.additionalDetails,
    });
  };

  const handleApplyOptimization = () => {
    if (!optimizationResult) return;

    applyOptimizationMutation.mutate({
      sectionName: selectedSection,
      optimizedContent: optimizationResult.optimized,
    });
  };

  const handleDownload = async () => {
    if (!currentResumeId) return;

    // If no PDF exists yet, show a message
    if (!currentResume?.pdfUrl) {
      toast({
        title: "No PDF available",
        description: "Please compile your resume first by pressing Ctrl+S in the editor",
        variant: "destructive",
      });
    } else {
      window.open(`/api/resumes/${currentResumeId}/download`, '_blank');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
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
                className="bg-primary text-primary-foreground"
                data-testid="edit-mode-btn"
              >
                <Edit className="h-4 w-4 mr-2" />Edit Resume
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLocation("/quick-update")}
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
      <main className="flex-1 flex overflow-hidden">
        {/* Resume Sections - 20% width */}
        <div className="w-1/5 min-w-0">
          <SectionSidebar
            sections={currentSections}
            onOptimizeSection={handleOptimizeSection}
            onSectionClick={handleSectionClick}
            data-testid="section-sidebar"
          />
        </div>

        {/* LaTeX Editor - 40% width */}
        <div className="w-2/5 min-w-0 border-r border-border">
          <LatexEditor
            ref={editorRef}
            content={latexContent}
            data-testid="latex-editor"
          />
        </div>

        {/* PDF Preview - 40% width */}
        <div className="w-2/5 min-w-0">
          <PdfPreview
            resumeId={currentResumeId}
            onDownload={handleDownload}
            pdfUrl={currentResume?.pdfUrl}
            compilationError={compilationError}
            onErrorLineClick={handleErrorLineClick}
            data-testid="pdf-preview"
          />
        </div>
      </main>

      {/* Floating Compile Button */}
      <Button
        className="floating-compile-btn"
        size="lg"
        onClick={handleSaveAndCompile}
        disabled={compileMutation.isPending || updateResumeMutation.isPending}
        data-testid="floating-compile-btn"
      >
        <Play className="h-5 w-5" />
      </Button>

      {/* Modals */}
      <OptimizeModal
        open={showOptimizeModal}
        onOpenChange={setShowOptimizeModal}
        sectionName={selectedSection}
        onSubmit={handleOptimizationSubmit}
        isLoading={optimizeSectionMutation.isPending}
        data-testid="optimize-modal"
      />

      <DiffViewModal
        open={showDiffModal}
        onOpenChange={setShowDiffModal}
        original={optimizationResult?.original || ""}
        optimized={optimizationResult?.optimized || ""}
        changes={optimizationResult?.changes || []}
        onAccept={handleApplyOptimization}
        isApplying={applyOptimizationMutation.isPending}
        data-testid="diff-view-modal"
      />
    </div>
  );
}


