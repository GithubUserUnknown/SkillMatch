import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { oneDark } from "@codemirror/theme-one-dark";
import { history, undo, redo, historyKeymap } from "@codemirror/commands";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LatexEditorProps {
  content: string;
  onSave?: () => void;
  onDownload?: () => void;
}

export interface LatexEditorRef {
  getContent: () => string;
  scrollToLine: (lineNumber: number) => void;
}

const LatexEditor = forwardRef<LatexEditorRef, LatexEditorProps>(
  ({ content, onSave, onDownload }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isUpdatingProgrammatically = useRef(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [versionName, setVersionName] = useState("");

    // Expose getContent and scrollToLine methods to parent
    useImperativeHandle(ref, () => ({
      getContent: () => {
        return viewRef.current?.state.doc.toString() || "";
      },
      scrollToLine: (lineNumber: number) => {
        if (viewRef.current) {
          const doc = viewRef.current.state.doc;
          // Convert 1-based line number to 0-based and get the line position
          const line = Math.max(1, Math.min(lineNumber, doc.lines));
          const pos = doc.line(line).from;

          // Scroll to the line and center it in the view
          viewRef.current.dispatch({
            effects: EditorView.scrollIntoView(pos, { y: "center" })
          });

          // Also set cursor to the beginning of the line
          viewRef.current.dispatch({
            selection: { anchor: pos, head: pos }
          });
        }
      },
    }));

    useEffect(() => {
      if (editorRef.current && !viewRef.current) {
        const state = EditorState.create({
          doc: content,
          extensions: [
            latex(),
            oneDark,
            history(),
            keymap.of([
              ...historyKeymap,
              { key: "Mod-z", run: undo },
              { key: "Mod-y", run: redo },
            ]),
            EditorView.theme({
              "&": {
                height: "100%",
                fontSize: "14px",
              },
              ".cm-scroller": {
                overflow: "auto",
                maxHeight: "100%",
              },
              ".cm-content": {
                padding: "16px",
                minHeight: "100%",
              },
              ".cm-focused": {
                outline: "none",
              },
            }),
          ],
        });

        const view = new EditorView({
          state,
          parent: editorRef.current,
        });

        viewRef.current = view;
      }

      return () => {
        if (viewRef.current) {
          viewRef.current.destroy();
          viewRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (
        viewRef.current &&
        content !== viewRef.current.state.doc.toString()
      ) {
        isUpdatingProgrammatically.current = true;
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: viewRef.current.state.doc.length,
            insert: content,
          },
        });
        // Reset the flag after the update
        setTimeout(() => {
          isUpdatingProgrammatically.current = false;
        }, 0);
      }
    }, [content]);

    const handleSaveVersion = () => {
      if (!versionName.trim()) return;

      const content = viewRef.current?.state.doc.toString() || "";
      const versions = JSON.parse(localStorage.getItem('latex_versions') || '[]');

      versions.push({
        name: versionName,
        content,
        timestamp: new Date().toISOString(),
      });

      localStorage.setItem('latex_versions', JSON.stringify(versions));
      setVersionName("");
      setShowSaveDialog(false);

      if (onSave) onSave();
    };

    const handleDownloadTex = () => {
      const content = viewRef.current?.state.doc.toString() || "";
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.tex';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (onDownload) onDownload();
    };

    return (
      <>
        <div className="h-full flex flex-col bg-card latex-editor-container">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-sm font-medium">LaTeX Editor</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                title="Save version to browser cache"
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTex}
                title="Download .tex file"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <span className="text-xs text-muted-foreground">
                Ctrl+S to compile
              </span>
            </div>
          </div>
          <div ref={editorRef} className="flex-1 min-h-0 overflow-hidden" />
        </div>

        {/* Save Version Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Version</DialogTitle>
              <DialogDescription>
                Give this version a name to save it in your browser's version history
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="version-name">Version Name</Label>
                <Input
                  id="version-name"
                  placeholder="e.g., Software Engineer Resume v1"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveVersion();
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveVersion} disabled={!versionName.trim()}>
                Save Version
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

LatexEditor.displayName = "LatexEditor";

export default LatexEditor;


