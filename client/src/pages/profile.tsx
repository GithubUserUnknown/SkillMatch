import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { 
  Plus, 
  X, 
  Save, 
  Upload, 
  Download, 
  User, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Award, 
  FolderOpen,
  FileText,
  Edit,
  Zap,
  Target,
  Moon
} from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
  bullets: string[];
}

interface Education {
  id: string;
  degree: string;
  school: string;
  year: string;
  coursework: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  outcomes: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const [profileData, setProfileData] = useState({
    basicInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
      website: 'johndoe.dev'
    },
    experience: [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'Tech Company Inc.',
        startDate: '2022-01',
        endDate: 'Present',
        description: 'Leading full-stack development team',
        bullets: [
          'Led development of microservices architecture serving 1M+ users',
          'Improved system performance by 40% through optimization initiatives',
          'Mentored team of 5 junior developers'
        ]
      },
      {
        id: '2',
        title: 'Software Engineer',
        company: 'Startup Corp',
        startDate: '2020-06',
        endDate: '2021-12',
        description: 'Full-stack development role',
        bullets: [
          'Developed React-based frontend applications',
          'Built RESTful APIs using Node.js and Express',
          'Implemented CI/CD pipelines with Docker'
        ]
      }
    ] as Experience[],
    education: [
      {
        id: '1',
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of Technology',
        year: '2020',
        coursework: 'Data Structures, Algorithms, Software Engineering, Database Systems'
      }
    ] as Education[],
    skills: {
      technical: ['Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Docker', 'AWS'],
      soft: ['Leadership', 'Communication', 'Problem Solving', 'Project Management'],
      certifications: ['AWS Certified Developer', 'Certified Scrum Master']
    },
    projects: [
      {
        id: '1',
        title: 'E-commerce Platform',
        description: 'Full-stack e-commerce application with payment processing',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe API'],
        outcomes: 'Increased sales by 30% for client, handling 10k+ monthly transactions'
      },
      {
        id: '2',
        title: 'Data Analytics Dashboard',
        description: 'Real-time analytics dashboard for business intelligence',
        technologies: ['Python', 'Flask', 'D3.js', 'MongoDB'],
        outcomes: 'Reduced report generation time from hours to minutes'
      }
    ] as Project[]
  });

  const [newSkill, setNewSkill] = useState('');
  const [skillCategory, setSkillCategory] = useState<'technical' | 'soft' | 'certifications'>('technical');

  const addSkill = () => {
    if (newSkill.trim()) {
      setProfileData(prev => ({
        ...prev,
        skills: {
          ...prev.skills,
          [skillCategory]: [...prev.skills[skillCategory], newSkill.trim()]
        }
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (category: 'technical' | 'soft' | 'certifications', index: number) => {
    setProfileData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: prev.skills[category].filter((_, i) => i !== index)
      }
    }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      title: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
      bullets: ['']
    };
    setProfileData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const updateExperience = (id: string, field: keyof Experience, value: any) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addBullet = (expId: string) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === expId ? { ...exp, bullets: [...exp.bullets, ''] } : exp
      )
    }));
  };

  const updateBullet = (expId: string, bulletIndex: number, value: string) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === expId ? {
          ...exp,
          bullets: exp.bullets.map((bullet, index) => 
            index === bulletIndex ? value : bullet
          )
        } : exp
      )
    }));
  };

  const removeBullet = (expId: string, bulletIndex: number) => {
    setProfileData(prev => ({
      ...prev,
      experience: prev.experience.map(exp => 
        exp.id === expId ? {
          ...exp,
          bullets: exp.bullets.filter((_, index) => index !== bulletIndex)
        } : exp
      )
    }));
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <FileText className="text-primary text-xl" />
              <h1 className="text-xl font-bold">SkillMatch Resume Maker</h1>
            </div>
            <nav className="flex space-x-1">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/")}
              >
                <FileText className="h-4 w-4 mr-2" />Home
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/resume-editor")}
              >
                <Edit className="h-4 w-4 mr-2" />Edit Resume
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/quick-update")}
              >
                <Zap className="h-4 w-4 mr-2" />Quick Update
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/dashboard")}
              >
                <Target className="h-4 w-4 mr-2" />Dashboard
              </Button>
              <Button 
                className="bg-primary text-primary-foreground"
              >
                <User className="h-4 w-4 mr-2" />Profile
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Moon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">John Doe</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl mb-2 font-bold">Profile</h1>
                <p className="text-muted-foreground">
                  Manage your personal information to auto-fill resume fields
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Import from Resume
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export Profile
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Basic Info</span>
                </TabsTrigger>
                <TabsTrigger value="experience" className="flex items-center space-x-1">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Experience</span>
                </TabsTrigger>
                <TabsTrigger value="education" className="flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Education</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex items-center space-x-1">
                  <Code className="h-4 w-4" />
                  <span className="hidden sm:inline">Skills</span>
                </TabsTrigger>
                <TabsTrigger value="certifications" className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span className="hidden sm:inline">Certs</span>
                </TabsTrigger>
                <TabsTrigger value="projects" className="flex items-center space-x-1">
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Projects</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Your contact information and professional links
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm mb-1 block font-medium">Full Name</label>
                        <Input
                          value={profileData.basicInfo.name}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, name: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block font-medium">Email</label>
                        <Input
                          type="email"
                          value={profileData.basicInfo.email}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, email: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block font-medium">Phone</label>
                        <Input
                          value={profileData.basicInfo.phone}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, phone: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block font-medium">LinkedIn</label>
                        <Input
                          value={profileData.basicInfo.linkedin}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, linkedin: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block font-medium">GitHub</label>
                        <Input
                          value={profileData.basicInfo.github}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, github: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1 block font-medium">Website/Portfolio</label>
                        <Input
                          value={profileData.basicInfo.website}
                          onChange={(e) => setProfileData(prev => ({
                            ...prev,
                            basicInfo: { ...prev.basicInfo, website: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Work Experience</h2>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Experience
                    </Button>
                  </div>

                  {profileData.experience.map((exp, index) => (
                    <Card key={exp.id}>
                      <CardContent className="pt-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm mb-1 block font-medium">Job Title</label>
                            <Input
                              value={exp.title}
                              onChange={(e) => updateExperience(exp.id, 'title', e.target.value)}
                              placeholder="e.g. Senior Software Engineer"
                            />
                          </div>
                          <div>
                            <label className="text-sm mb-1 block font-medium">Company</label>
                            <Input
                              value={exp.company}
                              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                              placeholder="e.g. Tech Company Inc."
                            />
                          </div>
                          <div>
                            <label className="text-sm mb-1 block font-medium">Start Date</label>
                            <Input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm mb-1 block font-medium">End Date</label>
                            <Input
                              type="month"
                              value={exp.endDate === 'Present' ? '' : exp.endDate}
                              onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value || 'Present')}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm mb-1 block font-medium">Description</label>
                          <Textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                            placeholder="Brief description of your role..."
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Key Achievements</label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addBullet(exp.id)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add Bullet
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {exp.bullets.map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="flex items-center space-x-2">
                                <Input
                                  value={bullet}
                                  onChange={(e) => updateBullet(exp.id, bulletIndex, e.target.value)}
                                  placeholder="• Describe a key achievement or responsibility..."
                                />
                                {exp.bullets.length > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeBullet(exp.id, bulletIndex)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="education">
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                    <CardDescription>Your educational background</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">Education section coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                    <CardDescription>
                      Organize your skills by category for easy resume customization
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add New Skill */}
                    <div className="flex space-x-2">
                      <select
                        value={skillCategory}
                        onChange={(e) => setSkillCategory(e.target.value as any)}
                        className="px-3 py-2 border border-border rounded-md bg-background"
                      >
                        <option value="technical">Technical</option>
                        <option value="soft">Soft Skills</option>
                        <option value="certifications">Certifications</option>
                      </select>
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill..."
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      />
                      <Button onClick={addSkill}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Technical Skills */}
                    <div>
                      <h3 className="mb-3 font-semibold">Technical Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.technical.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{skill}</span>
                            <button onClick={() => removeSkill('technical', index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Soft Skills */}
                    <div>
                      <h3 className="mb-3 font-semibold">Soft Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.soft.map((skill, index) => (
                          <Badge key={index} variant="outline" className="flex items-center space-x-1">
                            <span>{skill}</span>
                            <button onClick={() => removeSkill('soft', index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Certifications */}
                    <div>
                      <h3 className="mb-3 font-semibold">Certifications</h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.certifications.map((cert, index) => (
                          <Badge key={index} variant="default" className="flex items-center space-x-1">
                            <span>{cert}</span>
                            <button onClick={() => removeSkill('certifications', index)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Certifications</CardTitle>
                    <CardDescription>Professional certifications and credentials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      Manage your certifications in the Skills tab above.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Projects</h2>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Project
                    </Button>
                  </div>

                  {profileData.projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <label className="text-sm mb-1 block font-medium">Project Title</label>
                          <Input value={project.title} placeholder="e.g. E-commerce Platform" />
                        </div>

                        <div>
                          <label className="text-sm mb-1 block font-medium">Description</label>
                          <Textarea value={project.description} placeholder="Brief description of the project..." />
                        </div>

                        <div>
                          <label className="text-sm mb-1 block font-medium">Technologies Used</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {project.technologies.map((tech, index) => (
                              <Badge key={index} variant="secondary">{tech}</Badge>
                            ))}
                          </div>
                          <Input placeholder="Add technologies (comma-separated)" />
                        </div>

                        <div>
                          <label className="text-sm mb-1 block font-medium">Key Outcomes</label>
                          <Textarea value={project.outcomes} placeholder="Quantifiable results or impact..." />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

