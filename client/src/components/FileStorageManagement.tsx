import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Folder, File, Upload, Trash2, Download, Link, RefreshCw, ArrowLeft, HardDrive } from "lucide-react";

interface StorageFile {
  name: string;
  path: string;
  length: number;
  lastChanged: string;
  isDirectory: boolean;
}

export default function FileStorageManagement() {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState("/");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [remotePath, setRemotePath] = useState("");
  
  function getApiPath(filePath: string): string {
    return filePath.split("/").map(segment => encodeURIComponent(segment)).join("/");
  }
  
  function getDirectoryParam(path: string): string {
    if (path === "/" || path === "") return "/";
    return path.endsWith("/") ? path : path + "/";
  }
  const [deleteFile, setDeleteFile] = useState<StorageFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: storageStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/storage/status"],
  });

  const { data: files = [], isLoading, refetch } = useQuery<StorageFile[]>({
    queryKey: ["/api/storage/files", currentPath],
    queryFn: async () => {
      const dir = getDirectoryParam(currentPath);
      const res = await fetch(`/api/storage/files?directory=${encodeURIComponent(dir)}`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
    enabled: storageStatus?.configured === true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (path: string) => {
      const res = await apiRequest(`/api/storage/files/${getApiPath(path)}`, "DELETE");
      if (!res.ok) throw new Error("Failed to delete file");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "File deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/storage/files", currentPath] });
      setDeleteFile(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete file", variant: "destructive" });
    },
  });

  async function handleUpload() {
    if (!selectedFile || !remotePath) {
      toast({ title: "Error", description: "Please select a file and enter a path", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("path", remotePath.startsWith("/") ? remotePath : `/${remotePath}`);

      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      toast({ title: "Success", description: "File uploaded successfully" });
      setUploadOpen(false);
      setSelectedFile(null);
      setRemotePath("");
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  function navigateToFolder(folderName: string) {
    const newPath = currentPath === "/" ? `/${folderName}/` : `${currentPath}${folderName}/`;
    setCurrentPath(newPath);
  }

  function navigateUp() {
    if (currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? "/" : `/${parts.join("/")}/`);
  }

  async function copyDownloadUrl(file: StorageFile) {
    try {
      const res = await fetch(`/api/storage/cdn-url/${getApiPath(file.path)}`);
      const data = await res.json();
      if (data.cdnUrl) {
        await navigator.clipboard.writeText(data.cdnUrl);
        toast({ title: "Copied", description: "CDN URL copied to clipboard" });
      } else {
        toast({ title: "Info", description: "No CDN URL configured", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to get CDN URL", variant: "destructive" });
    }
  }

  if (!storageStatus?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            File Storage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <HardDrive className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Bunny Storage is not configured. Please add the required environment variables to enable file storage.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            File Storage
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              data-testid="button-refresh-files"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Dialog open={uploadOpen} onOpenChange={(open) => {
              setUploadOpen(open);
              if (open) {
                const defaultPath = currentPath === "/" ? "/" : currentPath;
                setRemotePath(defaultPath);
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-upload-file">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">File</label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      data-testid="input-file-upload"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Remote Path</label>
                    <Input
                      placeholder="/images/logo.png"
                      value={remotePath}
                      onChange={(e) => setRemotePath(e.target.value)}
                      data-testid="input-remote-path"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      The path where the file will be stored (e.g., /images/logo.png)
                    </p>
                  </div>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !selectedFile || !remotePath}
                    className="w-full"
                    data-testid="button-confirm-upload"
                  >
                    {uploading ? "Uploading..." : "Upload File"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={navigateUp}
            disabled={currentPath === "/"}
            data-testid="button-navigate-up"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Badge variant="secondary" className="font-mono" data-testid="text-current-path">
            {currentPath}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>This folder is empty</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.path} data-testid={`row-file-${file.name}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {file.isDirectory ? (
                        <button
                          onClick={() => navigateToFolder(file.name)}
                          className="flex items-center gap-2 hover:underline text-left"
                          data-testid={`button-folder-${file.name}`}
                        >
                          <Folder className="w-4 h-4 text-yellow-500" />
                          {file.name}
                        </button>
                      ) : (
                        <span className="flex items-center gap-2">
                          <File className="w-4 h-4 text-blue-500" />
                          {file.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {file.isDirectory ? "-" : formatFileSize(file.length)}
                  </TableCell>
                  <TableCell>
                    {new Date(file.lastChanged).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {!file.isDirectory && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyDownloadUrl(file)}
                          title="Copy CDN URL"
                          data-testid={`button-copy-url-${file.name}`}
                        >
                          <Link className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          title="Download"
                          data-testid={`button-download-${file.name}`}
                        >
                          <a href={`/api/storage/download/${getApiPath(file.path)}`} download>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteFile(file)}
                          title="Delete"
                          data-testid={`button-delete-${file.name}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AlertDialog open={!!deleteFile} onOpenChange={() => setDeleteFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFile?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFile && deleteMutation.mutate(deleteFile.path)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
