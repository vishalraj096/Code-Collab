import React from "react";

interface SimpleEditorProps {
  value: string;
  onChange: (value: string) => void;
  lang: string;
}

export default function SimpleEditor({ value, onChange, lang }: SimpleEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="md:h-[90vh] md:w-[98%] h-[60vh] border-2 rounded">
      <div className="bg-gray-800 text-white px-4 py-2 text-sm flex items-center justify-between">
        <span>Simple Code Editor - Language: {lang}</span>
        <span className="text-gray-400">Monaco Editor Alternative</span>
      </div>
      <textarea
        className="w-full h-[calc(100%-40px)] p-4 bg-gray-900 text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value}
        onChange={handleChange}
        placeholder={`Write your ${lang} code here...`}
        style={{
          fontFamily: "Consolas, 'Courier New', monospace",
          lineHeight: "1.5",
          tabSize: 2,
        }}
        spellCheck={false}
      />
    </div>
  );
}
