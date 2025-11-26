import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Send, Trash2 } from "lucide-react";

interface Message {
  id: string;
  message: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
  userId: string;
}

export default function LiveChat({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading, refetch } = useQuery<Message[]>({
    queryKey: [`/api/live-chat/${videoId}`],
    refetchInterval: 2000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/live-chat/${videoId}`, { message: msg }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: [`/api/live-chat/${videoId}`] });
      toast({ description: "Message sent!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        description: error.message || "Failed to send message",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      apiRequest("DELETE", `/api/live-chat/${messageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/live-chat/${videoId}`] });
      toast({ description: "Message deleted" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        description: "Message cannot be empty",
      });
      return;
    }
    sendMutation.mutate(message);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold" data-testid="text-live-chat-title">
          Live Chat
        </h3>
        <p className="text-xs text-muted-foreground">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-sm text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-2 group"
              data-testid={`message-${msg.id}`}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={msg.user.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {msg.user.firstName.charAt(0)}
                  {msg.user.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold truncate">
                    {msg.user.username || `${msg.user.firstName} ${msg.user.lastName}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">
                  {msg.message}
                </p>
              </div>
              {user?.id === msg.userId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={() => deleteMutation.mutate(msg.id)}
                  data-testid={`button-delete-message-${msg.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {user ? (
        <div className="p-4 border-t space-y-2">
          <Textarea
            placeholder="Type a message... (max 1000 characters)"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="resize-none"
            disabled={sendMutation.isPending}
            data-testid="input-chat-message"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {message.length}/1000
            </span>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sendMutation.isPending || !message.trim()}
              data-testid="button-send-message"
              className="gap-2"
            >
              <Send className="w-3 h-3" />
              Send
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Log in to join the chat
          </p>
        </div>
      )}
    </Card>
  );
}
