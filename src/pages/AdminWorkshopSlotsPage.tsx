import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Edit, Trash2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  createWorkshopSlot,
  deleteWorkshopSlot,
  getAdminWorkshopSlots,
  updateWorkshopSlot,
  type WorkshopSlotRow,
} from "@/lib/workshopBookings";
import { getAdminWorkshops, type WorkshopRow } from "@/lib/workshops";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatLocalDateTime = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIsoDateTime = (localDateTime: string) => new Date(localDateTime).toISOString();

const AdminWorkshopSlotsPage = () => {
  const { toast } = useToast();
  const [workshops, setWorkshops] = useState<WorkshopRow[]>([]);
  const [slots, setSlots] = useState<WorkshopSlotRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [filterWorkshopId, setFilterWorkshopId] = useState("all");
  const [editingSlot, setEditingSlot] = useState<WorkshopSlotRow | null>(null);
  const [workshopId, setWorkshopId] = useState("");
  const [slotLabel, setSlotLabel] = useState("");
  const [slotStartAt, setSlotStartAt] = useState("");
  const [slotEndAt, setSlotEndAt] = useState("");
  const [capacity, setCapacity] = useState("10");
  const [isActive, setIsActive] = useState(true);

  const workshopNameById = useMemo(
    () => new Map(workshops.map((item) => [item.id, item.title])),
    [workshops]
  );

  const loadWorkshops = useCallback(async () => {
    const data = await getAdminWorkshops();
    setWorkshops(data);
    if (!workshopId && data.length > 0) {
      setWorkshopId(data[0].id);
    }
  }, [workshopId]);

  const loadSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminWorkshopSlots(filterWorkshopId === "all" ? undefined : filterWorkshopId);
      setSlots(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Failed to load slots", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filterWorkshopId, toast]);

  useEffect(() => {
    const init = async () => {
      try {
        await loadWorkshops();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Please try again.";
        toast({ title: "Failed to load workshops", description: message, variant: "destructive" });
      } finally {
        loadSlots();
      }
    };
    init();
  }, [loadSlots, loadWorkshops, toast]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const resetForm = () => {
    setEditingSlot(null);
    setSlotLabel("");
    setSlotStartAt("");
    setSlotEndAt("");
    setCapacity("10");
    setIsActive(true);
  };

  const handleEdit = (slot: WorkshopSlotRow) => {
    setEditingSlot(slot);
    setWorkshopId(slot.workshop_id);
    setSlotLabel(slot.slot_label);
    setSlotStartAt(formatLocalDateTime(slot.slot_start_at));
    setSlotEndAt(formatLocalDateTime(slot.slot_end_at));
    setCapacity(String(slot.capacity));
    setIsActive(slot.is_active);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workshopId) {
      toast({ title: "Workshop required", description: "Select a workshop first.", variant: "destructive" });
      return;
    }
    if (!slotStartAt || !slotEndAt) {
      toast({ title: "Time required", description: "Provide slot start and end time.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        workshop_id: workshopId,
        slot_label: slotLabel,
        slot_start_at: toIsoDateTime(slotStartAt),
        slot_end_at: toIsoDateTime(slotEndAt),
        capacity: Number.parseInt(capacity, 10) || 1,
        is_active: isActive,
      };

      if (editingSlot) {
        await updateWorkshopSlot(editingSlot.id, payload);
        toast({ title: "Slot updated", description: "Slot saved successfully." });
      } else {
        await createWorkshopSlot(payload);
        toast({ title: "Slot created", description: "New slot added successfully." });
      }

      resetForm();
      await loadSlots();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Save failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (slot: WorkshopSlotRow) => {
    const confirmed = window.confirm(`Delete slot "${slot.slot_label}"?`);
    if (!confirmed) return;
    try {
      await deleteWorkshopSlot(slot.id);
      toast({ title: "Slot deleted", description: "Slot removed successfully." });
      if (editingSlot?.id === slot.id) {
        resetForm();
      }
      await loadSlots();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Please try again.";
      toast({ title: "Delete failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Workshop Slots" icon={Clock3} desktopMenuMode="hamburger">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingSlot ? "Edit Slot" : "Add Slot"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label>Workshop *</Label>
              <Select value={workshopId} onValueChange={setWorkshopId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select workshop" />
                </SelectTrigger>
                <SelectContent>
                  {workshops.map((workshop) => (
                    <SelectItem key={workshop.id} value={workshop.id}>
                      {workshop.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotLabel">Slot Label *</Label>
                <Input id="slotLabel" value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slotStartAt">Start Time *</Label>
                <Input
                  id="slotStartAt"
                  type="datetime-local"
                  value={slotStartAt}
                  onChange={(e) => setSlotStartAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slotEndAt">End Time *</Label>
                <Input
                  id="slotEndAt"
                  type="datetime-local"
                  value={slotEndAt}
                  onChange={(e) => setSlotEndAt(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="slotIsActive">Slot active</Label>
                <p className="text-xs text-muted-foreground">Only active slots can be booked publicly.</p>
              </div>
              <Switch id="slotIsActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : editingSlot ? "Update Slot" : "Create Slot"}
              </Button>
              {editingSlot ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Existing Slots</CardTitle>
            <Select value={filterWorkshopId} onValueChange={setFilterWorkshopId}>
              <SelectTrigger className="w-[260px]">
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
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : slots.length === 0 ? (
            <p className="text-muted-foreground">No slots yet.</p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div key={slot.id} className="border rounded-lg p-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium">{slot.slot_label}</p>
                    <p className="text-sm text-muted-foreground">
                      {workshopNameById.get(slot.workshop_id) ?? "Unknown workshop"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(slot.slot_start_at)} - {formatDateTime(slot.slot_end_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Capacity: {slot.capacity} • Active: {slot.is_active ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(slot)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(slot)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminWorkshopSlotsPage;
