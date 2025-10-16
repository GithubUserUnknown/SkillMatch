/**
 * SkillMatch Service - TypeScript/Node.js Implementation
 * Ported from Python FastAPI version
 */

// Seed Taxonomy (MVP)
// Canonical skill -> aliases
const SKILL_ALIASES: Record<string, Set<string>> = {
  python: new Set(["python", "py"]),
  sql: new Set(["sql", "t-sql", "mysql", "postgresql", "postgres", "mssql"]),
  pandas: new Set(["pandas"]),
  numpy: new Set(["numpy"]),
  "scikit-learn": new Set(["scikit-learn", "sklearn"]),
  tensorflow: new Set(["tensorflow", "tf"]),
  pytorch: new Set(["pytorch", "torch"]),
  "power bi": new Set(["power bi", "powerbi"]),
  tableau: new Set(["tableau"]),
  excel: new Set(["excel", "ms excel"]),
  aws: new Set(["aws", "amazon web services"]),
  azure: new Set(["azure"]),
  gcp: new Set(["gcp", "google cloud"]),
  spark: new Set(["spark", "pyspark"]),
  snowflake: new Set(["snowflake"]),
  dbt: new Set(["dbt"]),
  docker: new Set(["docker"]),
  kubernetes: new Set(["kubernetes", "k8s"]),
};

// Role → core skills (MVP examples)
const ROLE_CORE_SKILLS: Record<string, string[]> = {
  "data analyst": ["sql", "excel", "power bi", "tableau", "python"],
  "data scientist": ["python", "sql", "pandas", "numpy", "scikit-learn", "aws"],
  "ml engineer": ["python", "pytorch", "tensorflow", "docker", "kubernetes", "spark"],
  "backend engineer": ["python", "docker", "kubernetes", "sql"],
};

// Skill → recommended certs/courses (MVP)
const SKILL_CERTS: Record<string, string[]> = {
  // Cloud Platforms
  aws: ["AWS Certified Cloud Practitioner", "AWS Solutions Architect – Associate"],
  azure: ["Microsoft Azure Fundamentals (AZ-900)", "Microsoft AI Fundamentals (AI-900)"],
  gcp: ["Google Associate Cloud Engineer", "Google Cloud Digital Leader"],

  // Data & Analytics
  dbt: ["dbt Fundamentals"],
  snowflake: ["SnowPro Core"],
  "power bi": ["Microsoft PL-300: Power BI Data Analyst"],
  tableau: ["Tableau Desktop Specialist"],

  // DevOps & Containers
  docker: ["Docker Certified Associate", "IBM Docker Essentials Badge"],
  kubernetes: ["CKA – Certified Kubernetes Administrator", "KCNA – Kubernetes and Cloud Native Associate"],

  // Programming Languages
  python: ["PCEP – Certified Entry-Level Python Programmer (Python Institute)"],
  java: ["Oracle Certified Java SE Programmer I"],
  "c++": ["CPA – C++ Certified Associate Programmer (C++ Institute)"],
  kotlin: ["JetBrains Kotlin Certification"],
  javascript: ["freeCodeCamp JavaScript Algorithms and Data Structures Certification"],
  typescript: ["Microsoft Learn TypeScript Learning Path (with badge)"],
  go: ["Go Developer Certification (Coursera / Google Cloud)"],
  rust: ["Rust Programming Language Certificate (Rustlings + official course completion)"],
  swift: ["Apple Swift Certification (Swift Playgrounds / Swift Foundations)"],
  php: ["Zend PHP Engineer Certification (community / open version)"],
  ruby: ["Ruby Association Certified Ruby Programmer (Silver Level)"],
  "c#": ["Microsoft Certified: .NET Fundamentals"],
  sql: ["Microsoft DP-900: Data Fundamentals"],

  // Bonus / Universal Developer Skills
  git: ["GitHub Foundations (GitHub Skills)"],
  linux: ["Linux Foundation Certified IT Associate (LFCA)", "Introduction to Linux (LFS101x – Free edX course)"],
  html: ["freeCodeCamp Responsive Web Design Certification"],
  css: ["freeCodeCamp Responsive Web Design Certification"],
};


