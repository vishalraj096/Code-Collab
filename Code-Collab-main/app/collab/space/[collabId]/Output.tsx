export default function OutputTerminal({ output }: { output: string }) {
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-lg font-bold mb-2">Output</h1>
      <div className="flex-1 bg-background text-foreground p-3 rounded-lg shadow-md overflow-auto">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm">
          {output}
        </pre>
      </div>
    </div>
  );
}
