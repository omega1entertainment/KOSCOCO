import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { AlertCircle, Loader2 } from "lucide-react";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
}

interface UserDataCounts {
  videos: number;
  votes: number;
  likes: number;
  watchHistory: number;
  votePurchases: number;
  registrations: number;
  reports: number;
  judges: number;
  affiliates: number;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userId,
  userName,
  isAdmin = false,
  onSuccess,
}: DeleteAccountDialogProps) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: dataCounts } = useQuery<UserDataCounts>({
    queryKey: [`/api/users/${userId}/data-counts`],
    enabled: open && !!userId,
  });

  useEffect(() => {
    if (open && dataCounts) {
      setSelectedItems(new Set(Object.keys(dataCounts).filter(key => dataCounts[key as keyof UserDataCounts] > 0)));
    }
  }, [open, dataCounts]);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isAdmin ? `/api/admin/users/${userId}` : `/api/account/delete`;
      const method = isAdmin ? "DELETE" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedItems: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete account");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Account and selected data have been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleItem = (item: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item)) {
      newSelected.delete(item);
    } else {
      newSelected.add(item);
    }
    setSelectedItems(newSelected);
  };

  const dataItems = [
    { id: "videos", label: "Videos", count: dataCounts?.videos || 0 },
    { id: "votes", label: "Votes Cast", count: dataCounts?.votes || 0 },
    { id: "likes", label: "Likes", count: dataCounts?.likes || 0 },
    { id: "watchHistory", label: "Watch History", count: dataCounts?.watchHistory || 0 },
    { id: "votePurchases", label: "Paid Votes", count: dataCounts?.votePurchases || 0 },
    { id: "registrations", label: "Registrations", count: dataCounts?.registrations || 0 },
    { id: "reports", label: "Reports", count: dataCounts?.reports || 0 },
    { id: "judges", label: "Judge Scores", count: dataCounts?.judges || 0 },
    { id: "affiliates", label: "Affiliate Records", count: dataCounts?.affiliates || 0 },
  ];

  const visibleItems = dataItems.filter(item => item.count > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-delete-account">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            Select the data you want to delete along with the account for{" "}
            <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-md">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            This action cannot be undone. The account will always be deleted.
          </p>
        </div>

        {visibleItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            This account has no associated data to display.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {visibleItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <Checkbox
                  id={item.id}
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => handleToggleItem(item.id)}
                  data-testid={`checkbox-delete-${item.id}`}
                />
                <Label
                  htmlFor={item.id}
                  className="cursor-pointer flex-1 flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {item.count}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
            data-testid="button-cancel-delete-account"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete-account"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Account"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
