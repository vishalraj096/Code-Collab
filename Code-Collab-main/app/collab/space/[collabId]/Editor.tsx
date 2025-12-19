import React, { useEffect, useRef, useState } from "react";
import Editor, { Monaco, loader } from "@monaco-editor/react";
import { registerCompletion } from "monacopilot";

// Try to use a more reliable CDN
loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
  }
});

// Pre-initialize Monaco
loader.init().then((monaco) => {
  console.log('Monaco pre-initialized successfully');
}).catch((error) => {
  console.error('Monaco pre-initialization failed:', error);
});

export default function CodeEditor({
  value,
  onChange,
  lang,
}: {
  value: string;
  onChange: any;
  lang: string;
}) {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const getMonacoLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: "javascript",
      javaScript: "javascript",
      py: "python",
      python: "python",
      c: "c",
      rs: "rust",
      rust: "rust",
      java: "java",
    };

    return languageMap[lang] || lang;
  };

  function handleEditorDidMount(editor: any, monaco: Monaco) {
    try {
      console.log("Monaco Editor mounted successfully");
      editorRef.current = editor;
      monacoRef.current = monaco;
      setIsLoading(false);
      setHasError(false);

      // Only try to register completion if backend is available
      try {
        const completion = registerCompletion(monaco, editor, {
          endpoint: "http://localhost:4000/complete",
          language: lang,
          trigger: "onDemand",
        });

        monaco.editor.addEditorAction({
          id: "monacopilot.triggerCompletion",
          label: "Complete Code",
          contextMenuGroupId: "navigation",
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Space,
          ],
          run: () => {
            completion.trigger();
          },
        });

        registerCompletion(monaco, editor, {
          endpoint: "http://localhost:4000/complete",
          language: lang,
        });
      } catch (completionError) {
        console.warn("Code completion not available:", completionError);
        // Continue without completion features
      }
    } catch (error) {
      console.error("Error in handleEditorDidMount:", error);
      setHasError(true);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Set a timeout to detect if Monaco is taking too long to load
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.error("Monaco Editor loading timeout");
        setHasError(true);
        setIsLoading(false);
      }
    }, 15000); // Increased to 15 seconds

    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Add error handling for Monaco loader
  useEffect(() => {
    const handleMonacoError = () => {
      console.error("Monaco Editor failed to load from CDN");
      setHasError(true);
      setIsLoading(false);
    };

    // Set up error handling
    window.addEventListener('error', (e) => {
      if (e.filename && e.filename.includes('monaco')) {
        handleMonacoError();
      }
    });

    return () => {
      window.removeEventListener('error', handleMonacoError);
    };
  }, []);

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      console.log("Sending Request for lang" + lang);
      registerCompletion(monacoRef.current, editorRef.current, {
        endpoint: "http://localhost:4000/complete",
        language: lang,
      });
    }
  }, [lang]);

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      console.log(`Editor update: Setting ${value.length} characters of code`);

      // Only update if the value has changed to avoid infinite loops
      const currentValue = editorRef.current.getValue();
      if (currentValue !== value) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(
          model,
          getMonacoLanguage(lang)
        );
      }
    }
  }, [lang]);

  return (
    <div className="md:h-[90vh] md:w-[98%] h-[60vh] border-2">
      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="text-lg">Loading Code Editor...</div>
        </div>
      )}
      {hasError && (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-lg text-red-500 mb-4">Editor failed to load</div>
          <div className="space-y-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                window.location.reload();
              }}
            >
              Reload Page
            </button>
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => {
                setHasError(false);
                setIsLoading(false);
              }}
            >
              Use Simple Editor
            </button>
          </div>
          {!isLoading && !hasError && (
            <textarea
              className="w-full h-full p-4 bg-gray-900 text-white font-mono text-sm resize-none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Simple text editor fallback..."
            />
          )}
        </div>
      )}
      {!hasError && (
        <Editor
          language={getMonacoLanguage(lang)}
          theme="vs-dark"
          value={value}
          onChange={onChange}
          onMount={handleEditorDidMount}
          onValidate={(markers) => {
            console.log("Editor validation markers:", markers);
          }}
          loading={<div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading Monaco Editor...</div>
          </div>}
          options={{
            fontSize: 14,
            fontFamily: "Jetbrains-Mono, Consolas, 'Courier New', monospace",
            fontLigatures: true,
            wordWrap: "on",
            minimap: {
              enabled: false,
            },
            bracketPairColorization: {
              enabled: true,
            },
            cursorBlinking: "expand",
            formatOnPaste: true,
            suggest: {
              showFields: false,
              showFunctions: false,
            },
            // Add these options for better stability
            automaticLayout: true,
            scrollBeyondLastLine: false,
            readOnly: false,
          }}
        />
      )}
    </div>
  );
}