// Skill → project ideas (MVP)
const SKILL_PROJECTS: Record<string, string[]> = {
  sql: ["Design a star schema and write 10 analytics queries for sales data"],
  pandas: ["EDA + feature engineering on a public dataset (Kaggle/UCI)"],
  "scikit-learn": ["Imbalanced classification (fraud detection) with AUC target ≥0.85"],
  "power bi": ["Interactive revenue dashboard with cohort retention view"],
  pytorch: ["Image classifier with transfer learning and ONNX export"],
};

// Types
export interface ResumeIn {
  text: string;
  target_role?: string;
}

export interface JDIn {
  title: string;
  text: string;
  location?: string;
  experience_min_years?: number;
}

export interface ParsedResume {
  skills: string[];
  summary?: string | null;
}

export interface ParsedJD {
  title: string;
  skills_required: string[];
  keywords: string[];
}

export interface MatchRequest {
  resume: ParsedResume;
  jd: ParsedJD;
}

export interface MatchBreakdown {
  skill_overlap: number;
  keyword_coverage: number;
  role_priorities_hit: number;
}

export interface MatchResponse {
  score: number;
  breakdown: MatchBreakdown;
  gaps: string[];
  notes: string[];
}

export interface ATSRequest {
  resume_text: string;
}

export interface ATSResponse {
  issues: string[];
  passed_checks: string[];
}

export interface RecoRequest {
  gaps: string[];
}

export interface RecoResponse {
  certs: Record<string, string[]>;
  projects: Record<string, string[]>;
}

