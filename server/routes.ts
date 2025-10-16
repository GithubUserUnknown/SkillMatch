import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as path from "path";
import { fileURLToPath } from 'url';
import { optimizationRequestSchema, batchOptimizationRequestSchema } from "@shared/schema";
import { optimizeResumeSection, batchOptimizeResume, optimizeFullResume } from "./services/gemini";
import { compileLatex, extractSections, updateSectionInLatex } from "./services/latex";
import { parsePDFResume, parseDOCXResume, convertToLatex } from "./services/parser";
import * as fs from "fs/promises";
import * as skillmatch from "./services/skillmatch";
import * as chatbot from "./services/chatbot";
import { exec } from "child_process";
import { promisify } from "util";

// Get the directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all resumes for a user
  app.get("/api/resumes", async (req, res) => {
    try {
      // For demo purposes, using a default user ID
      const userId = "default-user";
      const resumes = await storage.getResumesByUserId(userId);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resumes" });
    }
  });

  // Get a specific resume
  app.get("/api/resumes/:id", async (req, res) => {
    try {
      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }
      res.json(resume);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch resume" });
    }
  });

  // Create a new resume
  app.post("/api/resumes", async (req, res) => {
    try {
      const { name, latexContent, template } = req.body;
      
      if (!name || !latexContent) {
        return res.status(400).json({ error: "Name and LaTeX content are required" });
      }

      const sections = extractSections(latexContent);
      
      const resume = await storage.createResume({
        userId: "default-user",
        name,
        latexContent,
        template: template || "modern",
        sections,
        pdfUrl: null
      });

      res.json(resume);
    } catch (error) {
      res.status(500).json({ error: "Failed to create resume" });
    }
  });

  // Update a resume
  app.put("/api/resumes/:id", async (req, res) => {
    try {
      const { latexContent } = req.body;

      if (!latexContent) {
        return res.status(400).json({ error: "LaTeX content is required" });
      }

      const sections = extractSections(latexContent);

      const resume = await storage.updateResume(req.params.id, {
        latexContent,
        sections
      });

      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      res.json(resume);
    } catch (error) {
      res.status(500).json({ error: "Failed to update resume" });
    }
  });

  // Compile LaTeX to PDF
  app.post("/api/resumes/:id/compile", async (req, res) => {
    try {
      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      // Pass resumeId to reuse the same filename (overwrite previous PDF)
      const result = await compileLatex(resume.latexContent, req.params.id);

      if (result.success && result.pdfPath) {
        // Store PDF path in resume
        await storage.updateResume(req.params.id, {
          pdfUrl: result.pdfPath
        });

        res.json({ success: true, pdfUrl: result.pdfPath });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          errorLine: result.errorLine,
          errorMessage: result.errorMessage,
          logs: result.logs
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to compile resume" });
    }
  });

  // Add PDF preview route
  app.get("/api/resumes/:id/preview", async (req, res) => {
    try {
      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      if (!resume.pdfUrl) {
        return res.status(404).json({ error: "PDF not compiled yet" });
      }

      // Serve the PDF file
      const pdfPath = path.join(PROJECT_ROOT, 'server', 'public', resume.pdfUrl);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(pdfPath);
    } catch (error) {
      console.error('PDF preview error:', error);
      res.status(500).json({ error: "Failed to serve PDF" });
    }
  });

  // Download PDF
  app.get("/api/resumes/:id/download", async (req, res) => {
    try {
      const resume = await storage.getResume(req.params.id);
      if (!resume || !resume.pdfUrl) {
        return res.status(404).json({ error: "PDF not found" });
      }

      // Convert HTTP path to file system path
      const pdfPath = path.join(process.cwd(), 'server', 'public', resume.pdfUrl);
      res.download(pdfPath, `${resume.name}.pdf`);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: "Failed to download PDF" });
    }
  });

  // Download as DOC (convert LaTeX to DOCX using pandoc)
  app.get("/api/resumes/:id/download-doc", async (req, res) => {
    try {
      const resume = await storage.getResume(req.params.id);
      if (!resume || !resume.latexContent) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const tempDir = path.join(process.cwd(), 'server', 'public', 'temp');
      await fs.mkdir(tempDir, { recursive: true });

      // Create unique filenames to avoid conflicts
      const timestamp = Date.now();
      const texPath = path.join(tempDir, `resume_${timestamp}.tex`);
      const docxPath = path.join(tempDir, `resume_${timestamp}.docx`);

      try {
        // Write LaTeX content to temp file
        await fs.writeFile(texPath, resume.latexContent);

        const execAsync = promisify(exec);

        // Try to find pandoc in common installation paths
        const possiblePandocPaths = [
          'pandoc', // System PATH
          'C:\\Program Files\\Pandoc\\pandoc.exe',
          'C:\\Program Files (x86)\\Pandoc\\pandoc.exe',
          path.join(process.env.LOCALAPPDATA || '', 'Pandoc', 'pandoc.exe'),
          path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Pandoc', 'pandoc.exe'),
        ];

        let pandocCommand = 'pandoc';
        let pandocFound = false;

        // Try each path until we find one that works
        for (const pandocPath of possiblePandocPaths) {
          try {
            await execAsync(`"${pandocPath}" --version`);
            pandocCommand = pandocPath;
            pandocFound = true;
            console.log(`Found pandoc at: ${pandocPath}`);
            break;
          } catch (err) {
            // Continue to next path
          }
        }

        if (!pandocFound) {
          throw new Error('Pandoc not found. Please install pandoc from https://pandoc.org/installing.html and restart your terminal/computer.');
        }

        // Convert LaTeX to DOCX using pandoc
        console.log('Converting LaTeX to DOCX...');
        await execAsync(`"${pandocCommand}" "${texPath}" -o "${docxPath}" --from=latex --to=docx`);
        console.log('Conversion complete');

        // Check if file was created
        const fileExists = await fs.access(docxPath).then(() => true).catch(() => false);
        if (!fileExists) {
          throw new Error('DOCX file was not created');
        }

        // Send the DOCX file
        res.download(docxPath, `${resume.name}.docx`, async (downloadErr) => {
          // Clean up temp files after download
          try {
            await fs.unlink(texPath).catch(() => {});
            await fs.unlink(docxPath).catch(() => {});
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }

          if (downloadErr) {
            console.error('Download error:', downloadErr);
          }
        });
      } catch (conversionError) {
        // Clean up on error
        await fs.unlink(texPath).catch(() => {});
        await fs.unlink(docxPath).catch(() => {});

        console.error('Conversion error:', conversionError);
        res.status(500).json({
          error: "Failed to convert to DOCX. Please ensure pandoc is installed.",
          details: conversionError instanceof Error ? conversionError.message : String(conversionError)
        });
      }
    } catch (error) {
      console.error('Download DOC error:', error);
      res.status(500).json({ error: "Failed to download as DOC" });
    }
  });

  // Optimize a specific section
  app.post("/api/resumes/:id/optimize-section", async (req, res) => {
    try {
      const validatedData = optimizationRequestSchema.parse(req.body);

      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      // Get API key from request body
      const apiKey = req.body.apiKey;
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      const result = await optimizeResumeSection(
        validatedData.section,
        validatedData.currentContent,
        validatedData.jobDescription,
        apiKey,
        validatedData.additionalDetails
      );

      // Save optimization history
      await storage.saveOptimization({
        resumeId: req.params.id,
        sectionName: validatedData.section,
        originalContent: validatedData.currentContent,
        optimizedContent: result.optimizedContent,
        jobDescription: validatedData.jobDescription,
        additionalDetails: validatedData.additionalDetails || null
      });

      res.json(result);
    } catch (error) {
      console.error("Optimization error:", error);
      res.status(500).json({ error: "Failed to optimize section", details: (error as Error).message });
    }
  });

  // Apply optimization to resume
  app.post("/api/resumes/:id/apply-optimization", async (req, res) => {
    try {
      const { sectionName, optimizedContent } = req.body;
      
      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const updatedLatex = updateSectionInLatex(
        resume.latexContent,
        sectionName,
        optimizedContent
      );

      const sections = extractSections(updatedLatex);
      
      const updatedResume = await storage.updateResume(req.params.id, {
        latexContent: updatedLatex,
        sections
      });

      res.json(updatedResume);
    } catch (error) {
      res.status(500).json({ error: "Failed to apply optimization" });
    }
  });

  // Upload and parse resume file
  app.post("/api/upload-resume", upload.single('resume'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      
      let parsedResume;
      if (ext === '.pdf') {
        parsedResume = await parsePDFResume(filePath);
      } else if (ext === '.docx' || ext === '.doc') {
        parsedResume = await parseDOCXResume(filePath);
      } else {
        return res.status(400).json({ error: "Unsupported file type" });
      }

      const latexContent = convertToLatex(parsedResume.sections);
      
      // Clean up uploaded file
      await fs.unlink(filePath);
      
      res.json({
        sections: parsedResume.sections,
        latexContent
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to parse resume" });
    }
  });

  // Batch optimize resume
  app.post("/api/batch-optimize", async (req, res) => {
    try {
      const validatedData = batchOptimizationRequestSchema.parse(req.body);

      // Get API key from request body
      const apiKey = req.body.apiKey;
      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      const result = await batchOptimizeResume(
        validatedData.sections,
        validatedData.jobDescription,
        apiKey
      );

      res.json(result);
    } catch (error) {
      console.error('Batch optimize error:', error);
      res.status(500).json({
        error: "Failed to batch optimize resume",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Full resume optimization (divides into 3 sections)
  app.post("/api/optimize-full-resume", async (req, res) => {
    try {
      const { latexContent, jobDescription, apiKey } = req.body;

      if (!latexContent || !jobDescription) {
        return res.status(400).json({ error: "LaTeX content and job description are required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      const result = await optimizeFullResume(
        latexContent,
        jobDescription,
        apiKey
      );

      res.json(result);
    } catch (error) {
      console.error('Full resume optimization error:', error);
      res.status(500).json({
        error: "Failed to optimize full resume",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get optimization history
  app.get("/api/resumes/:id/optimization-history", async (req, res) => {
    try {
      const history = await storage.getOptimizationHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch optimization history" });
    }
  });

  // SkillMatch API Routes
  app.post("/api/skillmatch/parse/resume", async (req, res) => {
    try {
      const result = skillmatch.parseResume(req.body);
      res.json(result);
    } catch (error) {
      console.error("Parse resume error:", error);
      res.status(500).json({ error: "Failed to parse resume" });
    }
  });

  app.post("/api/skillmatch/parse/jd", async (req, res) => {
    try {
      const result = skillmatch.parseJD(req.body);
      res.json(result);
    } catch (error) {
      console.error("Parse JD error:", error);
      res.status(500).json({ error: "Failed to parse job description" });
    }
  });

  app.post("/api/skillmatch/match", async (req, res) => {
    try {
      const result = skillmatch.match(req.body);
      res.json(result);
    } catch (error) {
      console.error("Match error:", error);
      res.status(500).json({ error: "Failed to match resume and JD" });
    }
  });

  app.post("/api/skillmatch/ats/check", async (req, res) => {
    try {
      const result = skillmatch.atsCheck(req.body);
      res.json(result);
    } catch (error) {
      console.error("ATS check error:", error);
      res.status(500).json({ error: "Failed to run ATS check" });
    }
  });

  app.post("/api/skillmatch/recommendations", async (req, res) => {
    try {
      const result = skillmatch.recommendations(req.body);
      res.json(result);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Generate AI-powered project ideas
  app.post("/api/ai/project-ideas", async (req, res) => {
    try {
      const { jobDescription, techStack, skillGaps, apiKey } = req.body;

      if (!jobDescription || !techStack) {
        return res.status(400).json({ error: "Job description and tech stack are required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      console.log("Generating project ideas for:", {
        jdLength: jobDescription.length,
        techStackCount: techStack.length,
        skillGapsCount: skillGaps?.length || 0
      });

      const { generateProjectIdeas } = await import("./services/gemini");
      const result = await generateProjectIdeas(jobDescription, techStack, apiKey, skillGaps);

      console.log("Project ideas generated successfully:", result.projects.length);
      res.json(result);
    } catch (error: any) {
      console.error("Project ideas generation error:", error);
      res.status(500).json({
        error: "Failed to generate project ideas",
        details: error.message
      });
    }
  });

  // Generate AI-powered certificate recommendations
  app.post("/api/ai/certificate-recommendations", async (req, res) => {
    try {
      const { jobDescription, skillGaps, apiKey } = req.body;

      if (!jobDescription || !skillGaps) {
        return res.status(400).json({ error: "Job description and skill gaps are required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      console.log("Generating certificate recommendations for:", {
        jdLength: jobDescription.length,
        skillGapsCount: skillGaps.length
      });

      const { generateCertificateRecommendations } = await import("./services/gemini");
      const result = await generateCertificateRecommendations(jobDescription, skillGaps, apiKey);

      console.log("Certificate recommendations generated successfully:", result.certificates.length);
      res.json(result);
    } catch (error: any) {
      console.error("Certificate recommendations error:", error);
      res.status(500).json({
        error: "Failed to generate certificate recommendations",
        details: error.message
      });
    }
  });

  // ============================================
  // CHATBOT API ROUTES
  // ============================================

  // Send a chat message and get AI response
  app.post("/api/chatbot/message", async (req, res) => {
    try {
      const { message, persona, conversationHistory, userContext, apiKey } = req.body;

      if (!message || !persona) {
        return res.status(400).json({ error: "Message and persona are required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      console.log("Generating chat response:", {
        messageLength: message.length,
        persona,
        historyLength: conversationHistory?.length || 0,
        hasContext: !!userContext
      });

      const response = await chatbot.generateChatResponse({
        message,
        persona: persona as chatbot.PersonaType,
        conversationHistory: conversationHistory || [],
        userContext: userContext || {}
      }, apiKey);

      res.json(response);
    } catch (error: any) {
      console.error("Chat message error:", error);
      res.status(500).json({
        error: "Failed to generate chat response",
        details: error.message
      });
    }
  });

  // Generate onboarding questions based on user goal
  app.post("/api/chatbot/onboarding", async (req, res) => {
    try {
      const { goal, apiKey } = req.body;

      if (!goal) {
        return res.status(400).json({ error: "Goal is required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      const questions = await chatbot.generateOnboardingQuestions(goal, apiKey);
      res.json({ questions });
    } catch (error: any) {
      console.error("Onboarding questions error:", error);
      res.status(500).json({
        error: "Failed to generate onboarding questions",
        details: error.message
      });
    }
  });

  // Generate conversation title from first message
  app.post("/api/chatbot/generate-title", async (req, res) => {
    try {
      const { firstMessage, apiKey } = req.body;

      if (!firstMessage) {
        return res.status(400).json({ error: "First message is required" });
      }

      if (!apiKey) {
        return res.status(400).json({ error: "API key is required" });
      }

      const title = await chatbot.generateConversationTitle(firstMessage, apiKey);
      res.json({ title });
    } catch (error: any) {
      console.error("Title generation error:", error);
      res.status(500).json({
        error: "Failed to generate title",
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}


