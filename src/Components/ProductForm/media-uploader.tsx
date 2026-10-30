"use client";

import React from "react";

import { useState, useRef } from "react";
import { Button } from "../UI/button";
import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/input";
import { Upload, X, ChevronUp, ChevronDown, Check } from "lucide-react";
// import Image from 'next/image';

interface MediaItem {
  media_type: "image" | "video";
  url: string;
  is_primary?: boolean;
  sort_order?: number;
  file?: File;
}

interface MediaUploaderProps {
  media: MediaItem[];
  setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
}

export default function MediaUploader({ media, setMedia }: MediaUploaderProps) {
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // Create array of promises to read files
    const fileReaders = fileArray.map((file) => {
      return new Promise<MediaItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const url = e.target?.result as string;
          const mediaType = file.type.startsWith("image") ? "image" : "video";
          resolve({
            media_type: mediaType,
            url,
            file,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all files to be read
    const newMediaItems = await Promise.all(fileReaders);

    // Update state once with functional update to ensure latest state
    setMedia((prevMedia: MediaItem[]) => {
      const updated = [...prevMedia];
      newMediaItems.forEach((item, index) => {
        updated.push({
          ...item,
          is_primary: updated.length === 0 && index === 0,
          sort_order: updated.length,
        });
      });
      console.log("Updated media with previews:", updated);
      return updated;
    });
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleReplaceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && replaceIndex !== null) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const mediaType = file.type.startsWith("image") ? "image" : "video";

        const updatedMedia = [...media];
        updatedMedia[replaceIndex] = {
          ...updatedMedia[replaceIndex],
          media_type: mediaType,
          url: url,
          file: file,
        };
        setMedia(updatedMedia);
        setReplaceIndex(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerReplace = (index: number) => {
    setReplaceIndex(index);
    replaceInputRef.current?.click();
  };

  const removeMedia = (index: number) => {
    const updated = media.filter((_, i) => i !== index);
    // Update sort order
    updated.forEach((item, idx) => {
      item.sort_order = idx;
    });
    setMedia(updated);
  };

  const setPrimary = (index: number) => {
    const updated = media.map((item, idx) => ({
      ...item,
      is_primary: idx === index,
    }));
    setMedia(updated);
  };

  const images = media.filter((m) => m.media_type === "image");
  const videos = media.filter((m) => m.media_type === "video");

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader
        className="flex cursor-pointer flex-row items-center justify-between border-b border-border pb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-sm font-medium">Images</CardTitle>
        {isExpanded ? (
          <ChevronUp className="size-4 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" strokeWidth={1.5} />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6 space-y-6">
          {/* Images Section */}
          <div className="flex flex-col gap-3">
            <p className="text-sm">Photos</p>

            {/* Images Display */}
            {images.length > 0 && (
              <div className="space-y-3">
                {/* Large Primary Image */}
                {images
                  .filter((img) => img.is_primary)
                  .map((image, index) => (
                    <div
                      key={`primary-${index}`}
                      className="group relative overflow-hidden rounded-xl bg-muted"
                    >
                      <div className="aspect-[4/3] flex items-center justify-center p-4">
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt="Primary product"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity duration-150 ease-desk group-hover:opacity-100">
                        <Button
                          size="sm"
                          onClick={() =>
                            triggerReplace(
                              images.findIndex((img) => img.is_primary),
                            )
                          }
                          variant="outline"
                          className="h-9 bg-background transition-colors duration-150 ease-desk"
                          title="Replace image"
                        >
                          <Upload className="size-4" strokeWidth={1.5} />
                          Replace
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            removeMedia(
                              images.findIndex((img) => img.is_primary),
                            )
                          }
                          variant="outline"
                          className="h-9 bg-background text-[#dc2626] transition-colors duration-150 ease-desk"
                          title="Remove image"
                        >
                          <X className="size-4" strokeWidth={1.5} />
                          Remove
                        </Button>
                      </div>
                      <div className="absolute top-3 left-3 rounded-sm bg-background/90 px-2 py-1 font-mono text-xs text-muted-foreground">
                        Primary
                      </div>
                    </div>
                  ))}

                {/* Thumbnail Grid */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group flex-shrink-0 ${
                        image.is_primary ? "hidden" : ""
                      }`}
                    >
                      <div
                        className="size-20 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted transition-colors duration-150 ease-desk hover:border-primary"
                        onClick={() => setPrimary(index)}
                        title="Click to set as primary"
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/60 opacity-0 transition-opacity duration-150 ease-desk group-hover:opacity-100">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimary(index);
                          }}
                          variant="outline"
                          className="size-8 bg-background p-0"
                          title="Set as primary"
                        >
                          <Check className="size-4" strokeWidth={1.5} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedia(index);
                          }}
                          variant="outline"
                          className="size-8 bg-background p-0 text-[#dc2626]"
                          title="Remove"
                        >
                          <X className="size-4" strokeWidth={1.5} />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-foreground/15 bg-background transition-colors duration-150 ease-desk hover:bg-muted"
                    title="Add images"
                  >
                    <Upload className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Empty State - Only show if no images */}
            {images.length === 0 && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-lg border border-dashed p-8 text-center transition-colors duration-150 ease-desk ${
                  dragActive
                    ? "border-primary bg-muted"
                    : "border-border bg-muted/20"
                }`}
              >
                <Upload className="mx-auto mb-3 size-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="mb-1 text-sm">
                  Drop images here, or choose files
                </p>
                <p className="mb-4 text-xs text-muted-foreground">
                  PNG, JPG, WebP
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="transition-colors duration-150 ease-desk"
                >
                  <Upload className="size-4" strokeWidth={1.5} />
                  Choose images
                </Button>
              </div>
            )}

            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageInput}
              className="hidden"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceInput}
              className="hidden"
            />
          </div>

          {/* YouTube Video Section */}
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm">YouTube link</p>
            <p className="text-xs text-muted-foreground">
              A YouTube URL for this product
            </p>

            <div className="space-y-2">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videos.length > 0 ? videos[0].url : ""}
                onChange={(e) => {
                  const url = e.target.value;
                  if (url) {
                    // Remove existing video if any
                    const filteredMedia = media.filter(
                      (m) => m.media_type !== "video",
                    );
                    // Add new video URL
                    setMedia([
                      ...filteredMedia,
                      {
                        media_type: "video",
                        url: url,
                        sort_order: filteredMedia.length,
                      },
                    ]);
                  } else {
                    // Remove video if URL is cleared
                    setMedia(media.filter((m) => m.media_type !== "video"));
                  }
                }}
                className="bg-muted/50 border-input"
              />
              {videos.length > 0 && (
                <div className="flex h-9 items-center justify-between rounded-lg border border-border px-3">
                  <p className="text-xs text-muted-foreground">Link added</p>
                  <Button
                    size="sm"
                    onClick={() =>
                      setMedia(media.filter((m) => m.media_type !== "video"))
                    }
                    variant="ghost"
                    className="size-8 p-0 text-muted-foreground"
                    aria-label="Remove link"
                  >
                    <X className="size-4" strokeWidth={1.5} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
