import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  Key,
  Eye,
  EyeOff,
  Trash2,
  Shield
} from 'lucide-react';
import { getApiKeyMetadata, maskApiKey, getApiKey, deleteApiKey } from '@/lib/api-key-manager';
import ApiKeyDialog from '@/components/api-key-dialog';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyMetadata, setApiKeyMetadata] = useState(getApiKeyMetadata());
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

  // Load profile data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          // Table might not exist yet, just use default data
          console.warn('Supabase error (using default data):', error);
          // Update email from user account
          setProfileData(prev => ({
            ...prev,
            basicInfo: {
              ...prev.basicInfo,
              email: user.email || ''
            }
          }));
          setLoading(false);
          return;
        }

        if (data) {
          setProfileData({
            basicInfo: {
              name: data.full_name || '',
              email: data.email || user.email || '',
              phone: data.phone || '',
              linkedin: data.linkedin || '',
              github: data.github || '',
              website: data.website || ''
            },
            experience: data.experience || [],
            education: data.education || [],
            skills: data.skills || { technical: [], soft: [], certifications: [] },
            projects: data.projects || []
          });
        } else {
          // No profile data, update email from user account
          setProfileData(prev => ({
            ...prev,
            basicInfo: {
              ...prev.basicInfo,
              email: user.email || ''
            }
          }));
        }
      } catch (error: any) {
        console.error('Error loading profile:', error);
        // Don't show error toast, just use default data
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Save profile data to Supabase
  const saveProfile = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to save your profile.',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.basicInfo.name,
          email: profileData.basicInfo.email,
          phone: profileData.basicInfo.phone,
          linkedin: profileData.basicInfo.linkedin,
          github: profileData.basicInfo.github,
          website: profileData.basicInfo.website,
          experience: profileData.experience,
          education: profileData.education,
          skills: profileData.skills,
          projects: profileData.projects,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Supabase save error:', error);
        toast({
          title: 'Database not set up',
          description: 'Please run the SQL schema from SUPABASE_SETUP.md. Changes saved locally for now.',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Profile saved',
          description: 'Your profile has been saved successfully.'
        });
      }
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Database not set up',
        description: 'Please run the SQL schema from SUPABASE_SETUP.md. Changes saved locally for now.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

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

  const handleDeleteApiKey = () => {
    deleteApiKey();
    setApiKeyMetadata(getApiKeyMetadata());
    setShowApiKey(false);
    toast({
      title: 'API Key Deleted',
      description: 'Your Gemini API key has been removed from local storage.',
    });
  };

  const handleApiKeySet = () => {
    setApiKeyMetadata(getApiKeyMetadata());
    toast({
      title: 'API Key Saved',
      description: 'Your Gemini API key has been saved locally for 30 days.',
    });
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          <Navbar currentPage="profile" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navbar currentPage="profile" />

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
                <Button size="sm" onClick={saveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
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
                <TabsTrigger value="apikey" className="flex items-center space-x-1">
                  <Key className="h-4 w-4" />
                  <span className="hidden sm:inline">API Key</span>
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

              {/* API Key Management Tab */}
              <TabsContent value="apikey">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span>Gemini API Key Management</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your Google Gemini API key for AI-powered features. Your key is stored locally and never sent to our servers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* API Key Status */}
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Key className="h-5 w-5 text-primary" />
                          <span className="font-medium">API Key Status</span>
                        </div>
                        {apiKeyMetadata.exists ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Not Set</Badge>
                        )}
                      </div>

                      {apiKeyMetadata.exists && (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Your API Key:</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowApiKey(!showApiKey)}
                              >
                                {showApiKey ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-1" />
                                    Show
                                  </>
                                )}
                              </Button>
                            </div>
                            <div className="bg-background p-3 rounded border font-mono text-sm">
                              {showApiKey ? getApiKey() : maskApiKey(getApiKey() || '')}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Expires in:</span>
                            <span className="font-medium">
                              {apiKeyMetadata.daysRemaining} {apiKeyMetadata.daysRemaining === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Features using API Key */}
                    <div className="space-y-3">
                      <h3 className="font-medium">Features using your API key:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                        <li>AI-powered resume section optimization</li>
                        <li>Personalized project recommendations</li>
                        <li>Certificate and course suggestions</li>
                        <li>Career chatbot (Strict HR, Counsellor, Friend personas)</li>
                      </ul>
                    </div>

                    {/* Privacy Notice */}
                    <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                      <p className="font-medium flex items-center space-x-2">
                        <Shield className="h-4 w-4" />
                        <span>Privacy & Security</span>
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                        <li>Stored <strong>locally</strong> in your browser only</li>
                        <li>Never sent to our servers</li>
                        <li>Automatically expires after 30 days</li>
                        <li>You have full control to delete anytime</li>
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {apiKeyMetadata.exists ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setShowApiKeyDialog(true)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Update API Key
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteApiKey}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete API Key
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setShowApiKeyDialog(true)}>
                          <Key className="h-4 w-4 mr-2" />
                          Add API Key
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* API Key Dialog */}
      <ApiKeyDialog
        open={showApiKeyDialog}
        onOpenChange={setShowApiKeyDialog}
        onApiKeySet={handleApiKeySet}
      />
    </div>
    </ProtectedRoute>
  );
}

