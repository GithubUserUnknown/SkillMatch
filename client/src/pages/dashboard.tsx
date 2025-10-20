import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Copy,
  Trash2,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  TrendingUp,
  Eye,
  FileText,
  Zap,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Resume {
  id: string;
  name: string;
  latexContent: string;
  pdfUrl: string | null;
  pdfStoragePath: string | null;
  texStoragePath: string | null;
  template: string;
  sections: any[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface DashboardResume {
  id: string;
  title: string;
  lastUpdated: string;
  status: 'draft' | 'completed' | 'optimized';
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'completed' | 'optimized'>('all');

  // Fetch resumes from API
  const { data: resumes = [], isLoading: loading, error } = useQuery<Resume[]>({
    queryKey: ['/api/resumes'],
    queryFn: async () => {
      const response = await fetch('/api/resumes');
      if (!response.ok) {
        throw new Error('Failed to fetch resumes');
      }
      return response.json();
    },
  });

  // Transform resumes for display
  const dashboardResumes: DashboardResume[] = resumes.map(resume => ({
    id: resume.id,
    title: resume.name,
    lastUpdated: new Date(resume.updatedAt).toLocaleDateString(),
    status: resume.pdfUrl ? 'completed' : 'draft' as 'draft' | 'completed' | 'optimized',
  }));

  const filteredResumes = dashboardResumes.filter(resume => {
    const matchesSearch = resume.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || resume.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: DashboardResume['status']) => {
    switch (status) {
      case 'optimized': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Delete resume mutation
  const deleteResumeMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete resume');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      toast({
        title: 'Resume deleted',
        description: 'The resume has been deleted successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete resume. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Duplicate resume mutation
  const duplicateResumeMutation = useMutation({
    mutationFn: async (resumeId: string) => {
      const original = resumes.find(r => r.id === resumeId);
      if (!original) throw new Error('Resume not found');

      const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${original.name} (Copy)`,
          latexContent: original.latexContent,
          template: original.template,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to duplicate resume');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resumes'] });
      toast({
        title: 'Resume duplicated',
        description: 'The resume has been duplicated successfully.'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate resume. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const deleteResume = (resumeId: string) => {
    deleteResumeMutation.mutate(resumeId);
  };

  const duplicateResume = (resumeId: string) => {
    duplicateResumeMutation.mutate(resumeId);
  };

  const downloadResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resumes/${resumeId}/download`);
      if (!response.ok) {
        throw new Error('Failed to download resume');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${resumeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download started',
        description: 'Your resume is being downloaded.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download resume. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const stats = {
    totalResumes: dashboardResumes.length,
    completedResumes: dashboardResumes.filter(r => r.status === 'completed' || r.status === 'optimized').length,
    draftResumes: dashboardResumes.filter(r => r.status === 'draft').length,
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="h-screen flex flex-col bg-background overflow-hidden">
          <Navbar currentPage="dashboard" />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading resumes...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navbar currentPage="dashboard" />

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
            <div className="grid md:grid-cols-3 gap-4 mb-8">
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
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedResumes}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Edit className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.draftResumes}</p>
                      <p className="text-xs text-muted-foreground">Drafts</p>
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

                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Updated {resume.lastUpdated}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setLocation(`/resume-editor?id=${resume.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => downloadResume(resume.id)}
                            disabled={resume.status === 'draft'}
                          >
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
                              <DropdownMenuItem
                                onClick={() => window.open(`/api/resumes/${resume.id}/preview`, '_blank')}
                                disabled={resume.status === 'draft'}
                              >
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
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
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
            </div>
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}

