# SkillMatch Resume Maker

## 🎯 Overview

**SkillMatch Resume Maker** is an AI-powered web application that helps job seekers create, optimize, and tailor their resumes for specific job applications. Built with modern web technologies and powered by Google's Gemini AI, it provides intelligent resume optimization, ATS compatibility checking, and job matching analysis.

### Key Features
- 🤖 **AI-Powered Optimization**: Automatically tailor resumes to job descriptions using Google Gemini AI
- 📝 **Professional LaTeX Editor**: Overleaf-style editor with live PDF preview
- ⚡ **Quick Update Mode**: Fast batch optimization for entire resumes
- 🎯 **ATS Compatibility Check**: Score your resume's compatibility with Applicant Tracking Systems
- 📊 **Job Match Analysis**: Calculate how well your skills match job requirements
- 📄 **Multi-Format Support**: Upload and parse PDF, DOCX, DOC, and TXT files
- 💾 **Resume Management**: Dashboard to organize and manage multiple resume versions

### Live Demo
🌐 **URL**: https://www.skillmatch.insaneworld.dev/


## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
PostgreSQL database (or Neon account)
```

### Installation
```bash
# 1. Clone the repository
git clone <repository-url>
cd SkillMatchResume

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create .env file with:
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_google_ai_api_key

# 4. Push database schema
npm run db:push

