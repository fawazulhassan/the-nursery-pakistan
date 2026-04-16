import { useEffect, useState } from "react";
import { Mail, Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteSubscriber, getAdminSubscribers, type NewsletterSubscriberRow } from "@/lib/newsletter";

const AdminSubscribersPage = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriberRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingSubscriberId, setDeletingSubscriberId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscribers = async () => {
      setIsLoading(true);
      try {
        const rows = await getAdminSubscribers();
        setSubscribers(rows);
      } catch (error) {
        toast({
          title: "Failed to load subscribers",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSubscribers();
  }, [toast]);

  const filteredSubscribers = subscribers.filter((subscriber) =>
    subscriber.email.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleDeleteSubscriber = async (subscriber: NewsletterSubscriberRow) => {
    const confirmed = window.confirm(`Delete subscriber ${subscriber.email} permanently?`);
    if (!confirmed) return;

    setDeletingSubscriberId(subscriber.id);
    try {
      await deleteSubscriber(subscriber.id);
      setSubscribers((prev) => prev.filter((row) => row.id !== subscriber.id));
      toast({ title: "Subscriber deleted", description: "Subscriber removed successfully." });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingSubscriberId(null);
    }
  };

  return (
    <AdminLayout title="Subscribers" icon={Mail} desktopMenuMode="hamburger">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Subscribers ({filteredSubscribers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No subscribers found.</div>
          ) : (
            <div className="space-y-3">
              {filteredSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  className="rounded-md border px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium break-all">{subscriber.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(subscriber.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSubscriber(subscriber)}
                    disabled={deletingSubscriberId === subscriber.id}
                  >
                    {deletingSubscriberId === subscriber.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminSubscribersPage;
