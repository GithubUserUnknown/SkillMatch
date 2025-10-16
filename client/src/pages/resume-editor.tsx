import { useState, useEffect, useRef } from "react";

interface ResumeSection {
  name: string;
  content: string;
  startLine: number;
  endLine: number;
}

interface SavedVersion {
  name: string;
  content: string;
  timestamp: string;
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
import TemplateSelector from "@/components/template-selector";
import ApiKeyDialog from "@/components/api-key-dialog";
import Navbar from "@/components/Navbar";
import { Play, FileText, History, Palette } from "lucide-react";
import { defaultTemplate, templates } from "@/lib/template-loader";
import { apiRequest } from "@/lib/queryClient";
import type { Template } from "@/lib/template-loader";
import { hasValidApiKey, getApiKey } from "@/lib/api-key-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

export default function ResumeEditor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [latexContent, setLatexContent] = useState(defaultTemplate.content);
  const [showOptimizeModal, setShowOptimizeModal] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState('modern');
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'templates' | 'versions'>('sections');
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const isSavingRef = useRef(false);
  const editorRef = useRef<LatexEditorRef>(null);
  const hasCompiledOnLoad = useRef(false);
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

  // Cache key for localStorage
  const CACHE_KEY = 'skillmatch_latex_cache';
  const CACHE_EXPIRY_DAYS = 30;

