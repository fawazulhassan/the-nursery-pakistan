import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  deleteBooking,
  getAdminBookings,
  getAdminWorkshopSlots,
  updateBookingStatus,
  type WorkshopBookingRow,
  type WorkshopBookingStatus,
  type WorkshopSlotRow,
} from "@/lib/workshopBookings";
import { getAdminWorkshops, type WorkshopRow } from "@/lib/workshops";

const statusOptions: WorkshopBookingStatus[] = ["new", "confirmed", "completed", "cancelled"];

const AdminWorkshopBookingsPage = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<WorkshopBookingRow[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [slots, setSlots] = useState<WorkshopSlotRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [workshopFilter, setWorkshopFilter] = useState("all");
  const [slotFilter, setSlotFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const workshopNameById = useMemo(
    () => new Map(workshops.map((item) => [item.id, item.title])),
    [workshops]
  );
  const slotNameById = useMemo(
    () => new Map(slots.map((item) => [item.id, item.slot_label])),
    [slots]
  );

  const visibleSlots = useMemo(() => {
    if (workshopFilter === "all") return slots;
    return slots.filter((slot) => slot.workshop_id === workshopFilter);
  }, [slots, workshopFilter]);

  const loadDependencies = useCallback(async () => {
    const [workshopsData, slotsData] = await Promise.all([getAdminWorkshops(), getAdminWorkshopSlots()]);
    setWorkshops(workshopsData);
    setSlots(slotsData);
  }, []);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminBookings({
        workshopId: workshopFilter === "all" ? undefined : workshopFilter,
        slotId: slotFilter === "all" ? undefined : slotFilter,
        status: statusFilter === "all" ? undefined : (statusFilter as WorkshopBookingStatus),
      });
      setBookings(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Failed to load bookings", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [slotFilter, statusFilter, toast, workshopFilter]);

  useEffect(() => {
    const init = async () => {
      try {
        await loadDependencies();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast({ title: "Failed to load workshop data", description: message, variant: "destructive" });
      } finally {
        loadBookings();
      }
    };
    init();
  }, [loadBookings, loadDependencies, toast]);

  useEffect(() => {
    if (slotFilter !== "all" && !visibleSlots.some((slot) => slot.id === slotFilter)) {
      setSlotFilter("all");
      return;
    }
    loadBookings();
  }, [loadBookings, slotFilter, visibleSlots]);

  const handleStatusChange = async (id: string, status: WorkshopBookingStatus) => {
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((item) => (item.id === id ? updated : item)));
      toast({ title: "Status updated", description: "Booking updated successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this booking? This cannot be undone.");
    if (!confirmed) return;

    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((item) => item.id !== id));
      toast({ title: "Booking deleted", description: "Booking removed successfully." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Workshop Bookings" icon={CalendarCheck2} desktopMenuMode="hamburger">
      <Card>
        <CardHeader>
          <CardTitle>Bookings Inbox</CardTitle>
          <div className="grid md:grid-cols-3 gap-3">
            <Select value={workshopFilter} onValueChange={setWorkshopFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by workshop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workshops</SelectItem>
                {workshops.map((workshop) => (
                  <SelectItem key={workshop.id} value={workshop.id}>
                    {workshop.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All slots</SelectItem>
                {visibleSlots.map((slot) => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.slot_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={statusFilter} onValueChange={setStatusFilter}>
              <TabsList className="w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings found for selected filters.</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <article key={booking.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-semibold">{booking.full_name}</p>
                      <p className="text-sm text-muted-foreground">{booking.email}</p>
                      <p className="text-sm text-muted-foreground">{booking.phone_number}</p>
                      <p className="text-sm text-muted-foreground">
                        Workshop: {workshopNameById.get(booking.workshop_id) ?? "Unknown"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Slot: {slotNameById.get(booking.slot_id) ?? "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary">{booking.status}</Badge>
                  </div>

                  {booking.notes ? (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                    <Select
                      value={booking.status}
                      onValueChange={(value) => handleStatusChange(booking.id, value as WorkshopBookingStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Set status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(booking.id)}
                    >
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

export default AdminWorkshopBookingsPage;
