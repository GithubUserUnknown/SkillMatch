import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { templates, Template } from '@/lib/template-loader';
import { FileText, Briefcase, Palette, GraduationCap, Check } from 'lucide-react';

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Template) => void;
  currentTemplateId?: string;
}

export default function TemplateSelector({
  open,
  onOpenChange,
  onSelectTemplate,
  currentTemplateId,
}: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'professional':
        return <Briefcase className="h-4 w-4" />;
      case 'creative':
        return <Palette className="h-4 w-4" />;
      case 'academic':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const professionalTemplates = templates.filter(t => t.category === 'professional');
  const creativeTemplates = templates.filter(t => t.category === 'creative');
  const academicTemplates = templates.filter(t => t.category === 'academic');

  const TemplateCard = ({ template }: { template: Template }) => {
    const isSelected = selectedTemplate?.id === template.id;
    const isCurrent = currentTemplateId === template.id;

    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => handleSelect(template)}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              {getCategoryIcon(template.category)}
              <CardTitle className="text-lg">{template.name}</CardTitle>
            </div>
            {isCurrent && (
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            )}
            {isSelected && (
              <div className="bg-primary text-primary-foreground rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-4 text-xs font-mono overflow-hidden">
            <div className="line-clamp-6 whitespace-pre-wrap">
              {template.content.substring(0, 200)}...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose a Resume Template</DialogTitle>
          <DialogDescription>
            Select a template that best fits your professional background and target role
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="professional" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="professional" className="flex items-center space-x-2">
              <Briefcase className="h-4 w-4" />
              <span>Professional</span>
            </TabsTrigger>
            <TabsTrigger value="creative" className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span>Creative</span>
            </TabsTrigger>
            <TabsTrigger value="academic" className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4" />
              <span>Academic</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="professional" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {professionalTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="creative" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creativeTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="academic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {academicTemplates.map(template => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

