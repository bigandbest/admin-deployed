"use client";

import React from "react";

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Upload, X, Star } from "lucide-react";
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
  setMedia: (media: MediaItem[]) => void;
}

export default function MediaUploader({ media, setMedia }: MediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const mediaType = file.type.startsWith("image") ? "image" : "video";

        const newMedia: MediaItem = {
          media_type: mediaType,
          url,
          is_primary: media.length === 0,
          sort_order: media.length,
          file: file,
        };

        setMedia([...media, newMedia]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
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

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold">Upload Img</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Images Section */}
        <div className="space-y-3">
          <p className="text-sm font-semibold">Product Images</p>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-green-500 bg-green-50/10"
                : "border-border bg-muted/20"
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drag images here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Supports PNG, JPG, WebP
            </p>
            <Button
              size="sm"
              onClick={() => imageInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Images
            </Button>
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageInput}
              className="hidden"
            />
          </div>

          {/* Images Grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setPrimary(index)}
                      variant={image.is_primary ? "default" : "ghost"}
                      className={`gap-1 h-8 ${
                        image.is_primary
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-white/20 hover:bg-white/30 text-white"
                      }`}
                    >
                      <Star className="w-3 h-3" fill="currentColor" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => removeMedia(media.indexOf(image))}
                      variant="ghost"
                      className="bg-red-500/80 hover:bg-red-600 text-white h-8"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  {image.is_primary && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Videos Section */}
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-sm font-semibold">Product Video</p>
          <p className="text-xs text-muted-foreground">
            Only one video is allowed
          </p>

          {videos.length === 0 ? (
            <div className="border border-border rounded-lg p-4 text-center">
              <Button
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                variant="outline"
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Video
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files) {
                    const file = e.target.files[0];
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      setMedia([
                        ...media,
                        {
                          media_type: "video",
                          url,
                          sort_order: media.length,
                        },
                      ]);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium">Video uploaded</p>
                <p className="text-xs text-muted-foreground">
                  {videos[0].url.substring(0, 50)}...
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => removeMedia(media.indexOf(videos[0]))}
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