# 5. Start development server
npm run dev
```

### Build for Production
```bash
npm run build
npm start
```

## 📱 Application Pages

### 1. 🏠 Home Page
- **ATS Compatibility Check**: Upload resume and get ATS score (0-100)
- **Job Match Score**: Compare resume against job descriptions
- **File Upload**: Supports TXT, PDF, DOC, DOCX formats
- **Skill Analysis**: View matching skills, missing skills, and recommendations

### 2. ✏️ Resume Editor
- **3-Panel Layout**: Sections sidebar, LaTeX editor, PDF preview
- **Live Compilation**: Real-time PDF generation
- **Section Optimization**: AI-optimize individual sections
- **Keyboard Shortcuts**: Ctrl+S to save and compile
- **Diff View**: Compare original vs optimized content

### 3. ⚡ Quick Update
- **File Upload**: Drag-and-drop PDF/DOCX resumes
- **Batch Optimization**: AI optimizes all sections at once
- **Job Description Input**: Paste target job posting
- **Side-by-Side Comparison**: Review changes before accepting
- **Download**: Export optimized resume as PDF

### 4. 📊 Dashboard
- **Resume Management**: View, search, and filter all resumes
- **Statistics**: Track resume count and recent activity
- **Quick Actions**: Create, duplicate, delete resumes
- **Status Tracking**: Draft, final, archived states

### 5. 👤 Profile
- **Personal Information**: Name, email, phone, location
- **Work Experience**: Manage job history
- **Skills**: Technical and soft skills
- **Projects**: Portfolio projects

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client-side application is built with React and TypeScript, utilizing modern development patterns:
- **Component Library**: Implements shadcn/ui components with Radix UI primitives for accessibility and consistent design
- **Styling**: Uses Tailwind CSS with CSS variables for theming and responsive design
- **State Management**: Leverages React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Implements wouter for lightweight client-side routing
- **Form Handling**: Uses React Hook Form with Zod validation for type-safe form management

### Backend Architecture
The server follows a REST API architecture built on Express.js:
- **Framework**: Express.js with TypeScript for type safety
- **File Handling**: Multer middleware for resume file uploads (PDF, DOCX)
- **LaTeX Processing**: Server-side LaTeX compilation using pdflatex for PDF generation
- **Document Parsing**: Supports parsing of PDF and DOCX files using system tools (pdftotext, pandoc)
- **Error Handling**: Centralized error handling with proper HTTP status codes

### Data Storage Solutions
The application uses a hybrid storage approach:
- **Primary Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (@neondatabase/serverless) for serverless PostgreSQL hosting
- **Schema Management**: Drizzle Kit for database migrations and schema management
- **Fallback Storage**: In-memory storage implementation for development and testing

### Database Schema
The system defines three main entities:
- **Users**: Authentication and user management
- **Resumes**: Resume metadata, LaTeX content, and section information stored as JSONB
- **Optimization History**: Tracks AI optimization requests and results for audit trails

### AI Integration Architecture
- **AI Provider**: Google Gemini 2.5 Flash model for content optimization
- **Processing Types**: Single section optimization and batch optimization for entire resumes
- **Content Analysis**: Extracts and processes resume sections with job description matching
- **Response Format**: Structured JSON responses with optimization changes and explanations

### File Processing Pipeline
- **Upload Handling**: Secure file upload with type validation and size limits
- **Document Parsing**: Automated text extraction from PDF and DOCX formats
- **Section Extraction**: Intelligent parsing to identify resume sections (Summary, Experience, etc.)
- **LaTeX Conversion**: Transforms parsed content into structured LaTeX templates

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Query for modern frontend architecture
- **Styling and UI**: Tailwind CSS, Radix UI components, Lucide React icons
- **Backend Framework**: Express.js with TypeScript support

### Database and ORM
- **Database**: PostgreSQL via Neon Database serverless platform
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Connection**: @neondatabase/serverless for optimized serverless connections

### AI and Machine Learning
- **AI Provider**: Google Generative AI (@google/genai) for resume optimization
- **Model**: Gemini 2.5 Flash for fast, accurate content generation

### Development and Build Tools
- **Build System**: Vite for fast development and optimized production builds
- **TypeScript**: Full TypeScript support across frontend and backend

### File Processing Tools
- **Document Parsing**: System dependencies on pdftotext and pandoc for file conversion
- **LaTeX Compilation**: pdflatex for server-side PDF generation
- **File Upload**: Multer for secure multipart form handling

### Utility Libraries
- **Validation**: Zod for runtime type checking and validation
- **Date Handling**: date-fns for date manipulation and formatting
- **Class Management**: clsx and class-variance-authority for dynamic CSS classes
- **Session Management**: connect-pg-simple for PostgreSQL session storage

## 🎯 Use Cases

### Use Case 1: Create Resume from Scratch
1. Navigate to Dashboard
2. Click "Create New Resume"
3. Edit LaTeX code in Resume Editor
4. Press Ctrl+S to compile and preview
5. Download final PDF

### Use Case 2: Optimize Resume for Specific Job
1. Go to Quick Update page
2. Upload existing resume (PDF/DOCX)
3. Paste job description
4. Click "Optimize Resume"
5. Review AI suggestions
6. Accept/reject changes
7. Download tailored resume

### Use Case 3: Check ATS Compatibility
1. Go to Home page
2. Upload or paste resume text
3. Click "Run ATS Check"
4. Review score and recommendations
5. Make improvements
6. Recheck until score is satisfactory

### Use Case 4: Calculate Job Match
1. Go to Home page
2. Upload resume
3. Paste job description
4. Click "Calculate Match Score"
5. Review matching skills and gaps
6. Update resume accordingly

## 🔧 Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: wouter
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Code Editor**: CodeMirror with LaTeX support

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM
- **File Upload**: Multer
- **AI Integration**: Google Gemini 2.5 Flash
- **Document Processing**: pdflatex, pdftotext, pandoc

### Development Tools
- **TypeScript**: Full type safety
- **ESBuild**: Fast bundling
- **Drizzle Kit**: Database migrations
- **Cross-env**: Environment variables

## 📊 Project Statistics

- **Total Files**: 100+ TypeScript/React files
- **Lines of Code**: ~10,000+ lines
- **Components**: 30+ reusable UI components
- **API Endpoints**: 15+ REST endpoints
- **Database Tables**: 3 (users, resumes, optimization_history)
- **Supported File Formats**: 4 (TXT, PDF, DOC, DOCX)

## 🔐 Security Features

- File upload validation (type and size)
- SQL injection protection (Drizzle ORM)
- Input sanitization
- Environment variable protection
- Secure file handling

## 📈 Performance Optimizations

- React Query caching
- Code splitting
- Lazy loading
- Optimized re-renders
- Connection pooling
- Temporary file cleanup

## 🤝 Contributing

This project is part of a portfolio/learning project. Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Use as learning reference

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Google Gemini AI**: For intelligent resume optimization
- **shadcn/ui**: For beautiful, accessible components
- **Neon Database**: For serverless PostgreSQL hosting
- **Drizzle ORM**: For type-safe database operations
- **CodeMirror**: For the LaTeX editor
- **Tailwind CSS**: For rapid UI development

## 📞 Support

For questions or issues:
1. Check [PROJECT_EXPLANATION.md](./PROJECT_EXPLANATION.md) for technical details
2. Check [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) for usage help
3. Review existing documentation files
4. Open an issue on GitHub

## 🎓 Learning Resources

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Tailwind CSS**: https://tailwindcss.com
- **Drizzle ORM**: https://orm.drizzle.team
- **Google Gemini**: https://ai.google.dev
- **LaTeX**: https://www.latex-project.org

---