import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createBooking, getSlotsByWorkshop, type WorkshopSlotWithCount } from "@/lib/workshopBookings";
import { getWorkshopBySlug, type WorkshopRow } from "@/lib/workshops";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const WorkshopPostPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { slug = "" } = useParams<{ slug: string }>();
  const [workshop, setWorkshop] = useState<WorkshopRow | null>(null);
  const [slots, setSlots] = useState<WorkshopSlotWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const workshopData = await getWorkshopBySlug(slug);
        setWorkshop(workshopData);
        const slotData = await getSlotsByWorkshop(workshopData.id);
        setSlots(slotData);
      } catch {
        setWorkshop(null);
        setSlots([]);
        setError("Workshop not found.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!workshop) return;

    const previousTitle = document.title;
    document.title = workshop.title;

    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    const previousDescription = meta.content;
    meta.content = workshop.description.slice(0, 160);

    return () => {
      document.title = previousTitle;
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = previousDescription;
      }
    };
  }, [workshop]);

  const galleryImages = useMemo(
    () => ((workshop?.gallery_image_urls as string[] | null) ?? []).filter((image) => !!image),
    [workshop]
  );

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSlotId) {
      toast({ title: "Select a slot", description: "Choose an available workshop slot first.", variant: "destructive" });
      return;
    }

    const slot = slots.find((item) => item.id === selectedSlotId);
    if (slot?.is_fully_booked) {
      toast({ title: "Slot unavailable", description: "This slot is already fully booked.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      await createBooking({
        slot_id: selectedSlotId,
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        notes,
      });

      toast({ title: "Booking submitted", description: "We received your booking request successfully." });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setNotes("");

      if (workshop) {
        const refreshed = await getSlotsByWorkshop(workshop.id);
        setSlots(refreshed);
      }
    } catch (bookingError: unknown) {
      const message =
        bookingError instanceof Error ? bookingError.message : "Could not create booking. Please try another slot.";
      toast({ title: "Booking failed", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button variant="outline" className="mb-6" onClick={() => navigate("/workshops")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workshops
        </Button>

        {isLoading ? (
          <div className="text-center py-14 text-muted-foreground">Loading workshop...</div>
        ) : error || !workshop ? (
          <div className="text-center py-14 border rounded-lg bg-muted/20">
            <h2 className="text-xl font-semibold mb-2">Workshop unavailable</h2>
            <p className="text-muted-foreground">{error ?? "This workshop could not be loaded."}</p>
          </div>
        ) : (
          <article className="max-w-5xl mx-auto space-y-10">
            <section>
              <p className="text-sm text-muted-foreground mb-2">{formatDate(workshop.workshop_date)}</p>
              <h1 className="text-3xl md:text-4xl font-bold">{workshop.title}</h1>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Slot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active slots available for this workshop yet.</p>
                  ) : (
                    slots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`w-full border rounded-lg p-3 text-left transition ${
                          selectedSlotId === slot.id ? "border-primary bg-primary/5" : "border-border"
                        }`}
                        onClick={() => !slot.is_fully_booked && setSelectedSlotId(slot.id)}
                        disabled={slot.is_fully_booked}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{slot.slot_label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(slot.slot_start_at)} - {formatDateTime(slot.slot_end_at)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Confirmed: {slot.confirmed_booking_count}/{slot.capacity}
                            </p>
                          </div>
                          {slot.is_fully_booked ? (
                            <Badge variant="destructive">Fully Booked</Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Book This Workshop</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleBookingSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    {selectedSlot ? (
                      <p className="text-sm text-muted-foreground">
                        Selected slot: <span className="font-medium text-foreground">{selectedSlot.slot_label}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Select a slot first to continue.</p>
                    )}

                    <Button type="submit" disabled={isSaving || !selectedSlotId || selectedSlot?.is_fully_booked}>
                      {selectedSlot?.is_fully_booked ? "Fully Booked" : isSaving ? "Submitting..." : "Reserve Slot"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </section>

            <section>
              <img src={workshop.cover_image_url} alt={workshop.title} className="w-full rounded-lg mb-8 max-h-[520px] object-cover" />
              <p className="text-muted-foreground">{workshop.description}</p>
            </section>

            {galleryImages.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold mb-4">Previous Workshop Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((imageUrl, index) => (
                    <button
                      key={`${workshop.id}-gallery-${index}`}
                      type="button"
                      className="w-full aspect-square rounded-md border overflow-hidden"
                      onClick={() => setLightboxImage(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`${workshop.title} gallery ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </main>

      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          {lightboxImage ? (
            <img src={lightboxImage} alt="Workshop gallery fullscreen" className="w-full max-h-[80vh] object-contain rounded-md" />
          ) : null}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default WorkshopPostPage;
