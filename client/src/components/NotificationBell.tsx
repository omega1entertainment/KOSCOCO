import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationBell() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: unreadCount = 0 } = useQuery<{ unreadCount: number }>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    enabled: !!user && isOpen,
  });

  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}/read`, 'POST');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiRequest(`/api/notifications/${notificationId}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/api/notifications/read-all', 'POST');
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="button-notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-notifications"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-muted/30' : ''
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          data-testid={`button-delete-${notification.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-border text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                data-testid="button-mark-all-read"
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
