import { GoogleGenerativeAI } from '@google/generative-ai';

export interface OptimizationResult {
  optimizedContent: string;
  changes: string[];
}

export interface BatchOptimizationResult {
  optimizedSections: Array<{
    header: string;
    optimizedContent: string;
  }>;
}

export interface ProjectIdea {
  title: string;
  description: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  keyFeatures: string[];
}

export interface ProjectIdeasResult {
  projects: ProjectIdea[];
}

export interface CertificateRecommendation {
  name: string;
  provider: string;
  relevance: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  url?: string;
}

export interface CertificateRecommendationsResult {
  certificates: CertificateRecommendation[];
}

/**
 * Optimize a single resume section for a given job description.
 */
export async function optimizeResumeSection(
  sectionName: string,
  currentContent: string,
  jobDescription: string,
  apiKey: string,
  additionalDetails?: string
): Promise<OptimizationResult> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Truncate job description to first 1200 chars for faster processing
  const truncatedJD = jobDescription.length > 1200
    ? jobDescription.substring(0, 1200) + "..."
    : jobDescription;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `Optimize resume section for ATS and job match. Focus on keywords, action verbs, and quantification. Respond ONLY with JSON:
{
  "optimizedContent": "improved latex code",
  "changes": ["change1", "change2"]
}`,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2000,
    }
  });

  const userPrompt = `Section: ${sectionName}
Content: ${currentContent}
Job: ${truncatedJD}
${additionalDetails ? `Details: ${additionalDetails}` : ""}
Optimize for this job.`;

  try {
    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const rawJson = response.text();
    if (!rawJson) throw new Error("Empty response from Gemini");

    // Clean the response by removing markdown code blocks
    const cleanedJson = rawJson.replace(/```json\s*|\s*```/g, '').trim();

    const optimizationResult: OptimizationResult = JSON.parse(cleanedJson);
    return optimizationResult;
  } catch (err) {
    throw new Error(`Failed to optimize resume section: ${(err as Error).message}`);
  }
}

/**
 * Optimize multiple resume sections at once.
 */
export async function batchOptimizeResume(
  sections: Array<{ header: string; content: string }>,
  jobDescription: string,
  apiKey: string
): Promise<BatchOptimizationResult> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = `You are a professional resume optimization expert.
Your task is to optimize multiple resume sections simultaneously based on a job description.
Focus on:
- Matching keywords from the job description
- Using action-oriented language
- Quantifying achievements where possible
- Maintaining professional tone
- Improving ATS compatibility
- Ensuring consistency across sections

Respond ONLY with JSON in this exact format:
{
  "optimizedSections": [
    {
      "header": "section name",
      "optimizedContent": "improved content"
    }
  ]
}`;

  const userPrompt = `
Job Description: ${jobDescription}

Resume Sections to Optimize:
${sections
  .map(
    (section) => `
${section.header}:
${section.content}
`
  )
  .join("\n")}
Please optimize all these resume sections for the given job description.
`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const rawJson = response.text();
    if (!rawJson) throw new Error("Empty response from Gemini");

    // Clean the response by removing markdown code blocks
    const cleanedJson = rawJson.replace(/```json\s*|\s*```/g, '').trim();

    const batchResult: BatchOptimizationResult = JSON.parse(cleanedJson);
    return batchResult;
  } catch (err: any) {
    console.error('Batch optimization error details:', {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      response: err.response
    });
    throw new Error(`Failed to batch optimize resume: ${err.message || String(err)}`);
  }
}

/**
 * Optimize full resume by dividing into 3 parts for better processing.
 * Returns complete LaTeX code.
 */