// Utilities
function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokenize(s: string): string[] {
  const normalized = normalizeText(s);
  return normalized.match(/[a-z0-9+#.]+/g) || [];
}

function extractSkills(text: string): string[] {
  const tokens = new Set(tokenize(text));
  const found = new Set<string>();
  
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    // Check if any alias matches tokens
    for (const alias of aliases) {
      const aliasNoSpace = alias.replace(/\s/g, "");
      const tokensNoSpace = Array.from(tokens).map(t => t.replace(/\s/g, ""));
      
      if (tokensNoSpace.includes(aliasNoSpace)) {
        found.add(canonical);
      }
    }
    
    // Allow phrase/alias match inside the raw text for multi-word tools
    for (const alias of aliases) {
      if (normalizeText(text).includes(alias)) {
        found.add(canonical);
      }
    }
  }
  
  return Array.from(found).sort();
}

function rolePriorities(role?: string): string[] {
  if (!role) return [];
  const roleLower = role.toLowerCase();
  return ROLE_CORE_SKILLS[roleLower] || [];
}

// Service Functions
export function parseResume(resume: ResumeIn): ParsedResume {
  const skills = extractSkills(resume.text);
  // Naive summary extraction (first 40 words)
  const tokens = tokenize(resume.text);
  const summary = tokens.length > 0 ? tokens.slice(0, 40).join(" ") : null;
  
  return { skills, summary };
}

export function parseJD(jd: JDIn): ParsedJD {
  // For MVP, treat keywords as all extracted unique terms present in taxonomy
  const skills = extractSkills(jd.text);
  const keywords = Array.from(new Set(skills)).sort();
  
  return {
    title: jd.title,
    skills_required: skills,
    keywords,
  };
}

export function match(m: MatchRequest): MatchResponse {
  const resumeSkills = new Set(m.resume.skills);
  const reqSkills = new Set(m.jd.skills_required);
  
  if (reqSkills.size === 0) {
    return {
      score: 0.0,
      breakdown: {
        skill_overlap: 0.0,
        keyword_coverage: 0.0,
        role_priorities_hit: 0,
      },
      gaps: [],
      notes: ["JD has no extracted skills"],
    };
  }
  
  const intersection = new Set([...resumeSkills].filter(x => reqSkills.has(x)));
  const overlap = intersection.size / Math.max(1, reqSkills.size);
  
  const keywordSet = new Set(m.jd.keywords);
  const keywordIntersection = new Set([...resumeSkills].filter(x => keywordSet.has(x)));
  const keywordCov = keywordIntersection.size / Math.max(1, keywordSet.size);
  
  // Role priorities if summary carries target role hint
  let inferredRole: string | null = null;
  if (m.resume.summary) {
    for (const r of Object.keys(ROLE_CORE_SKILLS)) {
      if (m.resume.summary.includes(r)) {
        inferredRole = r;
        break;
      }
    }
  }
  
  const rp = rolePriorities(inferredRole || undefined);
  const rpSet = new Set(rp);
  const roleHits = [...resumeSkills].filter(x => rpSet.has(x)).length;
  
  const score = Math.round((0.7 * overlap + 0.3 * keywordCov) * 1000) / 1000;
  const gaps = Array.from(reqSkills).filter(x => !resumeSkills.has(x)).sort();
  
  const notes: string[] = [];
  if (gaps.length > 0) {
    const gapList = gaps.slice(0, 5).join(", ");
    notes.push(`Missing critical skills: ${gapList}${gaps.length > 5 ? "…" : ""}`);
  }
  if (roleHits > 0 && inferredRole) {
    notes.push(`Hit ${roleHits} role-priority skills for ${inferredRole}`);
  }
  
  return {
    score,
    breakdown: {
      skill_overlap: Math.round(overlap * 1000) / 1000,
      keyword_coverage: Math.round(keywordCov * 1000) / 1000,
      role_priorities_hit: roleHits,
    },
    gaps,
    notes,
  };
}

export function atsCheck(req: ATSRequest): ATSResponse {
  const issues: string[] = [];
  const passes: string[] = [];
  
  const text = req.resume_text;
  
  // Simple heuristics
  if (text.includes("\t")) {
    issues.push("Tabs detected – use spaces for consistent parsing");
  } else {
    passes.push("No tabs detected");
  }
  
  // Very long lines can break ATS; flag > 180 chars lines
  const longLines = text.split("\n").filter(ln => ln.length > 180);
  if (longLines.length > 0) {
    issues.push(`${longLines.length} lines exceed 180 characters – consider shorter bullets`);
  } else {
    passes.push("No overlong lines detected");
  }
  
  // Check presence of contact info patterns
  const emailRe = /[\w\.-]+@[\w\.-]+\.[a-z]{2,}/i;
  const phoneRe = /\+?\d[\d\s\-()]{7,}/;
  
  if (!emailRe.test(text)) {
    issues.push("Email address not detected");
  } else {
    passes.push("Email detected");
  }
  
  if (!phoneRe.test(text)) {
    issues.push("Phone number not detected");
  } else {
    passes.push("Phone detected");
  }
  
  // Section headers
  const expectedHeaders = ["experience", "education", "projects", "skills"];
  const normalizedText = normalizeText(text);
  const headersFound = expectedHeaders.filter(h => normalizedText.includes(h));
  const missingHeaders = expectedHeaders.filter(h => !headersFound.includes(h));
  
  if (missingHeaders.length > 0) {
    issues.push(`Missing common section headers: ${missingHeaders.join(", ")}`);
  } else {
    passes.push("All common section headers present");
  }
  
  return { issues, passed_checks: passes };
}

export function recommendations(req: RecoRequest): RecoResponse {
  const certs: Record<string, string[]> = {};
  const projects: Record<string, string[]> = {};
  
  for (const gap of req.gaps) {
    const g = gap.toLowerCase();
    if (SKILL_CERTS[g]) {
      certs[g] = SKILL_CERTS[g];
    }
    if (SKILL_PROJECTS[g]) {
      projects[g] = SKILL_PROJECTS[g];
    }
  }
  
  return { certs, projects };
}

