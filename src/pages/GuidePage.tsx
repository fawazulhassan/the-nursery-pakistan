import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import productSnakePlantImage from "@/assets/snake-plant.webp";
import peaceLilyImage from "@/assets/Peace-Lily.webp";
import aloeVeraImage from "@/assets/Aloe-Vera.webp";
import productPothosImage from "@/assets/money-plant.webp";
import {
  ArrowLeft,
  Sun,
  Droplets,
  Sprout,
  Scissors,
  Calendar,
  Leaf,
  Bug,
  CloudRain,
  Flower2,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type GuideStep = {
  stepNumber: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

type CommonProblem = {
  title: string;
  diagnosis: string;
  fix: string;
  icon: LucideIcon;
};

type PopularPlant = {
  name: string;
  light: string;
  water: string;
  difficulty: string;
  imageCandidates: string[];
};

const plantCareTopics = [
  {
    title: "Best Indoor Plants for Pakistan",
    description: "Choose beginner-friendly indoor plants suited to Pakistani homes and weather.",
    to: "/blog/best-indoor-plants-pakistan-2026",
  },
  {
    title: "Plant Care in Pakistani Summer",
    description: "Protect indoor and outdoor plants from intense heat, dry soil, and leaf stress.",
    to: "/blog/care-for-plants-pakistani-summer-2026",
  },
  {
    title: "Why Your Plants Are Dying",
    description: "Check watering, drainage, light, pests, and other common causes in a clear order.",
    to: "/blog/pakistan-plant-crisis-why-plants-dying-2026",
  },
  {
    title: "Best Fertilizers for Home Gardens",
    description: "Understand bone meal and other fertilizer choices for healthier roots and blooms.",
    to: "/blog/best-fertilizers-home-garden-pakistan-bone-meal",
  },
  {
    title: "Grow a Kitchen Herb Garden",
    description: "Start a useful herb garden at home with practical growing advice for Pakistan.",
    to: "/blog/grow-kitchen-herb-garden-home-pakistan",
  },
] as const;

const plantCareFaqs = [
  {
    question: "How often should indoor plants be watered in Pakistan?",
    answer:
      "Check the soil instead of following a fixed calendar. Water when the top layer feels dry, and reduce watering during cooler months or when the soil stays wet longer.",
  },
  {
    question: "How can I protect plants during Pakistan's summer?",
    answer:
      "Keep sensitive plants away from harsh afternoon sun, water deeply when the soil needs it, improve airflow, and use mulch for outdoor pots to slow moisture loss.",
  },
  {
    question: "Why do plant leaves turn yellow?",
    answer:
      "Common causes include overwatering, poor drainage, low light, root stress, and nutrient problems. Check soil moisture and drainage before adding fertilizer.",
  },
  {
    question: "Which indoor plants are easiest for beginners?",
    answer:
      "Snake plant, money plant, aloe vera, and several pothos varieties are popular beginner choices when they receive suitable light and are not overwatered.",
  },
] as const;

const resolveGuideImageUrls = (imageCandidates?: string[] | null): string[] => {
  if (!Array.isArray(imageCandidates)) return [];
  return imageCandidates.filter((url): url is string => typeof url === "string" && url.trim().length > 0);
};

const resolvePrimaryGuideImage = (imageCandidates?: string[] | null): string => {
  const urls = resolveGuideImageUrls(imageCandidates);
  return urls[0] ?? "";
};

const howToUseSteps: GuideStep[] = [
  {
    stepNumber: 1,
    title: "Choose Plant",
    description: "Bone meal works best for Flowering plants, Fruit plants, Vegetables, Roses, Outdoor garden plants.",
    icon: Sun,
  },
  {
    stepNumber: 2,
    title: "Check Soil",
    description: "Bone meal works best in slightly acidic or neutral soil. If the soil is very alkaline, the plant may not absorb it properly.",
    icon: Sprout,
  },
  {
    stepNumber: 3,
    title: "Use",
    description: "Small pots: 1–2 tablespoons, Medium pots: 2–3 tablespoons, Large pots or garden plants: 1/4 to 1/2 cup, Do not overuse because too much fertilizer can harm the plant.",
    icon: Droplets,
  },
  {
    stepNumber: 4,
    title: "Mix",
    description: "Sprinkle the bone meal around the plant and mix it into the top 2–3 inches of soil. Do not leave it only on the surface.",
    icon: Scissors,
  },
  {
    stepNumber: 5,
    title: "Water",
    description: "After adding bone meal, water the soil well. Water helps the fertilizer move into the roots.",
    icon: Leaf,
  },
  {
    stepNumber: 6,
    title: "Repeat",
    description: "Repeat every 4-6 weeks in growing season for blooms.",
    icon: Calendar,
  },
];

const commonProblems: CommonProblem[] = [
  {
    title: "Yellow Leaves",
    diagnosis: "Often due to overwatering or nutrient deficiency.",
    fix: "Check drainage and balance fertilizer.",
    icon: AlertCircle,
  },
  {
    title: "Brown Tips",
    diagnosis: "Usually from underwatering or very dry air.",
    fix: "Increase watering frequency and mist plant.",
    icon: Leaf,
  },
  {
    title: "Pests",
    diagnosis: "Mealybugs, spider mites, and aphids attack weak plants.",
    fix: "Inspect regularly and spray neem oil weekly.",
    icon: Bug,
  },
  {
    title: "Monsoon Root Rot",
    diagnosis: "Prolonged standing water suffocates roots.",
    fix: "Improve drainage and keep potting mix airy.",
    icon: CloudRain,
  },
];

const popularPlants: PopularPlant[] = [
  {
    name: "Snake Plant",
    light: "Low-Bright indirect",
    water: "Every 2-3 weeks",
    difficulty: "Easy",
    imageCandidates: [productSnakePlantImage, "/images/plants/snake-plant.jpg", "/images/snake-plant.jpg"],
  },
  {
    name: "Peace Lily",
    light: "Medium indirect",
    water: "Weekly (when soil is dry)",
    difficulty: "Medium",
    imageCandidates: [peaceLilyImage, "/images/plants/peace-lily.jpg", "/images/peace-lily.jpg"],
  },
  {
    name: "Aloe Vera",
    light: "Bright indirect",
    water: "Deeply every 3 weeks",
    difficulty: "Easy",
    imageCandidates: [aloeVeraImage, "/images/plants/aloe-vera.jpg", "/images/aloe-vera.jpg"],
  },
  {
    name: "Money Plant",
    light: "Low-Bright indirect",
    water: "Weekly",
    difficulty: "Easy",
    imageCandidates: [productPothosImage, "/images/plants/money-plant.jpg", "/images/money-plant.jpg"],
  },
];

const GuidePage = () => {
  const [failedPlantImages, setFailedPlantImages] = useState<Record<string, boolean>>({});

  const markImageFailed = (plantName: string, attemptedUrl: string) => {
    setFailedPlantImages((prev) => {
      if (prev[plantName]) return prev;
      console.warn(`[GuidePage] Failed to load plant image for "${plantName}": ${attemptedUrl}`);
      return { ...prev, [plantName]: true };
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border bg-muted/20">
          <div className="container mx-auto px-4 py-7">
            <Link to="/" className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Plant Care Guide for Pakistan
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground md:text-base">
              Learn how to choose, water, feed, and protect indoor and outdoor plants in
              Pakistan&apos;s changing seasons. Use the topic guides below, then follow our
              practical bone meal instructions and problem-solving checklist.
            </p>
          </div>
        </section>

        <section className="py-8 md:py-10">
          <div className="container mx-auto px-4">
            <div className="space-y-6">
              <section className="rounded-xl border border-border bg-card p-4 md:p-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Explore Plant Care Topics
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  Start with the problem or goal that matches your plants. These guides are
                  written for common Pakistani home and garden conditions.
                </p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {plantCareTopics.map((topic) => (
                    <article key={topic.to} className="rounded-lg border border-border bg-background p-4">
                      <h3 className="font-semibold text-foreground">
                        <Link to={topic.to} className="hover:text-primary">
                          {topic.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {topic.description}
                      </p>
                      <Link to={topic.to} className="mt-3 inline-flex text-sm font-medium text-primary">
                        Read guide →
                      </Link>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-5">
                <h2 className="text-xl font-semibold text-foreground">How to Use Bone Meal Fertilizer</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {howToUseSteps.map((step) => {
                    const Icon = step.icon;
                    return (
                      <article key={step.stepNumber} className="rounded-lg border border-border bg-background p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </span>
                          <p className="text-sm font-semibold text-foreground">
                            {step.stepNumber}. {step.title}
                          </p>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground md:text-sm">{step.description}</p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-5">
                <h3 className="text-xl font-semibold text-foreground">Best Time to Use</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
                  <li>Spring and summer are ideal for active root and bloom growth.</li>
                  <li>Apply during planting or repotting for stronger establishment.</li>
                  <li>Use before flowering season for better bud and flower production.</li>
                </ul>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-5">
                <h3 className="text-xl font-semibold text-foreground">Important Tips</h3>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground md:text-base">
                  <li>Wear gloves while handling fertilizer and wash hands after use.</li>
                  <li>Keep away from pets and children and store in a cool dry place.</li>
                  <li>Do not overapply excess fertilizer can stress plant roots.</li>
                  <li>Mix into soil well and water after application for best effect.</li>
                </ul>
              </section>

              <section className="rounded-xl border border-border bg-primary/10 p-4 md:p-5">
                <p className="text-sm leading-6 text-foreground md:text-base">
                  Tip: For best results, mix bone meal thoroughly into the soil at planting time or apply around the
                  base of established plants before watering.
                </p>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-5">
                <h2 className="text-2xl font-semibold text-foreground">Common Problems &amp; Solutions</h2>
                <div className="mt-4 space-y-3">
                  {commonProblems.map((problem) => {
                    const Icon = problem.icon;
                    return (
                      <article key={problem.title} className="rounded-lg border border-border bg-background p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </span>
                          <h3 className="text-base font-semibold text-foreground">{problem.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Diagnosis:</span> {problem.diagnosis}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Fix:</span> {problem.fix}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-5">
                <h2 className="text-2xl font-semibold text-foreground">Popular Plants &amp; Quick Care Stats</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {popularPlants.map((plant) => {
                    const imageUrl = resolvePrimaryGuideImage(plant.imageCandidates);
                    const isFailed = failedPlantImages[plant.name];
                    const showPlaceholder = !imageUrl || isFailed;

                    return (
                      <article key={plant.name} className="overflow-hidden rounded-lg border border-border bg-background">
                        {showPlaceholder ? (
                          <div className="flex h-[250px] items-center justify-center bg-green-100 px-4 text-center">
                            <p className="text-sm font-medium text-green-900">{plant.name}</p>
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt={plant.name}
                            className="h-[250px] w-full object-cover"
                            loading="lazy"
                            onError={() => markImageFailed(plant.name, imageUrl)}
                          />
                        )}
                        <div className="p-3">
                          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <Flower2 className="h-4 w-4 text-primary" />
                            {plant.name}
                          </h3>
                          <p className="mt-2 text-xs text-muted-foreground">Light: {plant.light}</p>
                          <p className="text-xs text-muted-foreground">Water: {plant.water}</p>
                          <p className="text-xs text-muted-foreground">Difficulty: {plant.difficulty}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-xl border border-border border-l-4 border-l-primary bg-green-50 p-4 md:p-5">
                <h3 className="text-xl font-semibold text-foreground">Expert Tip</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  For plants outdoors in Pakistan&apos;s summer, create a humidity tray with pebbles and water to reduce
                  dry heat stress, or group plants together to form a microclimate.
                </p>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 md:p-6">
                <h2 className="text-2xl font-semibold text-foreground">
                  Plant Care Questions
                </h2>
                <div className="mt-4 space-y-4">
                  {plantCareFaqs.map((faq) => (
                    <article key={faq.question} className="rounded-lg border border-border bg-background p-4">
                      <h3 className="font-semibold text-foreground">{faq.question}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-border bg-card p-4 text-center md:p-6">
                <h3 className="text-2xl font-semibold text-foreground">Need Help Choosing the Right Plant?</h3>
                <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    to="/category/indoor-plants"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    Indoor Plants
                  </Link>
                  <Link
                    to="/category/outdoor-plants"
                    className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Outdoor Plants
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default GuidePage;
