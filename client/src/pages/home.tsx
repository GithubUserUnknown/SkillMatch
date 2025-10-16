import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import ChatBubble from "@/components/chat-bubble";
import ApiKeyDialog from "@/components/api-key-dialog";
import { hasValidApiKey, getApiKey } from "@/lib/api-key-manager";
import {
  Upload,
  FileText,
  Target,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  Edit,
  Loader2,
  Sparkles,
  BookOpen,
  Award,
  Code,
  Clock,
  ExternalLink,
  Key
} from "lucide-react";

/**
 * SkillMatch – Home Dashboard
 * -------------------------------------------------
 * Flow: Resume Text + JD → Score → Show Match + Gaps + ATS Report + Recommendations
 */

const API_BASE = "/api";

type ParsedResume = { skills: string[]; summary?: string | null };
type ParsedJD = { title: string; skills_required: string[]; keywords: string[] };

type MatchBreakdown = {
  skill_overlap: number;
  keyword_coverage: number;
  role_priorities_hit: number;
};

type MatchResponse = {
  score: number;
  breakdown: MatchBreakdown;
  gaps: string[];
  notes: string[];
};

type ATSResponse = { issues: string[]; passed_checks: string[] };

type RecoResponse = { certs: Record<string, string[]>; projects: Record<string, string[]> };

type ProjectIdea = {
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  keyFeatures: string[];
};

type CertificateRecommendation = {
  name: string;
  provider: string;
  relevance: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  url?: string;
};

type AIRecommendations = {
  projects: ProjectIdea[];
  certificates: CertificateRecommendation[];
};