  // Load cached content on mount
  useEffect(() => {
    const loadCachedContent = () => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { content, timestamp } = JSON.parse(cached);
          const now = new Date().getTime();
          const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 30 days in milliseconds

          // Check if cache is still valid
          if (now - timestamp < expiryTime) {
            setLatexContent(content);
            console.log('Loaded LaTeX content from cache');
          } else {
            // Cache expired, remove it
            localStorage.removeItem(CACHE_KEY);
            console.log('Cache expired, removed');
          }
        }
      } catch (error) {
        console.error('Error loading cached content:', error);
      }
    };

    loadCachedContent();
  }, []);

  // Load saved versions from localStorage
  useEffect(() => {
    try {
      const versions = localStorage.getItem('latex_versions');
      if (versions) {
        setSavedVersions(JSON.parse(versions));
      }
    } catch (error) {
      console.error('Error loading saved versions:', error);
    }
  }, []);

  // Save to cache whenever content changes (debounced)
  useEffect(() => {
    const saveToCacheDebounced = setTimeout(() => {
      try {
        const cacheData = {
          content: latexContent,
          timestamp: new Date().getTime()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('Saved LaTeX content to cache');
      } catch (error) {
        console.error('Error saving to cache:', error);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(saveToCacheDebounced);
  }, [latexContent]);

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

  // Helper function to update cache
  const updateCache = (content: string) => {
    try {
      const cacheData = {
        content: content,
        timestamp: new Date().getTime()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log('Cache updated on save');
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  };

  // Update resume mutation
  const updateResumeMutation = useMutation({
    mutationFn: async (data: { id: string; latexContent: string }) => {
      const response = await apiRequest("PUT", `/api/resumes/${data.id}`, {
        latexContent: data.latexContent,
      });
      return response.json();
    },
    onSuccess: (_, variables) => {
      // Update cache with the saved content
      updateCache(variables.latexContent);
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
      // Get API key
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("API key is required");
      }

      const response = await apiRequest(
        "POST",
        `/api/resumes/${currentResumeId}/optimize-section`,
        { ...data, apiKey }
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
        latexContent: defaultTemplate.content,
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
      // Reset compilation flag when resume changes
      hasCompiledOnLoad.current = false;
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

  // Compile on first load
  useEffect(() => {
    if (currentResumeId && currentResume && !hasCompiledOnLoad.current) {
      if (!compileMutation.isPending && !updateResumeMutation.isPending) {
        // Auto-compile the resume on first load
        compileMutation.mutate(currentResumeId);
        hasCompiledOnLoad.current = true;
      }
    }
  }, [currentResumeId, currentResume, compileMutation.isPending, updateResumeMutation.isPending]);


  const handleOptimizeSection = (sectionName: string) => {
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

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

  const handleApplyOptimization = (editedContent?: string) => {
    if (!optimizationResult) return;

    applyOptimizationMutation.mutate({
      sectionName: selectedSection,
      optimizedContent: editedContent || optimizationResult.optimized,
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

  const handleSelectTemplate = (template: Template) => {
    setLatexContent(template.content);
    setCurrentTemplateId(template.id);
  };

  const handleQuickSelectTemplate = (template: Template) => {
    setLatexContent(template.content);
    setCurrentTemplateId(template.id);
    toast({ title: "Template applied", description: `${template.name} template has been applied` });
  };

  const handleRestoreVersion = (version: SavedVersion) => {
    setLatexContent(version.content);
    toast({
      title: "Version restored",
      description: `Restored version: ${version.name}`
    });
  };

  const handleDeleteVersion = (timestamp: string) => {
    const updatedVersions = savedVersions.filter(v => v.timestamp !== timestamp);
    setSavedVersions(updatedVersions);
    localStorage.setItem('latex_versions', JSON.stringify(updatedVersions));
    toast({ title: "Version deleted" });
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar currentPage="resume-editor" />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar with Tabs - 20% width */}
        <div className="w-1/6 min-w-0 border-r border-border bg-card flex flex-col">
          <Tabs value={sidebarTab} onValueChange={(value) => setSidebarTab(value as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
              <TabsTrigger value="sections" className="text-xs">
                <FileText className="h-3 w-3 mr-1" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="versions" className="text-xs">
                <History className="h-3 w-3 mr-1" />
                Versions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="flex-1 overflow-hidden m-0">
              <SectionSidebar
                sections={currentSections}
                onOptimizeSection={handleOptimizeSection}
                onSectionClick={handleSectionClick}
                data-testid="section-sidebar"
              />
            </TabsContent>

            <TabsContent value="templates" className="flex-1 overflow-auto m-0 p-3">
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      currentTemplateId === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleQuickSelectTemplate(template)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        {currentTemplateId === template.id && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs">{template.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-auto m-0 p-3">
              <div className="space-y-2">
                {savedVersions.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No saved versions yet</p>
                    <p className="text-xs mt-1">Use Save button in editor to create versions</p>
                  </div>
                ) : (
                  savedVersions.map((version) => (
                    <Card key={version.timestamp} className="cursor-pointer hover:shadow-md">
                      <CardHeader className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm truncate">{version.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(version.timestamp).toLocaleString()}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 flex-1"
                            onClick={() => handleRestoreVersion(version)}
                          >
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVersion(version.timestamp);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Resizable LaTeX Editor and PDF Preview */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full border-r border-border">
              <LatexEditor
                ref={editorRef}
                content={latexContent}
                data-testid="latex-editor"
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={60} minSize={20}>
            <div className="h-full">
              <PdfPreview
                resumeId={currentResumeId}
                onDownload={handleDownload}
                pdfUrl={currentResume?.pdfUrl}
                compilationError={compilationError}
                onErrorLineClick={handleErrorLineClick}
                data-testid="pdf-preview"
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      {/* Floating Buttons */}
      <div className="fixed bottom-6 left-6 flex flex-col space-y-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setShowTemplateSelector(true)}
          title="Choose a template"
        >
          <FileText className="h-5 w-5 mr-2" />
          Templates
        </Button>
        <Button
          className="floating-compile-btn"
          size="lg"
          onClick={handleSaveAndCompile}
          disabled={compileMutation.isPending || updateResumeMutation.isPending}
          data-testid="floating-compile-btn"
        >
          <Play className="h-5 w-5" />
        </Button>
      </div>

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

      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={currentTemplateId}
      />

      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onApiKeySet={() => {
          setShowApiKeyDialog(false);
          toast({
            title: 'API Key Saved',
            description: 'You can now use AI-powered optimization features.',
          });
        }}
      />
    </div>
  );
}


