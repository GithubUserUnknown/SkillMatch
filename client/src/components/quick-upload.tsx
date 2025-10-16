import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FileText, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface QuickUploadProps {
  onUploadSuccess: (sections: Array<{ name: string; content: string }>, latexContent: string) => void;
}

export default function QuickUpload({ onUploadSuccess }: QuickUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      onUploadSuccess(data.sections, data.latexContent);
      setUploadedFile(data.sections[0]?.name || 'Resume');
      toast({
        title: "Resume uploaded successfully",
        description: "Your resume has been parsed and is ready for optimization.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file) return;
    
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* File Upload Option */}
      <div>
        <h4 className="font-medium mb-3">Upload New File</h4>
        <Card
          className={`file-drop-zone cursor-pointer transition-all ${dragOver ? 'dragover' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          data-testid="file-drop-zone"
        >
          <CardContent className="p-8 text-center">
            {uploadMutation.isPending ? (
              <div className="space-y-3">
                <i className="fas fa-spinner animate-spin text-3xl text-primary"></i>
                <p className="text-sm font-medium">Uploading and parsing...</p>
                <p className="text-xs text-muted-foreground">This may take a moment</p>
              </div>
            ) : uploadedFile ? (
              <div className="space-y-3">
                <Check className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-green-600">Resume uploaded successfully!</p>
                <p className="text-xs text-muted-foreground">File: {uploadedFile}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <CloudUpload className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">Drop your resume here or click to browse</p>
                <p className="text-xs text-muted-foreground">Supports PDF, DOCX files up to 10MB</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc"
          onChange={handleFileChange}
          data-testid="file-input"
        />
      </div>

      {/* Saved Resume Option */}
      <div>
        <h4 className="font-medium mb-3">Use Saved Resume</h4>
        <div className="space-y-2">
          <Card className="cursor-pointer hover:bg-secondary transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Backend Engineer Resume</div>
                    <div className="text-xs text-muted-foreground">Modified 2 hours ago</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                  Select
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:bg-secondary transition-colors">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">Data Scientist Resume</div>
                    <div className="text-xs text-muted-foreground">Modified 1 day ago</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                  Select
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
