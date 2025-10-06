import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { latex } from "codemirror-lang-latex";
import { oneDark } from "@codemirror/theme-one-dark";
import { history, undo, redo, historyKeymap } from "@codemirror/commands";

interface LatexEditorProps {
  content: string;
}

export interface LatexEditorRef {
  getContent: () => string;
  scrollToLine: (lineNumber: number) => void;
}

const LatexEditor = forwardRef<LatexEditorRef, LatexEditorProps>(
  ({ content }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isUpdatingProgrammatically = useRef(false);

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

    return (
      <div className="h-full flex flex-col bg-card latex-editor-container">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <span className="text-sm font-medium">LaTeX Editor</span>
          <span className="text-xs text-muted-foreground">
            Press Ctrl+S to compile
          </span>
        </div>
        <div ref={editorRef} className="flex-1 min-h-0 overflow-hidden" />
      </div>
    );
  }
);

LatexEditor.displayName = "LatexEditor";

export default LatexEditor;


