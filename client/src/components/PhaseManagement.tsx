import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Play, CheckCircle, Clock, Calendar, Edit, X, Check } from "lucide-react";
import type { Phase } from "@shared/schema";

export default function PhaseManagement() {
  const { toast } = useToast();
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");

  const { data: phases = [], isLoading } = useQuery<Phase[]>({
    queryKey: ["/api/phases"],
  });

  const activatePhaseMutation = useMutation({
    mutationFn: async (phaseId: string) => {
      return await apiRequest(`/api/admin/phases/${phaseId}/activate`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Phase Activated",
        description: "The phase has been successfully activated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phases/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const completePhaseMutation = useMutation({
    mutationFn: async (phaseId: string) => {
      return await apiRequest(`/api/admin/phases/${phaseId}/complete`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Phase Completed",
        description: "The phase has been marked as completed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/phases/active"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Completion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePhaseDatesMutation = useMutation({
    mutationFn: async (data: { phaseId: string; startDate?: string; endDate?: string }) => {
      return await apiRequest(`/api/admin/phases/${data.phaseId}`, "PUT", {
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      toast({
        title: "Dates Updated",
        description: "Phase dates have been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/phases"] });
      setEditingPhaseId(null);
      setEditStartDate("");
      setEditEndDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700" data-testid={`badge-active`}>Active</Badge>;
      case 'completed':
        return <Badge variant="secondary" data-testid={`badge-completed`}>Completed</Badge>;
      case 'upcoming':
      default:
        return <Badge variant="outline" data-testid={`badge-upcoming`}>Upcoming</Badge>;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toDateTimeInputString = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const handleEditDates = (phase: Phase) => {
    setEditingPhaseId(phase.id);
    setEditStartDate(toDateTimeInputString(phase.startDate));
    setEditEndDate(toDateTimeInputString(phase.endDate));
  };

  const handleSaveDates = (phaseId: string) => {
    updatePhaseDatesMutation.mutate({
      phaseId,
      startDate: editStartDate,
      endDate: editEndDate,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phase Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading phases...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Phase Management</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage the competition phases and progression
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {phases.map((phase) => (
            <Card key={phase.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" data-testid={`text-phase-${phase.number}`}>
                        Phase {phase.number}: {phase.name}
                      </h3>
                      {getStatusBadge(phase.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {phase.description}
                    </p>
                    {editingPhaseId === phase.id ? (
                      <div className="space-y-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`start-date-${phase.id}`} className="text-xs">Start Date</Label>
                            <Input
                              id={`start-date-${phase.id}`}
                              type="datetime-local"
                              value={editStartDate}
                              onChange={(e) => setEditStartDate(e.target.value)}
                              data-testid={`input-phase-start-${phase.id}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`end-date-${phase.id}`} className="text-xs">End Date</Label>
                            <Input
                              id={`end-date-${phase.id}`}
                              type="datetime-local"
                              value={editEndDate}
                              onChange={(e) => setEditEndDate(e.target.value)}
                              data-testid={`input-phase-end-${phase.id}`}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSaveDates(phase.id)}
                            disabled={updatePhaseDatesMutation.isPending}
                            data-testid={`button-save-dates-${phase.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPhaseId(null)}
                            disabled={updatePhaseDatesMutation.isPending}
                            data-testid={`button-cancel-edit-${phase.id}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>Start: {formatDate(phase.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>End: {formatDate(phase.endDate)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {editingPhaseId !== phase.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDates(phase)}
                        disabled={editingPhaseId !== null}
                        data-testid={`button-edit-dates-${phase.id}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Dates
                      </Button>
                    )}
                    {phase.status === 'upcoming' && (
                      <Button
                        size="sm"
                        onClick={() => activatePhaseMutation.mutate(phase.id)}
                        disabled={activatePhaseMutation.isPending || editingPhaseId !== null}
                        data-testid={`button-activate-phase-${phase.number}`}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate
                      </Button>
                    )}
                    {phase.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => completePhaseMutation.mutate(phase.id)}
                        disabled={completePhaseMutation.isPending}
                        data-testid={`button-complete-phase-${phase.number}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete
                      </Button>
                    )}
                    {phase.status === 'completed' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Finished</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
