"use client";

import { useAiHubClient } from "@/hooks/use-ai-hub";
import { cn } from "@/lib/utils";
import {
  ExternalLinkIcon,
  FileTextIcon,
  FileIcon,
  HashIcon,
  LinkIcon,
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

type ChannelOption = { id: string; name: string };

const RESOURCE_TYPES: {
  value: AiHubResourceType;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "url", label: "URL", hint: "Link to a web page", icon: LinkIcon },
  { value: "text", label: "Text", hint: "Paste raw text", icon: FileTextIcon },
  { value: "md", label: "Markdown", hint: "Upload a .md file", icon: FileTextIcon },
  { value: "doc", label: "Document", hint: "Upload a document", icon: FileIcon },
  { value: "pdf", label: "PDF", hint: "Upload a PDF", icon: FileIcon },
];

const TYPE_META: Record<
  AiHubResourceType,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  url: { label: "URL", icon: LinkIcon },
  text: { label: "Text", icon: FileTextIcon },
  md: { label: "Markdown", icon: FileTextIcon },
  doc: { label: "Document", icon: FileIcon },
  pdf: { label: "PDF", icon: FileIcon },
};

const isFileType = (type: AiHubResourceType) =>
  type === "doc" || type === "pdf" || type === "md";

export const AiHubResources = ({
  token,
  organizationId,
  channels,
  initialResources,
}: {
  token: string;
  organizationId: string;
  channels: ChannelOption[];
  initialResources: IAiHubResource[];
}) => {
  const { createResource, deleteResource } = useAiHubClient();

  const [resources, setResources] = useState<IAiHubResource[]>(initialResources);
  const [showForm, setShowForm] = useState(initialResources.length === 0);

  // Resolve allowedChannelIds -> channel name for display.
  const channelMap = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [channels]);

  // --- form state ---
  const [type, setType] = useState<AiHubResourceType>("url");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setType("url");
    setContent("");
    setFileName(null);
    setTagDraft("");
    setTags([]);
    setSelectedChannels([]);
  };

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value) return;
    if (!tags.includes(value)) setTags((prev) => [...prev, value]);
    setTagDraft("");
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    // Read as a base64 data URI so binary files (PDF/doc) survive intact —
    // the server hands this straight to Cloudinary's uploader.
    reader.onload = () => setContent(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error(
        isFileType(type) ? "Please choose a file" : "Please add some content",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await createResource({
        token,
        organizationId,
        body: {
          type,
          content,
          tags,
          allowedChannelIds: selectedChannels,
        },
      });
      setResources((prev) => [res.result, ...prev]);
      toast.success("Resource added to the AI Hub");
      resetForm();
      setShowForm(false);
    } catch {
      toast.error("Failed to add resource");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteResource({ token, organizationId, id });
      setResources((prev) => prev.filter((r) => r.id !== id));
      toast.success("Resource removed");
    } catch {
      toast.error("Failed to remove resource");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-col gap-6 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">AI Hub</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Add knowledge sources Consecto can draw on. Scope each resource to
            the channels that should be able to use it.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((s) => !s)}
          variant={showForm ? "outline" : "default"}
        >
          {showForm ? (
            <>
              <XIcon className="size-4" /> Close
            </>
          ) : (
            <>
              <PlusIcon className="size-4" /> Add resource
            </>
          )}
        </Button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-gradient-to-br from-primary/5 to-accent/5 p-5"
        >
          {/* Type picker */}
          <div className="space-y-2">
            <Label>Resource type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RESOURCE_TYPES.map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setType(opt.value);
                      setContent("");
                      setFileName(null);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content input */}
          <div className="space-y-2">
            <Label htmlFor="resource-content">
              {type === "url" ? "URL" : isFileType(type) ? "File" : "Content"}
            </Label>
            {type === "url" ? (
              <Input
                id="resource-content"
                type="url"
                placeholder="https://example.com/docs"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : type === "text" ? (
              <Textarea
                id="resource-content"
                placeholder="Paste the text you want Consecto to learn from…"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-background py-8 text-center text-sm text-muted-foreground transition-colors hover:bg-muted">
                <UploadIcon className="size-6" />
                <span>
                  {fileName ?? `Click to upload a ${TYPE_META[type].label} file`}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={
                    type === "pdf"
                      ? ".pdf"
                      : type === "md"
                        ? ".md,.markdown"
                        : ".doc,.docx,.txt"
                  }
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="resource-tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="resource-tags"
                placeholder="Add a tag and press Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    <HashIcon className="size-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags((p) => p.filter((t) => t !== tag))}
                      className="ml-0.5 rounded-full hover:text-destructive"
                    >
                      <XIcon className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Allowed channels */}
          <div className="space-y-2">
            <Label>Allowed channels</Label>
            <p className="text-xs text-muted-foreground">
              Leave empty to make this resource available across the whole
              organization.
            </p>
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">No channels yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {channels.map((channel) => {
                  const active = selectedChannels.includes(channel.id);
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <HashIcon className="size-3.5" />
                      {channel.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2Icon className="size-4 animate-spin" />}
              Add resource
            </Button>
          </div>
        </form>
      )}

      {/* Resource list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {resources.length} resource{resources.length === 1 ? "" : "s"}
          </h2>
        </div>

        {resources.length === 0 ? (
          <div className="grid place-items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
              <UploadIcon className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No resources yet. Add your first knowledge source above.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const meta = resource.type
                ? TYPE_META[resource.type]
                : TYPE_META.text;
              const Icon = meta.icon;
              const channelNames = (resource.allowedChannelIds ?? []).map(
                (id) => channelMap.get(id) ?? "Unknown channel",
              );
              return (
                <div
                  key={resource.id}
                  className="group flex flex-col gap-3 rounded-2xl border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <Badge variant="outline">{meta.label}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={deletingId === resource.id}
                      onClick={() => handleDelete(resource.id)}
                      className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                      {deletingId === resource.id ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <TrashIcon className="size-4" />
                      )}
                    </Button>
                  </div>

                  {/* Tags */}
                  {(resource.tags?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resource.tags!.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
                        >
                          <HashIcon className="size-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Channels */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {channelNames.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Available org-wide
                      </span>
                    ) : (
                      channelNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="gap-1">
                          <HashIcon className="size-3" />
                          {name}
                        </Badge>
                      ))
                    )}
                  </div>

                  {/* Source link */}
                  <div className="mt-auto pt-1">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <a
                        href={resource.secureURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        View source
                      </a>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
