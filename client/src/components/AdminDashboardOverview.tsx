import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Video, Eye, AlertTriangle, Mail } from "lucide-react";

export function AdminDashboardOverview() {
  const { data: stats = {} } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers || 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Total Videos",
      value: stats.totalVideos || 0,
      icon: Video,
      color: "text-green-500",
    },
    {
      title: "Total Views",
      value: (stats.totalViews || 0).toLocaleString(),
      icon: Eye,
      color: "text-purple-500",
    },
    {
      title: "Suspended Users",
      value: stats.suspendedUsers || 0,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      title: "Unverified Emails",
      value: stats.unverifiedEmails || 0,
      icon: Mail,
      color: "text-yellow-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} data-testid={`card-stat-${stat.title.toLowerCase()}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
