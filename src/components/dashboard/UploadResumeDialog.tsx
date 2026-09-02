"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload, FileWarning } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api/client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadResumeDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.");
      return;
    }
    setUploading(true);
    try {
      const result = await api.uploadResume(file);
      onOpenChange(false);
      router.push(`/resume/${result.resume.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !uploading && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload your resume</DialogTitle>
          <DialogDescription>
            Upload a PDF and we&apos;ll reconstruct it as an editable, structured resume. Max 10MB.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
            dragging ? "border-primary bg-accent" : "border-border hover:bg-secondary/50",
            uploading && "pointer-events-none opacity-70"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Parsing your resume…</p>
            </>
          ) : (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Upload className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">Drop your PDF here, or click to browse</p>
              <p className="text-xs text-muted-foreground">PDF only, up to 10MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {error ? (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
