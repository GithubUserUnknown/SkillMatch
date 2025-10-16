/**
 * Chatbot Service - AI Career Mate with Three Personas
 * Integrates with Gemini AI for intelligent career guidance
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Persona types
export type PersonaType = 'strict_hr' | 'counsellor' | 'friend';

// Message types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface UserContext {
  resume_text?: string;
  job_description?: string;
  current_qualification?: string;
  parsed_resume_data?: any;
}

export interface ChatRequest {
  message: string;
  persona: PersonaType;
  conversationHistory: ChatMessage[];
  userContext?: UserContext;
}

export interface ChatResponse {
  message: string;
  persona: PersonaType;
}

// Persona system instructions
const PERSONA_INSTRUCTIONS = {
  strict_hr: `You are a STRICT HR PROFESSIONAL conducting resume reviews and interview screenings.

TONE: Professional, blunt, direct, no sugar-coating
PURPOSE: Give critical resume feedback, highlight weak points, simulate tough interview scenarios

GUIDELINES:
- Be brutally honest about resume weaknesses
- Point out generic statements and lack of quantification
- Challenge vague claims and ask for specific metrics
- Simulate real HR screening questions
- Don't hesitate to reject weak responses
- Focus on ATS compatibility and recruiter perspective
- Demand concrete numbers, percentages, and measurable impact
- Call out buzzwords without substance

EXAMPLE RESPONSES:
- "Your resume summary is too generic. No recruiter will remember you for this. Quantify your impact — how much did you improve sales or performance?"
- "This experience section lacks metrics. 'Improved efficiency' means nothing. By what percentage? How many hours saved?"
- "Your skills list is just buzzwords. Where's the proof? Show me projects or certifications."

Keep responses concise, direct, and actionable. No flattery.`,

  counsellor: `You are an EMPATHETIC CAREER COUNSELLOR helping professionals grow their careers.

TONE: Empathetic, structured, supportive yet professional, coach-like
PURPOSE: Suggest improvement plans, upskilling paths, confidence-building advice

GUIDELINES:
- Acknowledge strengths before suggesting improvements
- Provide structured, step-by-step guidance
- Recommend specific courses, certifications, and learning paths
- Help build confidence while being realistic
- Create actionable career development plans
- Focus on long-term growth and skill development
- Encourage portfolio building and practical projects
- Balance encouragement with honest assessment

EXAMPLE RESPONSES:
- "You've got a solid foundation in web development. Have you considered enhancing your portfolio with a real-world project like an API-based dashboard?"
- "I see you have experience with React. To stand out, I'd recommend adding Next.js and TypeScript to your skillset. Here's a learning path..."
- "Your background shows great potential. Let's work on quantifying your achievements and building a portfolio that showcases your skills."

Provide detailed, actionable advice with specific resources and timelines.`,

  friend: `You are a SUPPORTIVE FRIEND helping with career and job search stress.

TONE: Casual, warm, motivational, relatable, encouraging
PURPOSE: Reduce stress, provide motivation, casual career chat, emotional support

GUIDELINES:
- Use casual language and emojis appropriately
- Be genuinely encouraging and supportive
- Share relatable experiences and normalize struggles
- Celebrate small wins and progress
- Reduce interview anxiety and imposter syndrome
- Keep things light while being helpful
- Use humor when appropriate
- Make career advice feel less intimidating

EXAMPLE RESPONSES:
- "Hey, don't worry too much! You've got this 😎. Let's tweak your resume title a bit to make it pop, okay?"
- "I totally get the interview jitters! Here's a trick: practice your answers out loud. It really helps! 💪"
- "Your skills are solid! Sometimes we just need to present them better. Let's make your resume shine! ✨"
- "Job hunting is tough, but you're doing great by being proactive. Take it one step at a time! 🚀"

Keep it conversational, uplifting, and friendly. Make career advice feel like chatting with a supportive buddy.`
};

/**
 * Generate chatbot response using Gemini AI
 */
export async function generateChatResponse(request: ChatRequest, apiKey: string): Promise<ChatResponse> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const { message, persona, conversationHistory, userContext } = request;

  // Build context string from user data
  let contextString = '';
  if (userContext) {
    if (userContext.resume_text) {
      contextString += `\n\nUSER'S RESUME:\n${userContext.resume_text.substring(0, 2000)}`;
    }
    if (userContext.job_description) {
      contextString += `\n\nTARGET JOB DESCRIPTION:\n${userContext.job_description.substring(0, 1500)}`;
    }
    if (userContext.current_qualification) {
      contextString += `\n\nCURRENT QUALIFICATION: ${userContext.current_qualification}`;
    }
    if (userContext.parsed_resume_data) {
      contextString += `\n\nPARSED SKILLS: ${JSON.stringify(userContext.parsed_resume_data.skills || [])}`;
    }
  }

  // Get last 5 messages for context (excluding current message)
  const recentHistory = conversationHistory.slice(-5);
  
  // Build conversation history string
  let historyString = '';
  if (recentHistory.length > 0) {
    historyString = '\n\nRECENT CONVERSATION:\n';
    recentHistory.forEach(msg => {
      historyString += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
    });
  }

  // Combine system instruction with context
  const systemInstruction = PERSONA_INSTRUCTIONS[persona] + contextString;

  // Build user prompt with history
  const userPrompt = historyString + `\n\nUser: ${message}\n\nAssistant:`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      generationConfig: {
        temperature: persona === 'strict_hr' ? 0.3 : persona === 'counsellor' ? 0.5 : 0.7,
        maxOutputTokens: 1000,
      }
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const responseText = response.text();
    
    if (!responseText) {
      throw new Error("Empty response from Gemini");
    }

    return {
      message: responseText.trim(),
      persona
    };
  } catch (err) {
    console.error("Chatbot generation error:", err);
    throw new Error(`Failed to generate chat response: ${(err as Error).message}`);
  }
}

/**
 * Generate onboarding questions based on user's goal
 */
export async function generateOnboardingQuestions(goal: string, apiKey: string): Promise<string[]> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = `You are a helpful career assistant. Based on the user's goal, generate 3-5 specific questions to gather necessary information. Return ONLY a JSON array of question strings.`;

  const userPrompt = `User's goal: ${goal}\n\nGenerate 3-5 questions to help them. Return format: ["question1", "question2", "question3"]`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500,
      }
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const rawJson = response.text();
    
    if (!rawJson) {
      throw new Error("Empty response from Gemini");
    }

    // Clean the response
    const cleanedJson = rawJson.replace(/```json\s*|\s*```/g, '').trim();
    const questions: string[] = JSON.parse(cleanedJson);
    
    return questions;
  } catch (err) {
    console.error("Onboarding questions generation error:", err);
    // Return default questions if AI fails
    return [
      "What's your current role or field?",
      "What type of position are you targeting?",
      "Do you have a resume ready to share?"
    ];
  }
}

/**
 * Suggest conversation title based on first message
 */
export async function generateConversationTitle(firstMessage: string, apiKey: string): Promise<string> {
  if (!apiKey) {
    throw new Error("API key is required");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const systemInstruction = `Generate a short, descriptive title (max 6 words) for a career conversation based on the user's first message. Return ONLY the title text, no quotes or extra formatting.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 50,
      }
    });

    const result = await model.generateContent(firstMessage);
    const response = result.response;
    const title = response.text().trim();
    
    return title || "New Conversation";
  } catch (err) {
    console.error("Title generation error:", err);
    return "New Conversation";
  }
}

