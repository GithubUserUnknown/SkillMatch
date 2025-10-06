import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as path from "path";
import { optimizationRequestSchema, batchOptimizationRequestSchema } from "@shared/schema";
import { optimizeResumeSection, batchOptimizeResume } from "./services/gemini";
import { compileLatex, extractSections, updateSectionInLatex } from "./services/latex";
import { parsePDFResume, parseDOCXResume, convertToLatex } from "./services/parser";
import * as fs from "fs/promises";
import * as skillmatch from "./services/skillmatch";

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

      const result = await compileLatex(resume.latexContent);

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
      const pdfPath = path.join(process.cwd(), 'server', 'public', resume.pdfUrl);
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

  // Optimize a specific section
  app.post("/api/resumes/:id/optimize-section", async (req, res) => {
    try {
      const validatedData = optimizationRequestSchema.parse(req.body);

      const resume = await storage.getResume(req.params.id);
      if (!resume) {
        return res.status(404).json({ error: "Resume not found" });
      }

      const result = await optimizeResumeSection(
        validatedData.section,
        validatedData.currentContent,
        validatedData.jobDescription,
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
      
      const result = await batchOptimizeResume(
        validatedData.sections,
        validatedData.jobDescription
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to batch optimize resume" });
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

  const httpServer = createServer(app);
  return httpServer;
}


