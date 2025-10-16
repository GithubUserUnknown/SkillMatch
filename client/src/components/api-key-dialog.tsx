import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, Info, Shield } from 'lucide-react';
import { saveApiKey } from '@/lib/api-key-manager';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet?: () => void;
  title?: string;
  description?: string;
}

export default function ApiKeyDialog({
  open,
  onOpenChange,
  onApiKeySet,
  title = "Gemini API Key Required",
  description = "To use AI-powered features, please provide your Google Gemini API key. Your key is stored locally and never sent to our servers."
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    // Basic validation - Gemini API keys typically start with "AIza"
    if (!apiKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini API keys typically start with "AIza"');
      return;
    }

    // Save to localStorage
    saveApiKey(apiKey.trim());
    
    // Reset state
    setApiKey('');
    setError('');
    
    // Notify parent
    if (onApiKeySet) onApiKeySet();
    
    // Close dialog
    onOpenChange(false);
  };

  const handleCancel = () => {
    setApiKey('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Why do we need your API key?</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>AI-powered resume optimization</li>
                  <li>Personalized project recommendations</li>
                  <li>Certificate suggestions</li>
                  <li>Career chatbot assistance</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Privacy Alert */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Your privacy is protected:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>API key stored <strong>locally</strong> in your browser only</li>
                  <li>Never sent to our servers or stored in our database</li>
                  <li>Automatically expires after 30 days</li>
                  <li>Can be deleted anytime from your profile</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* How to get API key */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <p className="font-medium flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>How to get your Gemini API key:</span>
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>
                Visit{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  Google AI Studio
                  <ExternalLink className="inline h-3 w-3 ml-1" />
                </a>
              </li>
              <li>Sign in with your Google account</li>
              <li>Click "Get API Key" or "Create API Key"</li>
              <li>Copy the generated API key</li>
              <li>Paste it below</li>
            </ol>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="api-key">Gemini API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

