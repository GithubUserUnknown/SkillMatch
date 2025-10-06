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

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Optimize a single resume section for a given job description.
 */
export async function optimizeResumeSection(
  sectionName: string,
  currentContent: string,
  jobDescription: string,
  additionalDetails?: string
): Promise<OptimizationResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `You are a professional resume optimization expert.
Your task is to optimize a resume section based on a job description.
Focus on:
- Matching keywords from the job description
- Using action-oriented language
- Quantifying achievements where possible
- Maintaining professional tone
- Improving ATS compatibility
- Response in JSON format with the optimized resume data in latex code.
Respond ONLY with JSON in this exact format:
{
  "optimizedContent": "improved latex code based on the given content here",
  "changes": ["list of key changes made"]
}`
  });

  const userPrompt = `
Section: ${sectionName}
Current Content: ${currentContent}
Job Description: ${jobDescription}
${additionalDetails ? `Additional Details: ${additionalDetails}` : ""}
Please optimize this resume section for the given job description.
`;

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
  jobDescription: string
): Promise<BatchOptimizationResult> {
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
      model: "gemini-1.5-flash",
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
  } catch (err) {
    throw new Error(`Failed to batch optimize resume: ${(err as Error).message}`);
  }
}