export default function Home() {
  const [, setLocation] = useLocation();
  const [resumeText, setResumeText] = useState("");
  const [jdTitle, setJdTitle] = useState("");
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);

  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [parsedJD, setParsedJD] = useState<ParsedJD | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [ats, setAts] = useState<ATSResponse | null>(null);
  const [recos, setRecos] = useState<RecoResponse | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendations | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  const scorePct = useMemo(() => Math.round((match?.score || 0) * 100), [match]);

  async function handleScore() {
    setLoading(true);
    setMatch(null);
    setRecos(null);
    setAts(null);
    try {
      // Parse resume
      const pr = await fetch(`${API_BASE}/skillmatch/parse/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: resumeText }),
      }).then((r) => r.json());

      // Parse JD
      const pj = await fetch(`${API_BASE}/skillmatch/parse/jd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: jdTitle || "", text: jdText }),
      }).then((r) => r.json());

      setParsedResume(pr);
      setParsedJD(pj);

      // Match
      const mm = await fetch(`${API_BASE}/skillmatch/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: pr, jd: pj }),
      }).then((r) => r.json());

      setMatch(mm);

      // Recommendations based on gaps
      if (mm?.gaps?.length) {
        const rr = await fetch(`${API_BASE}/skillmatch/recommendations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gaps: mm.gaps }),
        }).then((r) => r.json());
        setRecos(rr);
      } else {
        setRecos({ certs: {}, projects: {} });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to score. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleATS() {
    if (!resumeText) return alert("Paste your resume text first.");
    setAtsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/skillmatch/ats/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      }).then((r) => r.json());
      setAts(res);
    } catch (e) {
      console.error(e);
      alert("Failed to run ATS check.");
    } finally {
      setAtsLoading(false);
    }
  }

  async function handleGenerateAIRecommendations() {
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

    if (!jdText || !match?.gaps) {
      return alert("Please run the skill match analysis first.");
    }

    setAiLoading(true);
    try {
      // Get API key
      const apiKey = getApiKey();
      if (!apiKey) {
        setShowApiKeyDialog(true);
        setAiLoading(false);
        return;
      }

      // Extract tech stack from parsed JD
      const techStack = parsedJD?.skills_required || [];

      // Generate project ideas
      const projectsResponse = await fetch(`${API_BASE}/ai/project-ideas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jdText,
          techStack: techStack,
          skillGaps: match.gaps,
          apiKey: apiKey
        }),
      }).then((r) => r.json());

      // Generate certificate recommendations
      const certsResponse = await fetch(`${API_BASE}/ai/certificate-recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: jdText,
          skillGaps: match.gaps,
          apiKey: apiKey
        }),
      }).then((r) => r.json());

      setAiRecommendations({
        projects: projectsResponse.projects || [],
        certificates: certsResponse.certificates || []
      });
    } catch (e) {
      console.error(e);
      alert("Failed to generate AI recommendations. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle text files directly
    if (file.type.startsWith("text/") || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => setResumeText(String(reader.result || ""));
      reader.readAsText(file);
      return;
    }

    // Handle PDF and DOCX files via API
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert("Please upload a TXT, PDF, DOC, or DOCX file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB.");
      return;
    }

    // Upload and parse PDF/DOCX
    setAtsLoading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to parse file');
      }

      const data = await response.json();

      // Extract text from parsed sections
      const extractedText = data.sections
        .map((section: { name: string; content: string }) =>
          `${section.name}\n${section.content}`
        )
        .join('\n\n');

      setResumeText(extractedText);
      alert(`Successfully parsed ${file.name}!`);
    } catch (error) {
      console.error(error);
      alert("Failed to parse file. Please try a different format or paste the text manually.");
    } finally {
      setAtsLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar currentPage="home" />

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl mb-4 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-bold">
              Tailor Your Resume to Any Job in Seconds
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI-powered resume optimization with ATS compatibility checking and real-time job matching scores.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => setLocation("/resume-editor")} className="flex items-center space-x-2">
                <Edit className="h-5 w-5" />
                <span>Create New Resume</span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/quick-update")} className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Quick Update</span>
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-12">
            {/* ATS Check Tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>ATS Compatibility Check</span>
                </CardTitle>
                <CardDescription>
                  Upload your resume to check how well it passes through Applicant Tracking Systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <Input
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,text/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload your resume (TXT, PDF, DOC, DOCX)
                    </p>
                  </label>
                </div>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="min-h-[120px]"
                  placeholder="Or paste your resume text here..."
                />
                <Button onClick={handleATS} disabled={atsLoading || !resumeText} className="w-full">
                  {atsLoading ? "Running ATS Check..." : "Run ATS Check"}
                </Button>
              </CardContent>
            </Card>

            {/* Job Match Tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Job Match Score</span>
                </CardTitle>
                <CardDescription>
                  Paste a job description to see how well your resume matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={jdTitle}
                  onChange={(e) => setJdTitle(e.target.value)}
                  placeholder="Job title (e.g., Senior Software Engineer)"
                />
                <Textarea
                  placeholder="Paste the job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="min-h-[212px]"
                />

                <Button
                  onClick={handleScore}
                  disabled={loading || !resumeText || !jdText}
                  className="w-full"
                >
                  {loading ? "Calculating..." : "Calculate Match Score"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Match Results */}
          {match && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="rounded-2xl shadow-sm lg:col-span-1">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Match Score</h3>
                    {getScoreIcon(scorePct)}
                  </div>
                  <div className={`text-4xl font-semibold ${getScoreColor(scorePct)}`}>{scorePct}%</div>
                  <Progress value={scorePct} />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Skill overlap:</span>
                      <span>{(match.breakdown.skill_overlap * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Keyword coverage:</span>
                      <span>{(match.breakdown.keyword_coverage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role-priority hits:</span>
                      <span>{match.breakdown.role_priorities_hit}</span>
                    </div>
                  </div>
                  {!!match.notes?.length && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-2">Suggestions:</p>
                      <ul className="text-sm space-y-1">
                        {match.notes.map((n, i) => (
                          <li key={i}>• {n}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-2xl shadow-sm lg:col-span-2">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium">Skill Gaps & Recommendations</h3>
                  {match.gaps.length ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Missing skills:</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {match.gaps.map((g) => (
                          <Badge key={g} variant="outline" className="px-3 py-1 rounded-full">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No critical gaps detected. Nice!</p>
                  )}

                  {/* Recommendations */}
                  {recos && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <h4 className="font-medium mb-2">Recommended Certificates</h4>
                        {Object.keys(recos.certs).length ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {Object.entries(recos.certs).map(([skill, certs]) => (
                              <li key={skill}>
                                <span className="font-semibold">{skill}:</span> {certs.join(", ")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm">No certificate suggestions yet.</p>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Project Ideas</h4>
                        {Object.keys(recos.projects).length ? (
                          <ul className="list-disc pl-5 space-y-1 text-sm">
                            {Object.entries(recos.projects).map(([skill, projects]) => (
                              <li key={skill}>
                                <span className="font-semibold">{skill}:</span> {projects.join(", ")}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm">No project suggestions yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI-Powered Recommendations Button */}
                  {match.gaps.length > 0 && !aiRecommendations && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        onClick={handleGenerateAIRecommendations}
                        disabled={aiLoading}
                        className="w-full"
                        size="lg"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Generating AI Recommendations...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Get AI-Powered Project Ideas & Certificates
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        {aiLoading
                          ? "This may take 10-15 seconds. Please wait..."
                          : "Get personalized project ideas and certificate recommendations using AI"
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* AI Loading State */}
          {aiLoading && !aiRecommendations && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card className="rounded-2xl shadow-sm border-2 border-primary/20">
                <CardContent className="p-12">
                  <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                      <Sparkles className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-bold">Generating AI Recommendations</h3>
                      <p className="text-muted-foreground max-w-md">
                        Our AI is analyzing your profile and creating personalized project ideas and certificate recommendations...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This usually takes 10-15 seconds
                      </p>
                    </div>
                    <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>Analyzing tech stack</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4" />
                        <span>Finding projects</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4" />
                        <span>Matching certificates</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* AI Recommendations Section */}
          {aiRecommendations && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">AI-Powered Recommendations</h2>
                <Button
                  onClick={handleGenerateAIRecommendations}
                  disabled={aiLoading}
                  variant="outline"
                  size="sm"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>

              {/* Project Ideas */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Recommended Projects</span>
                  </CardTitle>
                  <CardDescription>
                    Build these projects to demonstrate your skills and fill the gaps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiRecommendations.projects.map((project, idx) => (
                    <Card key={idx} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-lg">{project.title}</h4>
                          <Badge variant={
                            project.difficulty === 'Beginner' ? 'default' :
                            project.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                          }>
                            {project.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="font-medium">Tech Stack:</span>
                            <div className="flex flex-wrap gap-1">
                              {project.techStack.map((tech, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Estimated Time:</span> {project.estimatedTime}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Key Features:</span>
                            <ul className="list-disc pl-5 mt-1 space-y-1">
                              {project.keyFeatures.map((feature, i) => (
                                <li key={i}>{feature}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Certificate Recommendations */}
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Recommended Certifications</span>
                  </CardTitle>
                  <CardDescription>
                    Earn these certifications to validate your skills and stand out
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiRecommendations.certificates.map((cert, idx) => (
                    <Card key={idx} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground">{cert.provider}</p>
                          </div>
                          <Badge variant={
                            cert.difficulty === 'Beginner' ? 'default' :
                            cert.difficulty === 'Intermediate' ? 'secondary' : 'destructive'
                          }>
                            {cert.difficulty}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2">{cert.relevance}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            <span className="font-medium">Time:</span> {cert.estimatedTime}
                          </span>
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Learn More →
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* ATS Results */}
          {ats && (
            <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-medium">ATS – Passed Checks</h3>
                  </div>
                  {ats.passed_checks.length ? (
                    <div className="space-y-2 text-sm">
                      {ats.passed_checks.map((p, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No passes yet.</p>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <h3 className="text-lg font-medium">ATS – Issues</h3>
                  </div>
                  {ats.issues.length ? (
                    <div className="space-y-2 text-sm">
                      {ats.issues.map((p, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No issues detected 🎉</p>
                  )}
                </CardContent>
              </Card>
            </motion.section>
          )}

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Edit className="h-5 w-5" />
                  <span>Advanced Editor</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  LaTeX-powered resume editor with real-time preview and professional templates.
                </p>
                <Button variant="outline" onClick={() => setLocation("/resume-editor")}>
                  Try Editor
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Optimization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Instantly tailor your resume to any job description with AI-powered suggestions.
                </p>
                <Button variant="outline" onClick={() => setLocation("/quick-update")}>
                  Quick Update
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>ATS Ready</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Ensure your resume passes through any Applicant Tracking System with our compatibility checker.
                </p>
                <Button variant="outline" onClick={() => setLocation("/dashboard")}>
                  View Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Chat Bubble */}
      <ChatBubble />

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onApiKeySet={() => {
          setShowApiKeyDialog(false);
          // Retry the AI recommendations after API key is set
          if (jdText && match?.gaps) {
            handleGenerateAIRecommendations();
          }
        }}
      />
    </div>
  );
}

