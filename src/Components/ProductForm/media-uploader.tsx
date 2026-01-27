"use client";

import React from "react";

import { useState, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Upload, X, Star, ChevronUp, ChevronDown } from "lucide-react";
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
            file
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
          sort_order: updated.length
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
          file: file
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
    <Card className="bg-card border-border">
      <CardHeader
        className="border-b border-border pb-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold">Upload Img</CardTitle>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6 space-y-6">
          {/* Images Section */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">Product Images</p>

            {/* Images Display */}
            {images.length > 0 && (
              <div className="space-y-3">
                {/* Large Primary Image */}
                {images.filter(img => img.is_primary).map((image, index) => (
                  <div key={`primary-${index}`} className="relative group rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <div className="aspect-[4/3] flex items-center justify-center p-4">
                      <img
                        src={image.url || "/placeholder.svg"}
                        alt="Primary product"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => triggerReplace(images.findIndex(img => img.is_primary))}
                        variant="ghost"
                        className="bg-blue-500/90 hover:bg-blue-600 text-white h-9 px-4"
                        title="Replace Image"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => removeMedia(images.findIndex(img => img.is_primary))}
                        variant="ghost"
                        className="bg-red-500/90 hover:bg-red-600 text-white h-9 px-4"
                        title="Remove Image"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" fill="currentColor" />
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
                        image.is_primary ? 'hidden' : ''
                      }`}
                    >
                      <div 
                        className={`w-20 h-20 rounded-lg overflow-hidden bg-muted border-2 cursor-pointer transition-all ${
                          image.is_primary 
                            ? 'border-yellow-500 ring-2 ring-yellow-500/20' 
                            : 'border-border hover:border-primary'
                        }`}
                        onClick={() => setPrimary(index)}
                        title="Click to set as primary"
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimary(index);
                          }}
                          variant="ghost"
                          className="bg-white/90 hover:bg-white text-gray-900 h-7 w-7 p-0"
                          title="Set as Primary"
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMedia(index);
                          }}
                          variant="ghost"
                          className="bg-red-500/90 hover:bg-red-600 text-white h-7 w-7 p-0"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-green-50 hover:border-green-500 dark:hover:bg-green-900/20 transition-all flex items-center justify-center group"
                    title="Add more images"
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-1 group-hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                      </div>
                    </div>
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
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                  ? "border-green-500 bg-green-50/10"
                  : "border-border bg-muted/20"
                  }`}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drag images here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports PNG, JPG, WebP
                </p>
                <Button
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  className="gap-2 bg-green-500 hover:bg-green-600"
                >
                  <Upload className="w-4 h-4" />
                  Select Images
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
            <p className="text-sm font-semibold">YouTube Video Link</p>
            <p className="text-xs text-muted-foreground">
              Add a YouTube video URL for your product
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
                    const filteredMedia = media.filter(m => m.media_type !== "video");
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
                    setMedia(media.filter(m => m.media_type !== "video"));
                  }
                }}
                className="bg-muted/50 border-input"
              />
              {videos.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    ✓ YouTube link added
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setMedia(media.filter(m => m.media_type !== "video"))}
                    variant="ghost"
                    className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-3 h-3" />
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
