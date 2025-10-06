import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { 
  FileText, 
  Edit, 
  Download, 
  Copy, 
  Trash2, 
  Plus, 
  Search, 
  MoreVertical,
  Calendar,
  TrendingUp,
  Eye,
  Zap,
  Target,
  User,
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Resume {
  id: string;
  title: string;
  matchScore: number;
  lastJobDescription: string;
  lastUpdated: string;
  status: 'draft' | 'completed' | 'optimized';
  downloads: number;
  versions: number;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'completed' | 'optimized'>('all');
  
  const [resumes, setResumes] = useState<Resume[]>([
    {
      id: '1',
      title: 'Senior Software Engineer Resume',
      matchScore: 91,
      lastJobDescription: 'Senior Software Engineer at Microsoft',
      lastUpdated: '2024-01-15',
      status: 'optimized',
      downloads: 5,
      versions: 3
    },
    {
      id: '2',
      title: 'Data Scientist Resume',
      matchScore: 78,
      lastJobDescription: 'Data Scientist at Google',
      lastUpdated: '2024-01-12',
      status: 'completed',
      downloads: 2,
      versions: 2
    },
    {
      id: '3',
      title: 'Frontend Developer Resume',
      matchScore: 0,
      lastJobDescription: '',
      lastUpdated: '2024-01-10',
      status: 'draft',
      downloads: 0,
      versions: 1
    },
    {
      id: '4',
      title: 'Full Stack Developer Resume',
      matchScore: 85,
      lastJobDescription: 'Full Stack Developer at Startup',
      lastUpdated: '2024-01-08',
      status: 'optimized',
      downloads: 8,
      versions: 4
    }
  ]);

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resume.lastJobDescription.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || resume.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'optimized': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score === 0) return 'text-gray-400';
    return 'text-red-600';
  };

  const duplicateResume = (resumeId: string) => {
    const original = resumes.find(r => r.id === resumeId);
    if (original) {
      const duplicate: Resume = {
        ...original,
        id: Date.now().toString(),
        title: `${original.title} (Copy)`,
        lastUpdated: new Date().toISOString().split('T')[0],
        downloads: 0,
        versions: 1
      };
      setResumes(prev => [duplicate, ...prev]);
    }
  };

  const deleteResume = (resumeId: string) => {
    setResumes(prev => prev.filter(r => r.id !== resumeId));
  };

  const stats = {
    totalResumes: resumes.length,
    totalDownloads: resumes.reduce((sum, r) => sum + r.downloads, 0),
    avgMatchScore: Math.round(resumes.filter(r => r.matchScore > 0).reduce((sum, r) => sum + r.matchScore, 0) / resumes.filter(r => r.matchScore > 0).length),
    optimizedResumes: resumes.filter(r => r.status === 'optimized').length
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
                className="bg-primary text-primary-foreground"
              >
                <Target className="h-4 w-4 mr-2" />Dashboard
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/profile")}
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
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl mb-2 font-bold">Resume Dashboard</h1>
                <p className="text-muted-foreground">
                  Manage your resumes and track optimization progress
                </p>
              </div>
              <Button onClick={() => setLocation("/resume-editor")} size="lg" className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Resume</span>
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalResumes}</p>
                      <p className="text-xs text-muted-foreground">Total Resumes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalDownloads}</p>
                      <p className="text-xs text-muted-foreground">Downloads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.avgMatchScore}%</p>
                      <p className="text-xs text-muted-foreground">Avg Match Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.optimizedResumes}</p>
                      <p className="text-xs text-muted-foreground">Optimized</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resumes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex space-x-2">
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="optimized">Optimized</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            {/* Resume List */}
            <div className="space-y-4">
              {filteredResumes.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg mb-2 font-semibold">No resumes found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || selectedFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Create your first resume to get started.'
                      }
                    </p>
                    <Button onClick={() => setLocation("/resume-editor")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Create Resume
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredResumes.map((resume) => (
                  <Card key={resume.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{resume.title}</h3>
                            <Badge className={getStatusColor(resume.status)}>
                              {resume.status}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Updated {resume.lastUpdated}</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Download className="h-4 w-4" />
                              <span>{resume.downloads} downloads</span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>{resume.versions} versions</span>
                            </div>
                          </div>

                          {resume.lastJobDescription && (
                            <div className="mt-3">
                              <p className="text-sm text-muted-foreground mb-2">
                                Last optimized for: {resume.lastJobDescription}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm">Match Score:</span>
                                <span className={`text-sm font-semibold ${getMatchScoreColor(resume.matchScore)}`}>
                                  {resume.matchScore}%
                                </span>
                                <Progress value={resume.matchScore} className="w-24 h-2" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation("/resume-editor")}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation("/quick-update")}
                          >
                            <Zap className="h-4 w-4 mr-1" />
                            Quick Update
                          </Button>

                          <Button size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => duplicateResume(resume.id)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteResume(resume.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/resume-editor")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Resume
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/quick-update")}>
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Update Existing
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/profile")}>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Profile Info
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span>Senior Software Engineer Resume optimized</span>
                      <span className="text-muted-foreground ml-auto">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span>Data Scientist Resume downloaded</span>
                      <span className="text-muted-foreground ml-auto">1 day ago</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                      <span>Profile information updated</span>
                      <span className="text-muted-foreground ml-auto">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

