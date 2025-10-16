import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Briefcase,
  Heart,
  UserCheck,
  Maximize2
} from 'lucide-react';
import { useLocation } from 'wouter';
import type { PersonaType } from '@/lib/supabase';
import ApiKeyDialog from '@/components/api-key-dialog';
import { hasValidApiKey, getApiKey } from '@/lib/api-key-manager';

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
    description: 'Blunt, professional feedback'
  },
  counsellor: {
    name: 'Counsellor',
    icon: UserCheck,
    color: 'bg-blue-500',
    description: 'Empathetic career guidance'
  },
  friend: {
    name: 'Friend',
    icon: Heart,
    color: 'bg-green-500',
    description: 'Casual, supportive chat'
  }
};

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<PersonaType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    // Check if API key is set
    if (!hasValidApiKey()) {
      setShowApiKeyDialog(true);
      return;
    }

    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get API key
      const apiKey = getApiKey();
      if (!apiKey) {
        setShowApiKeyDialog(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          persona: selectedPersona,
          conversationHistory: messages.slice(-5), // Last 5 messages
          userContext: {}, // Will be populated from stored context
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

  const handlePersonaSelect = (persona: PersonaType) => {
    setSelectedPersona(persona);
    const welcomeMessage: Message = {
      role: 'assistant',
      content: getWelcomeMessage(persona),
      created_at: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
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

  const handleOpenFullScreen = () => {
    setLocation('/career-mate');
  };

  if (!isOpen) {
    return (
      <>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            size="lg"
            className="h-16 w-16 rounded-full shadow-lg"
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </motion.div>

        {/* API Key Dialog */}
        <ApiKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          onApiKeySet={() => {
            setShowApiKeyDialog(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 z-50 w-96"
      >
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold">
            {selectedPersona ? PERSONA_CONFIG[selectedPersona].name : 'Career Mate'}
          </CardTitle>
          <div className="flex gap-2">
            {selectedPersona && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleOpenFullScreen}
                title="Open full screen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsOpen(false);
                setSelectedPersona(null);
                setMessages([]);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedPersona ? (
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your AI career assistant:
              </p>
              {(Object.keys(PERSONA_CONFIG) as PersonaType[]).map((persona) => {
                const config = PERSONA_CONFIG[persona];
                const Icon = config.icon;
                return (
                  <Button
                    key={persona}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handlePersonaSelect(persona)}
                  >
                    <div className={`${config.color} p-2 rounded-full mr-3`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">{config.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {config.description}
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <>
              <ScrollArea className="h-96 p-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>

    {/* API Key Dialog */}
    <ApiKeyDialog
      open={showApiKeyDialog}
      onOpenChange={setShowApiKeyDialog}
      onApiKeySet={() => {
        setShowApiKeyDialog(false);
      }}
    />
    </>
  );
}

