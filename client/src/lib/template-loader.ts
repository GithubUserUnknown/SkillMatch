// Import all templates
import modernTemplate from '../templates/modern.tex?raw';
import atsFriendlyTemplate from '../templates/ats-friendly.tex?raw';
import creativeTemplate from '../templates/creative.tex?raw';
import academicTemplate from '../templates/academic.tex?raw';

export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
  category: 'professional' | 'creative' | 'academic';
  preview?: string;
}

export const templates: Template[] = [
  {
    id: 'modern',
    name: 'Modern Professional',
    description: 'Clean and modern design perfect for tech and business roles',
    content: modernTemplate,
    category: 'professional',
  },
  {
    id: 'ats-friendly',
    name: 'ATS-Friendly',
    description: 'Optimized for Applicant Tracking Systems with clear formatting',
    content: atsFriendlyTemplate,
    category: 'professional',
  },
  {
    id: 'creative',
    name: 'Creative Designer',
    description: 'Eye-catching design for creative professionals and designers',
    content: creativeTemplate,
    category: 'creative',
  },
  {
    id: 'academic',
    name: 'Academic CV',
    description: 'Comprehensive format for academic and research positions',
    content: academicTemplate,
    category: 'academic',
  },
];

export const getTemplateById = (id: string): Template | undefined => {
  return templates.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: 'professional' | 'creative' | 'academic'): Template[] => {
  return templates.filter(template => template.category === category);
};

export const defaultTemplate = templates[0]; // Modern template as default

