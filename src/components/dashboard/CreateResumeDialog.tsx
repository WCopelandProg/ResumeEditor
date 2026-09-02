"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api/client";
import { RESUME_TEMPLATES } from "@/lib/resume/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateResumeDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [name, setName] = useState("Untitled Resume");
  const [targetRole, setTargetRole] = useState("");
  const [templateId, setTemplateId] = useState("modern");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const { resume } = await api.createResume({ name, targetRole: targetRole || undefined, templateId });
      onOpenChange(false);
      router.push(`/resume/${resume.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new resume</DialogTitle>
          <DialogDescription>Start from a blank, professionally formatted template.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Name</Label>
            <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-role">Target role (optional)</Label>
            <Input
              id="create-role"
              placeholder="e.g. Senior Product Designer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESUME_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create resume
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
