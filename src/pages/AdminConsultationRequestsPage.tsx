import { useCallback, useEffect, useState } from "react";
import { PhoneCall, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  deleteConsultationRequest,
  getAdminConsultationRequests,
  updateConsultationStatus,
  type ConsultationRequestRow,
  type ConsultationStatus,
} from "@/lib/consultationRequests";

const AdminConsultationRequestsPage = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ConsultationRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminConsultationRequests();
      setRequests(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Failed to load requests",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusChange = async (id: string, status: ConsultationStatus) => {
    try {
      const updated = await updateConsultationStatus(id, status);
      setRequests((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast({ title: "Status updated", description: "Request updated successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (request: ConsultationRequestRow) => {
    const confirmed = window.confirm(`Delete request from "${request.full_name}"?`);
    if (!confirmed) return;
    try {
      await deleteConsultationRequest(request.id);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
      toast({ title: "Request deleted", description: "Entry removed successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Consultation Requests" icon={PhoneCall} desktopMenuMode="hamburger">
      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : requests.length === 0 ? (
            <p className="text-muted-foreground">No consultation requests yet.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <article key={request.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-semibold">{request.full_name}</p>
                      <p className="text-sm text-muted-foreground">{request.email}</p>
                      <p className="text-sm text-muted-foreground">{request.phone_number}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{request.status}</Badge>
                  </div>

                  {request.message ? (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{request.message}</p>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Select
                      value={request.status as ConsultationStatus}
                      onValueChange={(value) => handleStatusChange(request.id, value as ConsultationStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">new</SelectItem>
                        <SelectItem value="contacted">contacted</SelectItem>
                        <SelectItem value="closed">closed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="destructive" onClick={() => handleDelete(request)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminConsultationRequestsPage;