export async function optimizeFullResume(
  latexContent: string,
  jobDescription: string,
  apiKey: string
): Promise<{ optimizedLatex: string }> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Split LaTeX content into 3 parts
  const lines = latexContent.split('\n');
  const totalLines = lines.length;
  const part1End = Math.floor(totalLines / 3);
  const part2End = Math.floor((2 * totalLines) / 3);

  const part1 = lines.slice(0, part1End).join('\n');
  const part2 = lines.slice(part1End, part2End).join('\n');
  const part3 = lines.slice(part2End).join('\n');

  const systemInstruction = `You are a professional resume optimization expert specializing in LaTeX formatting.
Your task is to optimize resume content while maintaining valid LaTeX syntax.
Focus on:
- Matching keywords from the job description
- Using action-oriented language
- Quantifying achievements where possible
- Maintaining professional tone
- Improving ATS compatibility
- Preserving LaTeX structure and commands

Return ONLY the optimized LaTeX code without any markdown formatting or explanations.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction
    });

    // Process each part separately
    const optimizedParts: string[] = [];

    for (let i = 0; i < 3; i++) {
      const part = i === 0 ? part1 : i === 1 ? part2 : part3;
      const partNumber = i + 1;

      const userPrompt = `Job Description:\n${jobDescription}\n\nResume LaTeX Part ${partNumber}/3:\n${part}\n\nOptimize this part of the resume for the job description while maintaining LaTeX syntax. Return ONLY the optimized LaTeX code.`;

      const result = await model.generateContent(userPrompt);
      const response = result.response;
      let optimizedPart = response.text();

      if (!optimizedPart) throw new Error(`Empty response for part ${partNumber}`);

      // Clean markdown code blocks if present
      optimizedPart = optimizedPart.replace(/```latex\s*|\s*```/g, '').trim();
      optimizedParts.push(optimizedPart);
    }

    // Combine all parts
    const optimizedLatex = optimizedParts.join('\n');

    return { optimizedLatex };
  } catch (err: any) {
    console.error('Full resume optimization error details:', {
      message: err.message,
      status: err.status,
      statusText: err.statusText,
      response: err.response
    });
    throw new Error(`Failed to optimize full resume: ${err.message || String(err)}`);
  }
}

/**
 * Generate project ideas based on job description and required tech stack.
 */
export async function generateProjectIdeas(
  jobDescription: string,
  techStack: string[],
  apiKey: string,
  skillGaps?: string[]
): Promise<ProjectIdeasResult> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = `Generate 5 practical project ideas as JSON. Focus on real-world applications using the required tech stack. Respond ONLY with valid JSON:
{
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description (max 2 sentences)",
      "techStack": ["tech1", "tech2"],
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimatedTime": "e.g., 2-3 weeks",
      "keyFeatures": ["feature1", "feature2", "feature3"]
    }
  ]
}`;

  // Truncate job description to first 1000 chars for faster processing
  const truncatedJD = jobDescription.length > 1000
    ? jobDescription.substring(0, 1000) + "..."
    : jobDescription;

  const userPrompt = `Job: ${truncatedJD}
Tech: ${techStack.slice(0, 10).join(', ')}
${skillGaps && skillGaps.length > 0 ? `Gaps: ${skillGaps.slice(0, 5).join(', ')}` : ''}

Generate 5 projects (2 beginner, 2 intermediate, 1 advanced).`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const rawJson = response.text();
    if (!rawJson) throw new Error("Empty response from Gemini");

    // Clean the response by removing markdown code blocks
    const cleanedJson = rawJson.replace(/```json\s*|\s*```/g, '').trim();

    const projectIdeas: ProjectIdeasResult = JSON.parse(cleanedJson);
    return projectIdeas;
  } catch (err) {
    console.error("Project ideas generation error:", err);
    throw new Error(`Failed to generate project ideas: ${(err as Error).message}`);
  }
}

/**
 * Generate certificate recommendations based on job description and skill gaps.
 */
export async function generateCertificateRecommendations(
  jobDescription: string,
  skillGaps: string[],
  apiKey: string
): Promise<CertificateRecommendationsResult> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = `Recommend 5-7 industry-recognized certifications as JSON. Focus on addressing skill gaps. Respond ONLY with valid JSON:
{
  "certificates": [
    {
      "name": "Certification Name",
      "provider": "Organization",
      "relevance": "Brief relevance (1 sentence)",
      "difficulty": "Beginner|Intermediate|Advanced",
      "estimatedTime": "e.g., 2-3 months",
      "url": "https://url.com"
    }
  ]
}`;

  // Truncate job description to first 800 chars for faster processing
  const truncatedJD = jobDescription.length > 800
    ? jobDescription.substring(0, 800) + "..."
    : jobDescription;

  const userPrompt = `Job: ${truncatedJD}
Gaps: ${skillGaps.slice(0, 7).join(', ')}

Recommend 5-7 certifications.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      }
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const rawJson = response.text();
    if (!rawJson) throw new Error("Empty response from Gemini");

    // Clean the response by removing markdown code blocks
    const cleanedJson = rawJson.replace(/```json\s*|\s*```/g, '').trim();

    const certificates: CertificateRecommendationsResult = JSON.parse(cleanedJson);
    return certificates;
  } catch (err) {
    console.error("Certificate recommendations error:", err);
    throw new Error(`Failed to generate certificate recommendations: ${(err as Error).message}`);
  }
}
