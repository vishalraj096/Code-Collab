import React, { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { registerCompletion } from "monacopilot";

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
    editorRef.current = editor;
    monacoRef.current = monaco;

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
  }

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
      <Editor
        language={getMonacoLanguage(lang)}
        theme="vs-dark"
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: "Jetbrains-Mono",
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
        }}
      />
    </div>
  );
}
