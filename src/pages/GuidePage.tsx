import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Droplets, Sun, Thermometer, Leaf } from "lucide-react";

const GuidePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Plant Care Guide
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl">
              Essential tips for keeping your plants healthy and thriving in Pakistani homes.
            </p>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sun className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Light</h2>
                  <p className="text-muted-foreground">
                    Most indoor plants prefer bright, indirect light. Avoid direct afternoon sun which can scorch leaves.
                    Low-light plants like Snake Plant and Pothos can thrive in shaded corners.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Droplets className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Watering</h2>
                  <p className="text-muted-foreground">
                    Water when the top inch of soil feels dry. Overwatering is the most common cause of plant death.
                    Use room-temperature water and ensure pots have drainage holes.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Thermometer className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Temperature & Humidity</h2>
                  <p className="text-muted-foreground">
                    Most houseplants prefer 18-24°C. Pakistan's climate is generally suitable for tropical plants.
                    Increase humidity for delicate plants by misting or using a pebble tray.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Leaf className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Soil & Fertilizer</h2>
                  <p className="text-muted-foreground">
                    Use well-draining potting mix. Fertilize during growing season (spring-summer) every 4-6 weeks.
                    Reduce feeding in winter when growth slows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GuidePage;
