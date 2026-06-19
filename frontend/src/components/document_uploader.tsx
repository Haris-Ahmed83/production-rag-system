import { useState, useRef } from "react";

interface DocumentUploaderProps {
  token: string;
}

function DocumentUploader({ token }: DocumentUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const allowed = [".pdf", ".html", ".htm", ".md", ".mdx", ".txt"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowed.includes(ext)) {
      setError(`Unsupported file type: ${ext}`);
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/ingest/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Upload failed");
      }

      const data = await res.json();
      setResult(`Ingested: ${data.chunks_created} chunks created`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="p-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.html,.htm,.md,.mdx,.txt"
          onChange={handleSelect}
          className="hidden"
        />

        <p className="text-gray-600 font-medium">
          {uploading
            ? "Processing document..."
            : "Drop a document here or click to upload"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF, HTML, Markdown, or Text</p>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {result && (
        <p className="mt-3 text-sm text-green-600 bg-green-50 rounded-lg p-3">{result}</p>
      )}
    </div>
  );
}

export default DocumentUploader;
