import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, PhoneCall } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitConsultationRequest } from "@/lib/consultationRequests";

const ConsultationRequestPage = () => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await submitConsultationRequest({
        full_name: fullName,
        email,
        phone_number: phoneNumber,
        message,
      });

      toast({
        title: "Request received",
        description: "Thanks! We will contact you shortly.",
      });
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setMessage("");
    } catch (error: unknown) {
      const messageText = error instanceof Error ? error.message : "Please try again.";
      toast({
        title: "Submission failed",
        description: messageText,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            to="/landscaping-services"
            className="inline-flex items-center text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Landscaping Services
          </Link>

          <section className="rounded-xl border bg-card p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <PhoneCall className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">Request Consultation</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Essential Details</Label>
                <Textarea
                  id="message"
                  rows={4}
                  placeholder="Tell us about your space, preferences, and timeline."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConsultationRequestPage;
