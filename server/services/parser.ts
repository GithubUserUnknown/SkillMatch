import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ParsedResume {
  text: string;
  sections: Array<{
    name: string;
    content: string;
  }>;
}

export async function parsePDFResume(filePath: string): Promise<ParsedResume> {
  try {
    // Use pdftotext to extract text from PDF
    const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
    const text = stdout;

    const sections = extractSectionsFromText(text);
    
    return {
      text,
      sections
    };
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error}`);
  }
}

export async function parseDOCXResume(filePath: string): Promise<ParsedResume> {
  try {
    // Use pandoc to convert DOCX to text
    const { stdout } = await execAsync(`pandoc "${filePath}" -t plain`);
    const text = stdout;

    const sections = extractSectionsFromText(text);
    
    return {
      text,
      sections
    };
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error}`);
  }
}

function extractSectionsFromText(text: string): Array<{ name: string; content: string }> {
  const sections: Array<{ name: string; content: string }> = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const SECTION_KEYWORDS = {
  'Summary': [
    'summary', 'profile', 'objective', 'about', 'professional summary',
    'career objective', 'personal statement', 'overview', 'introduction',
    'career summary', 'executive summary', 'professional profile'
  ],
  'Work Experience': [
    'experience', 'employment', 'work history', 'professional experience',
    'career history', 'work', 'employment history', 'professional background',
    'career', 'positions', 'roles', 'job experience', 'work experience'
  ],
  'Education': [
    'education', 'academic', 'degree', 'university', 'college',
    'qualifications', 'academic background', 'educational background',
    'schooling', 'studies', 'academic qualifications', 'degrees',
    'academic history', 'educational qualifications'
  ],
  'Skills': [
    'skills', 'technical skills', 'competencies', 'technologies',
    'expertise', 'abilities', 'proficiencies', 'technical competencies',
    'core competencies', 'key skills', 'technical expertise',
    'programming languages', 'tools', 'software'
  ],
  'Projects': [
    'projects', 'portfolio', 'notable projects', 'personal projects',
    'key projects', 'selected projects', 'project experience',
    'project portfolio', 'relevant projects', 'major projects'
  ],
  'Certifications': [
    'certifications', 'certificates', 'credentials', 'licenses',
    'professional certifications', 'training', 'courses',
    'professional development', 'continuing education', 'awards'
  ]
};

  const sectionKeywords: Record<string, string[]> = {};
  for (const [sectionName, keywords] of Object.entries(SECTION_KEYWORDS)) {
    sectionKeywords[sectionName] = keywords;
  }

  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let foundSection = false;

    // Check if this line starts a new section
    for (const [sectionName, keywords] of Object.entries(sectionKeywords)) {
      if (keywords.some(keyword => lowerLine.includes(keyword) && line.length < 50)) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          sections.push({
            name: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        
        currentSection = sectionName;
        currentContent = [];
        foundSection = true;
        break;
      }
    }

    if (!foundSection && currentSection) {
      currentContent.push(line);
    }
  }

  // Save the last section
  if (currentSection && currentContent.length > 0) {
    sections.push({
      name: currentSection,
      content: currentContent.join('\n').trim()
    });
  }

  return sections;
}

export function convertToLatex(sections: Array<{ name: string; content: string }>): string {
  const sectionMapping: Record<string, string> = {
    'Summary': 'Professional Summary',
    'Work Experience': 'Work Experience',
    'Education': 'Education',
    'Skills': 'Skills',
    'Projects': 'Projects',
    'Certifications': 'Certifications'
  };

  let latex = `\\documentclass{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}

\\begin{document}

`;

  for (const section of sections) {
    const latexSectionName = sectionMapping[section.name] || section.name;
    latex += `% ===== ${section.name.toUpperCase()} =====
\\section*{${latexSectionName}}
${section.content}

\\vspace{0.2cm}

`;
  }

  latex += `\\end{document}`;
  
  return latex;
}
