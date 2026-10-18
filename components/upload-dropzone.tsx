
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadReceipts, USING_MOCK_API } from "@/lib/api";
import { useSession } from "@/lib/auth";
import { isDemoSession, saveAccountShop, sampleShop } from "@/lib/account-shops";



const ACCEPTED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_MB = 10;

export default function UploadDropzone() {
  const session = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  

  function addFiles(list: FileList | null) {
    if (!list) return;
    const valid: File[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(list)) {
      if (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_MB * 1024 * 1024) {
        rejected.push(file.name);
      } else {
        valid.push(file);
      }
    }

    setFiles((prev) => [...prev, ...valid]);
    setStatus("idle");
    setMessage(
      rejected.length ? `Skipped (wrong type or over ${MAX_MB} MB): ${rejected.join(", ")}` : ""
    );
  }

  async function handleUpload() {
    setStatus("uploading");
    setMessage("");
    try {
      const res = await uploadReceipts(files);
if (session && !isDemoSession(session)) {
  const data = res.shop ?? (USING_MOCK_API ? sampleShop(session.shopName) : null);
  if (data) saveAccountShop(session.email, data);
}
      setStatus("done");
      setMessage(`${files.length} receipt${files.length > 1 ? "s" : ""} uploaded.`);
      setFiles([]);
    } catch {
      setStatus("error");
      setMessage("Upload failed. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
            : "border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        }`}
      >
        <p className="font-medium">Drag and drop receipts here</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          or click to browse · PNG, JPG or PDF · up to {MAX_MB} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-sm text-zinc-500 hover:text-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && (
        <p
          className={`text-sm ${
            status === "done"
              ? "text-emerald-600"
              : status === "error"
                ? "text-red-600"
                : "text-amber-600"
          }`}
        >
          {message}
        </p>
      )}

      {status === "done" && (
        <Link href="/reports" className="text-sm font-medium text-emerald-600 hover:underline">
          View your health report
        </Link>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || status === "uploading"}
        className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {status === "uploading" ? "Uploading..." : "Upload receipts"}
      </button>
    </div>
  );
}