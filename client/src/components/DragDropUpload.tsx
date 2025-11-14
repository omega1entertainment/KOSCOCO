import { useState, useRef } from "react";
import { Upload, FileVideo, Image as ImageIcon, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DragDropUploadProps {
  accept: string;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  currentFile?: File | null;
  onClear?: () => void;
  label?: string;
  description?: string;
  type?: "video" | "image";
  maxSizeMB?: number;
}

export function DragDropUpload({
  accept,
  onFileSelect,
  disabled = false,
  currentFile,
  onClear,
  label = "Upload File",
  description = "Drag and drop your file here or click to browse",
  type = "video",
  maxSizeMB = 512,
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200 cursor-pointer",
          isDragging && "border-primary bg-primary/5 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          !currentFile && "hover-elevate"
        )}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid={`drag-drop-upload-${type}`}
      >
        <div className="p-8">
          {!currentFile ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div
                className={cn(
                  "rounded-full p-4 transition-colors",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}
              >
                {type === "video" ? (
                  <FileVideo
                    className={cn(
                      "w-12 h-12 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                ) : (
                  <ImageIcon
                    className={cn(
                      "w-12 h-12 transition-colors",
                      isDragging ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{label}</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  {description}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="w-3 h-3" />
                <span>Max {maxSizeMB}MB</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {type === "video" ? (
                  <FileVideo className="w-8 h-8 text-primary flex-shrink-0" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-primary flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" data-testid={`file-name-${type}`}>
                    {currentFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(currentFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {onClear && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  disabled={disabled}
                  data-testid={`button-clear-${type}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          data-testid={`input-file-${type}`}
        />
      </Card>
    </div>
  );
}
