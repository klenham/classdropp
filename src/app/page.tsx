"use client";


import { useCallback, useEffect, useRef, useState } from "react";

type Blob = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// pathname looks like "Name/filename.ext-randomsuffix"
function splitPathname(pathname: string) {
  const slash = pathname.indexOf("/");
  const uploader = slash === -1 ? "Anonymous" : pathname.slice(0, slash);
  const rawName = slash === -1 ? pathname : pathname.slice(slash + 1);
  return { uploader, rawName };
}

export default function Home() {
  const [name, setName] = useState("");
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const knownUrls = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  const fetchFiles = useCallback(async () => {
    const res = await fetch("/api/files", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    const fresh: Blob[] = data.blobs;

    if (!firstLoad.current) {
      const newOnes = fresh.filter((b) => !knownUrls.current.has(b.url));
      if (newOnes.length === 1) {
        const { uploader, rawName } = splitPathname(newOnes[0].pathname);
        setToast(`${uploader} dropped ${rawName}`);
        setTimeout(() => setToast(null), 3000);
      } else if (newOnes.length > 1) {
        setToast(`${newOnes.length} new files dropped`);
        setTimeout(() => setToast(null), 3000);
      }
    }
    firstLoad.current = false;
    knownUrls.current = new Set(fresh.map((b) => b.url));
    setBlobs(fresh);
  }, []);

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 2500);
    return () => clearInterval(interval);
  }, [fetchFiles]);

  const doUpload = useCallback(
    async (f: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", f);
        form.append("uploader", name || "Anonymous");
        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) throw new Error("Upload failed");
        if (inputRef.current) inputRef.current.value = "";
        await fetchFiles();
      } catch {
        setToast("Upload failed — try again");
        setTimeout(() => setToast(null), 3000);
      } finally {
        setUploading(false);
      }
    },
    [name, fetchFiles]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) doUpload(f);
  };

  return (
    <div className="min-h-screen bg-[#0b0d10] text-[#e8eaed] flex flex-col items-center px-4 py-10">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#1a8f5e] text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">ClassDrop</h1>
          <p className="text-[#9aa0a6] mt-1 text-sm">
            Drop a file. Everyone in the room sees it appear.
          </p>
        </header>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Your name (shown next to your files)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#161a1f] border border-[#2a2f36] rounded-lg px-4 py-2.5 text-sm placeholder:text-[#6b7178] outline-none focus:border-[#4a90e2] transition-colors"
          />
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver
              ? "border-[#4a90e2] bg-[#4a90e2]/10"
              : "border-[#2a2f36] hover:border-[#3a4048]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doUpload(f);
            }}
          />
          {uploading ? (
            <p className="text-[#9aa0a6]">Uploading…</p>
          ) : (
            <>
              <p className="font-medium">Drop a file here, or click to choose one</p>
              <p className="text-[#6b7178] text-xs mt-1">Uploads instantly for the whole class to see</p>
            </>
          )}
        </label>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-[#9aa0a6] uppercase tracking-wide">
              Shared files
            </h2>
            <span className="text-xs text-[#6b7178]">
              {blobs.length} file{blobs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {blobs.length === 0 ? (
            <p className="text-[#6b7178] text-sm py-8 text-center border border-dashed border-[#2a2f36] rounded-lg">
              No files yet — be the first to drop one.
            </p>
          ) : (
            <ul className="space-y-2">
              {blobs.map((b) => {
                const { uploader, rawName } = splitPathname(b.pathname);
                return (
                  <li
                    key={b.url}
                    className="flex items-center justify-between gap-3 bg-[#161a1f] border border-[#2a2f36] rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0">
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-[#e8eaed] hover:text-[#4a90e2] truncate block"
                      >
                        {rawName}
                      </a>
                      <p className="text-xs text-[#6b7178] mt-0.5">
                        {uploader} · {formatSize(b.size)} · {formatTime(b.uploadedAt)}
                      </p>
                    </div>
                    <a
                      href={b.url}
                      download
                      className="shrink-0 text-xs font-medium bg-[#1f242b] hover:bg-[#2a2f36] border border-[#2a2f36] rounded-md px-3 py-1.5 transition-colors"
                    >
                      Download
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
