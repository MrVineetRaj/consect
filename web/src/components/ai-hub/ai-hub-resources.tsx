"use client";

import { useAiHubClient } from "@/hooks/use-ai-hub";
import { cn } from "@/lib/utils";
import {
  ArrowDownUpIcon,
  CalendarIcon,
  ExternalLinkIcon,
  FileIcon,
  FileTextIcon,
  HashIcon,
  Loader2Icon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  ScanSearchIcon,
  SparklesIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { icons } from "@/lib/assets";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    image: string;
  }
> = {
  url: { label: "URL", icon: LinkIcon, image: icons.urlFile },
  text: { label: "Text", icon: FileTextIcon, image: icons.textFile },
  md: { label: "Markdown", icon: FileTextIcon, image: icons.markdownFile },
  doc: { label: "Document", icon: FileIcon, image: icons.docFile },
  pdf: { label: "PDF", icon: FileIcon, image: icons.pdfFile },
};

const STATUS_META: Record<
  AiHubResourceStatus,
  { label: string; dot: string; className: string }
> = {
  success: {
    label: "Success",
    dot: "bg-emerald-500",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  },
  processing: {
    label: "Processing",
    dot: "bg-amber-500",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  },
  pending: {
    label: "Pending",
    dot: "bg-muted-foreground",
    className: "border-border bg-muted text-muted-foreground",
  },
  failed: {
    label: "Failed",
    dot: "bg-destructive",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const isFileType = (type: AiHubResourceType) =>
  type === "doc" || type === "pdf" || type === "md";

// Prefer the user-given name; otherwise derive a readable title from the
// stored URL — hostname for links, file segment for uploads.
const resourceTitle = (resource: IAiHubResource): string => {
  if (resource.name?.trim()) return resource.name.trim();
  try {
    const url = new URL(resource.secureURL);
    if (resource.type === "url") {
      const path = url.pathname === "/" ? "" : url.pathname;
      return url.hostname.replace(/^www\./, "") + path;
    }
    const segment = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    return segment || resource.publicId;
  } catch {
    return resource.publicId || "Untitled resource";
  }
};

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
  const { createResource, updateResource, deleteResource } = useAiHubClient();

  const [resources, setResources] = useState<IAiHubResource[]>(initialResources);
  const [formOpen, setFormOpen] = useState(false);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Resolve allowedChannelIds -> channel name for display.
  const channelMap = useMemo(() => {
    const map = new Map<string, string>();
    channels.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [channels]);

  const sortedResources = useMemo(() => {
    const copy = [...resources];
    copy.sort((a, b) => {
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
    return copy;
  }, [resources, sortDir]);

  // --- form state ---
  const [type, setType] = useState<AiHubResourceType>("url");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- edit dialog state ---
  const [editing, setEditing] = useState<IAiHubResource | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editChannels, setEditChannels] = useState<string[]>([]);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagDraft, setEditTagDraft] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openEdit = (resource: IAiHubResource) => {
    setEditing(resource);
    setEditName(resource.name ?? "");
    setEditDescription(resource.description ?? "");
    setEditChannels(resource.allowedChannelIds ?? []);
    setEditTags(resource.tags ?? []);
    setEditTagDraft("");
  };

  const toggleEditChannel = (id: string) => {
    setEditChannels((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const addEditTag = () => {
    const value = editTagDraft.trim();
    if (!value) return;
    if (!editTags.includes(value)) setEditTags((prev) => [...prev, value]);
    setEditTagDraft("");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditSubmitting(true);
    try {
      const res = await updateResource({
        token,
        organizationId,
        body: {
          id: editing.id,
          name: editName.trim(),
          description: editDescription.trim(),
          allowedChannelIds: editChannels,
          tags: editTags,
        },
      });
      setResources((prev) =>
        prev.map((r) => (r.id === res.result.id ? res.result : r)),
      );
      toast.success("Resource updated");
      setEditing(null);
    } catch {
      toast.error("Failed to update resource");
    } finally {
      setEditSubmitting(false);
    }
  };

  const resetForm = () => {
    setType("url");
    setName("");
    setDescription("");
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
          name: name.trim() || undefined,
          description: description.trim() || undefined,
          content,
          tags,
          allowedChannelIds: selectedChannels,
        },
      });
      setResources((prev) => [res.result, ...prev]);
      toast.success("Resource added to the AI Hub");
      resetForm();
      setFormOpen(false);
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
    <div className="relative h-full w-full overflow-y-auto">
      <div className="flex w-full flex-col gap-8 p-8 lg:p-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
              AI Hub
            </h1>
            <p className="max-w-xl text-base text-muted-foreground">
              Add knowledge sources Consecto can draw on. Scope each resource to
              the channels that should be able to use it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {resources.length} resource{resources.length === 1 ? "" : "s"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSortDir((d) => (d === "desc" ? "asc" : "desc"))
              }
            >
              <ArrowDownUpIcon className="size-3.5" />
              Sort by date
            </Button>
          </div>
        </div>

        {/* Resource list */}
        {resources.length === 0 ? (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="grid w-full place-items-center gap-3 rounded-2xl border border-dashed py-20 text-center transition-colors hover:border-primary/40 hover:bg-muted/30"
          >
            <div className="grid size-12 place-items-center rounded-2xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <UploadIcon className="size-6" />
            </div>
            <p className="text-sm text-muted-foreground">
              No resources yet. Click to add your first knowledge source.
            </p>
          </button>
        ) : (
          <div className="grid gap-5 md:grid-cols-3 2xl:grid-cols-4">
            {sortedResources.map((resource) => {
              const meta = resource.type
                ? TYPE_META[resource.type]
                : TYPE_META.text;
              const status = STATUS_META[resource.status ?? "pending"];
              const title = resourceTitle(resource);
              const channelNames = (resource.allowedChannelIds ?? []).map(
                (id) => channelMap.get(id) ?? "Unknown channel",
              );
              const isReady = resource.status === "success";
              const isFailed = resource.status === "failed";

              return (
                <div
                  key={resource.id}
                  className="group flex flex-col gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  {/* Top row: icon · status · menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15">
                      <Image
                        src={meta.image}
                        alt={meta.label}
                        width={28}
                        height={28}
                        className="size-7 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
                          status.className,
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            status.dot,
                            resource.status === "processing" &&
                              "animate-pulse",
                          )}
                        />
                        {status.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(resource)}
                        aria-label="Edit resource"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={deletingId === resource.id}
                        onClick={() => handleDelete(resource.id)}
                        aria-label="Delete resource"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        {deletingId === resource.id ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <TrashIcon className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Title + description + date */}
                  <div className="space-y-1.5">
                    <p
                      className="truncate text-sm font-medium"
                      title={title}
                    >
                      {title}
                    </p>
                    {resource.description?.trim() && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {resource.description}
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarIcon className="size-3.5" />
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </p>
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

                  {/* Footer */}
                  <div className="mt-auto pt-1">
                    {isFailed ? (
                      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                        Indexing failed. Try removing and re-adding this
                        resource.
                      </p>
                    ) : !isReady ? (
                      <div className="space-y-2">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full w-1/2 animate-pulse rounded-full bg-linear-to-r from-primary to-accent" />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Indexing in progress…
                        </p>
                      </div>
                    ) : (
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
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Feature highlight */}
        <div className="grid gap-6 rounded-2xl border bg-linear-to-br from-primary/5 to-accent/5 p-6 md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 text-primary"
            >
              <SparklesIcon className="size-3.5" />
              Smart indexing
            </Badge>
            <h2 className="text-2xl font-semibold tracking-tight">
              Advanced semantic search
              <br />
              <span className="text-primary">for your entire team.</span>
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Every file you add is automatically vectorized and indexed using a
              multi-model approach. This lets Consecto give pinpoint-accurate
              answers across different file formats, contexts, and languages.
            </p>
          </div>
          <div className="grid aspect-video place-items-center gap-2 rounded-xl border bg-background/60 text-center">
            <div className="grid size-12 place-items-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 text-primary">
              <ScanSearchIcon className="size-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide">
                Indexing engine monitor
              </p>
              <p className="text-xs text-muted-foreground">
                Real-time vector processing visualization
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating add button */}
      <Button
        size="icon"
        onClick={() => setFormOpen(true)}
        className="fixed bottom-8 right-8 z-20 size-14 rounded-full shadow-lg"
        aria-label="Add resource"
      >
        <PlusIcon className="size-6" />
      </Button>

      {/* Upload form modal */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-lg">
          <DialogHeader className="mb-5">
            <DialogTitle>Add resource</DialogTitle>
            <DialogDescription>
              Upload a knowledge source and scope it to the channels that can
              use it.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="resource-name">Name</Label>
              <Input
                id="resource-name"
                placeholder="e.g. Q2 Marketing Strategy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="resource-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="resource-description"
                placeholder="A short note on what this resource covers…"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Type picker — compact inline pills */}
            <div className="space-y-2">
              <Label>Resource type</Label>
              <div className="flex flex-wrap gap-1.5">
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
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        active
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <Icon className="size-3.5" />
                      {opt.label}
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
                    {fileName ??
                      `Click to upload a ${TYPE_META[type].label} file`}
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
                        onClick={() =>
                          setTags((p) => p.filter((t) => t !== tag))
                        }
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
                  setFormOpen(false);
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
        </DialogContent>
      </Dialog>

      {/* Edit resource modal */}
      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto sm:max-w-lg">
          <DialogHeader className="mb-5">
            <DialogTitle>Edit resource</DialogTitle>
            <DialogDescription>
              Update the name, description, and channels this resource is scoped
              to.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g. Q2 Marketing Strategy"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="edit-description"
                placeholder="A short note on what this resource covers…"
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-tags"
                  placeholder="Add a tag and press Enter"
                  value={editTagDraft}
                  onChange={(e) => setEditTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEditTag();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addEditTag}>
                  Add
                </Button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {editTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <HashIcon className="size-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setEditTags((p) => p.filter((t) => t !== tag))
                        }
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
                    const active = editChannels.includes(channel.id);
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => toggleEditChannel(channel.id)}
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
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
