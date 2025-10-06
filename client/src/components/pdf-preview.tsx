import { Button } from "@/components/ui/button";
import { Download, Maximize2, FileText, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface PdfPreviewProps {
  resumeId: string | null;
  onDownload: () => void;
  pdfUrl?: string; // Add pdfUrl prop to trigger refresh when PDF is compiled
  compilationError?: {
    error: string;
    errorLine?: number;
    errorMessage?: string;
    logs?: string;
  } | null;
  onErrorLineClick?: (line: number) => void;
}

export default function PdfPreview({ resumeId, onDownload, pdfUrl, compilationError, onErrorLineClick }: PdfPreviewProps) {
  const [pdfKey, setPdfKey] = useState(0);

  // Force refresh when resumeId or pdfUrl changes
  useEffect(() => {
    setPdfKey(prev => prev + 1);
  }, [resumeId, pdfUrl]);

  return (
    <div className="h-full flex flex-col bg-muted">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">PDF Preview</span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={onDownload}
          disabled={!resumeId || !!compilationError}
          data-testid="download-pdf"
        >
          <Download className="h-3 w-3 mr-1" />
          Download PDF
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="h-full w-full">
          {compilationError ? (
            <div className="h-full w-full bg-white flex items-center justify-center p-8">
              <div className="max-w-2xl w-full">
                <div className="flex items-start space-x-4 mb-6">
                  <AlertCircle className="h-12 w-12 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Compilation Error</h2>
                    <p className="text-gray-700 mb-4">
                      Your LaTeX code contains errors that prevent PDF generation.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <p className="font-semibold text-red-800 mb-2">
                        {compilationError.errorMessage || compilationError.error}
                      </p>
                      {compilationError.errorLine && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-red-700">
                            Error at line {compilationError.errorLine}
                          </span>
                          {onErrorLineClick && (
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-red-600 hover:text-red-800"
                              onClick={() => onErrorLineClick(compilationError.errorLine!)}
                            >
                              Go to line →
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {compilationError.logs && (
                  <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
                      View Full Compilation Log
                    </summary>
                    <pre className="mt-4 text-xs text-gray-600 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {compilationError.logs}
                    </pre>
                  </details>
                )}

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Fix the error in the LaTeX editor and press Ctrl+S to recompile.
                  </p>
                </div>
              </div>
            </div>
          ) : resumeId ? (
            <iframe
              key={pdfKey}
              src={`/api/resumes/${resumeId}/preview?t=${Date.now()}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-none"
              title="Resume PDF Preview"
              style={{
                display: 'block',
                border: 'none',
                outline: 'none',
                minHeight: '100%'
              }}
            />
          ) : (
            <div className="h-full w-full bg-white flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No PDF Available</p>
                <p>Press Ctrl+S to compile your LaTeX code and generate a PDF preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

