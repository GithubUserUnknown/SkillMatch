import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { User, Briefcase, GraduationCap, Wrench, FolderOpen, Award, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ResumeSection } from "@shared/schema";

interface SectionSidebarProps {
  sections: ResumeSection[];
  onOptimizeSection: (sectionName: string) => void;
  onSectionClick?: (sectionName: string, startLine: number) => void;
}

const sectionIcons = {
  'Summary': User,
  'Professional Summary': User,
  'Work Experience': Briefcase,
  'Education': GraduationCap,
  'Skills': Wrench,
  'Projects': FolderOpen,
  'Certifications': Award,
};

export default function SectionSidebar({ sections, onOptimizeSection, onSectionClick }: SectionSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'Resume Sections': true,
    'Templates': false,
    'Version History': false
  });

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  return (
    <aside className="h-full bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Resume Sections */}
        <Collapsible open={openSections['Resume Sections']} onOpenChange={() => toggleSection('Resume Sections')}>
          <div className="p-4 border-b border-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <h2 className="font-semibold">Resume Sections</h2>
              {openSections['Resume Sections'] ?
                <ChevronDown className="h-4 w-4" /> :
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-1">
                {sections.map((section) => {
                  const Icon = sectionIcons[section.name as keyof typeof sectionIcons] || User;

                  return (
                    <div
                      key={section.name}
                      className="section-header group flex items-center justify-between p-2 rounded-md hover:bg-secondary cursor-pointer"
                      data-testid={`section-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div
                        className="flex items-center space-x-2 flex-1 cursor-pointer"
                        onClick={() => onSectionClick?.(section.name, section.startLine)}
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{section.name}</span>
                      </div>
                      <div className="section-optimize-btn flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-primary text-primary-foreground hover:bg-primary/80"
                          onClick={() => onOptimizeSection(section.name)}
                          data-testid={`optimize-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <i className="fas fa-magic text-xs"></i>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 bg-accent text-accent-foreground hover:bg-accent/80"
                          onClick={() => onOptimizeSection(section.name)}
                          data-testid={`advanced-optimize-${section.name.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <i className="fas fa-cogs text-xs"></i>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Templates */}
        <Collapsible open={openSections['Templates']} onOpenChange={() => toggleSection('Templates')}>
          <div className="p-4 border-b border-border">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <h3 className="font-semibold">Templates</h3>
              {openSections['Templates'] ?
                <ChevronDown className="h-4 w-4" /> :
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Select defaultValue="modern" data-testid="template-select">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern Professional</SelectItem>
                  <SelectItem value="ats">ATS-Simple</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Version History */}
        <Collapsible open={openSections['Version History']} onOpenChange={() => toggleSection('Version History')}>
          <div className="p-4">
            <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
              <h3 className="font-semibold">Version History</h3>
              {openSections['Version History'] ?
                <ChevronDown className="h-4 w-4" /> :
                <ChevronRight className="h-4 w-4" />
              }
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary text-sm">
                  <div>
                    <div className="font-medium">Backend Engineer</div>
                    <div className="text-xs text-muted-foreground">2 hours ago</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                    Load
                  </Button>
                </div>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-secondary text-sm">
                  <div>
                    <div className="font-medium">Data Scientist</div>
                    <div className="text-xs text-muted-foreground">1 day ago</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80">
                    Load
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </aside>
  );
}
