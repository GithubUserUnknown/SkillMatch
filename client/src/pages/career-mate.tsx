import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase, type PersonaType, type ChatConversation, type ChatMessage, type UserChatContext } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import ApiKeyDialog from '@/components/api-key-dialog';
import { hasValidApiKey, getApiKey } from '@/lib/api-key-manager';
import {
  Send,
  Loader2,
  Briefcase,
  Heart,
  UserCheck,
  Upload,
  FileText,
  Trash2,
  Plus,
  MessageSquare,
  Key
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const PERSONA_CONFIG = {
  strict_hr: {
    name: 'Strict HR',
    icon: Briefcase,
    color: 'bg-red-500',
    description: 'Blunt, professional feedback',
    emoji: '💼'
  },
  counsellor: {
    name: 'Counsellor',
    icon: UserCheck,
    color: 'bg-blue-500',
    description: 'Empathetic career guidance',
    emoji: '🎓'
  },
  friend: {
    name: 'Friend',
    icon: Heart,
    color: 'bg-green-500',
    description: 'Casual, supportive chat',
    emoji: '💚'
  }
};

function CareerMatePage() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('counsellor');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserChatContext | null>(null);
  const [showContextForm, setShowContextForm] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Context form state
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [qualification, setQualification] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and context on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      loadUserContext();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Error loading conversations:', error);
        return;
      }

      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadUserContext = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_chat_context')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error loading context:', error);
        return;
      }

      if (data) {
        setUserContext(data);
        setResumeText(data.resume_text || '');
        setJobDescription(data.job_description || '');
        setQualification(data.current_qualification || '');
      }
    } catch (error) {
      console.error('Error loading context:', error);
    }
  };

  const saveUserContext = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to save your context.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('user_chat_context')
        .upsert({
          user_id: user.id,
          resume_text: resumeText,
          job_description: jobDescription,
          current_qualification: qualification,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Context saved',
        description: 'Your information has been saved successfully.'
      });

      setShowContextForm(false);
      loadUserContext();
    } catch (error: any) {
      console.error('Error saving context:', error);
      toast({
        title: 'Error',
        description: 'Failed to save context. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data || []);
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversation.',
        variant: 'destructive'
      });
    }
  };

  const createNewConversation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: 'New Conversation',
          persona: selectedPersona
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setCurrentConversationId(data.id);
      setMessages([]);
      loadConversations();

      // Add welcome message
      const welcomeMessage: Message = {
        role: 'assistant',
        content: getWelcomeMessage(selectedPersona),
        created_at: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation.',
        variant: 'destructive'
      });
    }
  };

  const getWelcomeMessage = (persona: PersonaType): string => {
    switch (persona) {
      case 'strict_hr':
        return "I'm here to give you honest, direct feedback on your resume and interview prep. No sugar-coating. What do you need help with?";
      case 'counsellor':
        return "Hello! I'm here to help you grow your career with structured guidance and actionable advice. What would you like to work on today?";
      case 'friend':
        return "Hey there! 😊 Don't stress, we'll figure this out together. What's on your mind about your job search or career?";
    }
  };

  const handleSendMessage = async () => {
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

    if (!inputMessage.trim() || isLoading) return;

    // Create conversation if none exists
    if (!currentConversationId && user) {
      await createNewConversation();
    }

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Save user message to database
      if (currentConversationId && user) {
        await supabase.from('chat_messages').insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: userMessage.content
        });
      }

      // Get API key
      const apiKey = getApiKey();
      if (!apiKey) {
        setShowApiKeyDialog(true);
        setIsLoading(false);
        return;
      }

      // Get AI response
      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          persona: selectedPersona,
          conversationHistory: messages.slice(-5),
          userContext: userContext ? {
            resume_text: userContext.resume_text,
            job_description: userContext.job_description,
            current_qualification: userContext.current_qualification,
            parsed_resume_data: userContext.parsed_resume_data
          } : {},
          apiKey: apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      if (currentConversationId && user) {
        await supabase.from('chat_messages').insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: assistantMessage.content
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar currentPage="career-mate" />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Sidebar - Conversations */}
          <div className="w-80 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-lg mb-4">Career Mate</h2>
              <Button onClick={createNewConversation} className="w-full" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Conversation
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant={currentConversationId === conv.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => loadConversationMessages(conv.id)}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0" />
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="font-medium truncate">{conv.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {PERSONA_CONFIG[conv.persona].emoji} {PERSONA_CONFIG[conv.persona].name}
                        </div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {(Object.keys(PERSONA_CONFIG) as PersonaType[]).map((persona) => {
                    const config = PERSONA_CONFIG[persona];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={persona}
                        variant={selectedPersona === persona ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPersona(persona)}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {config.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContextForm(!showContextForm)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {userContext ? 'Update Context' : 'Add Context'}
              </Button>
            </div>

            {/* Context Form */}
            {showContextForm && (
              <div className="border-b p-4 bg-muted/30">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h3 className="font-semibold">Your Career Context</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Resume Text</label>
                      <Textarea
                        placeholder="Paste your resume text here..."
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Target Job Description</label>
                      <Textarea
                        placeholder="Paste the job description you're targeting..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Current Qualification</label>
                      <Input
                        placeholder="e.g., Bachelor's in Computer Science"
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveUserContext}>Save Context</Button>
                      <Button variant="outline" onClick={() => setShowContextForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">
                      {PERSONA_CONFIG[selectedPersona].emoji}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {PERSONA_CONFIG[selectedPersona].name}
                    </h3>
                    <p className="text-muted-foreground">
                      {PERSONA_CONFIG[selectedPersona].description}
                    </p>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Input
                  placeholder={`Message ${PERSONA_CONFIG[selectedPersona].name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* API Key Dialog */}
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          onApiKeySet={() => {
            setShowApiKeyDialog(false);
            toast({
              title: 'API Key Saved',
              description: 'You can now chat with Career Mate!',
            });
          }}
        />
      </div>
    </ProtectedRoute>
  );
}

export default CareerMatePage;

