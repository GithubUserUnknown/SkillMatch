import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Lock, Eye, Database, Key, Cookie, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar currentPage="privacy" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last Updated: January 2025
            </p>
          </div>

          <Separator />

          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Welcome to SkillMatch Resume. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our resume optimization and career assistance platform.
              </p>
              <p>
                By using SkillMatch Resume, you agree to the collection and use of information in accordance with this policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Account Information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Email address (for authentication)</li>
                  <li>Name and profile information (optional)</li>
                  <li>Authentication tokens (managed by Supabase)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Resume and Career Data</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Resume content (LaTeX code and PDF files)</li>
                  <li>Job descriptions you analyze</li>
                  <li>Work experience, education, and skills</li>
                  <li>Projects and certifications</li>
                  <li>Career goals and preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Usage Data</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Pages visited and features used</li>
                  <li>Time spent on the platform</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>IP address (for security purposes)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Chat and AI Interactions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Chatbot conversations and messages</li>
                  <li>AI optimization requests and results</li>
                  <li>Persona preferences (Strict HR, Counsellor, Friend)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* API Key Storage */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5 text-primary" />
                <span>Your Gemini API Key - Local Storage Only</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-primary/10 p-4 rounded-lg space-y-2">
                <p className="font-semibold">Important: Your API key is NEVER sent to our servers</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li><strong>Stored locally:</strong> Your Gemini API key is stored only in your browser's localStorage</li>
                  <li><strong>Client-side only:</strong> API calls to Google Gemini are made directly from your browser</li>
                  <li><strong>30-day expiry:</strong> Keys automatically expire after 30 days for security</li>
                  <li><strong>Full control:</strong> You can delete your API key anytime from your profile</li>
                  <li><strong>No server access:</strong> Our servers never see, store, or have access to your API key</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                This design ensures maximum privacy and security. Your API key remains under your complete control at all times.
              </p>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use the collected information for the following purposes:</p>
              
              <div>
                <h3 className="font-semibold mb-2">1. Core Services</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Resume creation, editing, and optimization</li>
                  <li>LaTeX compilation and PDF generation</li>
                  <li>Skill matching and gap analysis</li>
                  <li>ATS compatibility checking</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. AI-Powered Features</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Resume section optimization using your API key</li>
                  <li>Personalized project recommendations</li>
                  <li>Certificate and course suggestions</li>
                  <li>Career chatbot assistance</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Platform Improvement</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Analyzing usage patterns to improve features</li>
                  <li>Fixing bugs and technical issues</li>
                  <li>Developing new features based on user needs</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Communication</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Sending important service updates</li>
                  <li>Responding to support requests</li>
                  <li>Notifying about new features (with your consent)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Storage and Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>Data Storage and Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Where Your Data is Stored</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li><strong>Database:</strong> PostgreSQL database hosted on secure cloud infrastructure</li>
                  <li><strong>Authentication:</strong> Managed by Supabase with industry-standard security</li>
                  <li><strong>Files:</strong> Resume PDFs and LaTeX files stored securely</li>
                  <li><strong>Local Storage:</strong> API keys, theme preferences, and cached data in your browser</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Security Measures</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>HTTPS encryption for all data transmission</li>
                  <li>Secure password hashing and authentication</li>
                  <li>Row-level security (RLS) policies in database</li>
                  <li>Regular security updates and patches</li>
                  <li>Access controls and user isolation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use the following third-party services:</p>
              
              <div>
                <h3 className="font-semibold mb-2">1. Supabase (Authentication & Database)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>User authentication and session management</li>
                  <li>Secure data storage</li>
                  <li>Privacy Policy: <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com/privacy</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Google Gemini AI (via Your API Key)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>AI-powered resume optimization</li>
                  <li>Chatbot responses and recommendations</li>
                  <li><strong>Note:</strong> You provide your own API key; we don't store it on our servers</li>
                  <li>Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">policies.google.com/privacy</a></li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cookies and Local Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cookie className="h-5 w-5" />
                <span>Cookies and Local Storage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>We use browser storage to enhance your experience:</p>
              
              <div>
                <h3 className="font-semibold mb-2">LocalStorage Items:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li><strong>skillmatch_gemini_api_key:</strong> Your Gemini API key (30-day expiry)</li>
                  <li><strong>skillmatch_latex_cache:</strong> Cached LaTeX content (30-day expiry)</li>
                  <li><strong>latex_versions:</strong> Saved resume versions</li>
                  <li><strong>theme:</strong> Your theme preference (light/dark)</li>
                  <li><strong>Authentication tokens:</strong> Managed by Supabase</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
                You can clear all local storage data anytime through your browser settings or our profile page.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>You have the following rights regarding your data:</p>
              
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li><strong>Access:</strong> View all your stored data anytime</li>
                <li><strong>Edit:</strong> Update your profile and resume information</li>
                <li><strong>Delete:</strong> Remove your API key, resumes, or entire account</li>
                <li><strong>Export:</strong> Download your resumes and data</li>
                <li><strong>Opt-out:</strong> Disable AI features by removing your API key</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">SkillMatch Resume Support</p>
                <p className="text-sm text-muted-foreground">Email: privacy@skillmatchresume.com</p>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
              <p className="text-sm text-muted-foreground">
                We encourage you to review this Privacy Policy periodically for any changes. Your continued use of the platform after any modifications indicates your acceptance of the updated policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

