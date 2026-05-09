import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import banner1 from "@/assets/hero-banner-1.webp";
import banner2 from "@/assets/hero-banner-2.webp";
import banner3 from "@/assets/hero-banner-3.webp";
import banner4 from "@/assets/hero-banner-4.webp";

type Slide = {
  image: string;
  alt: string;
  tag: string;
  heading: string;
  subtext: string;
  buttonText: string;
  href: string;
  useOverlay: boolean;
  tagColor: string;
  headingColor: string;
  subtextColor: string;
};

const slides: Slide[] = [
  {
    image: banner1,
    alt: "Plants and fertilizers in a nursery showroom",
    tag: "",
    heading: "Bring Nature to Your Home",
    subtext: "Premium plants & organic fertilizers, handpicked for Pakistani homes",
    buttonText: "Shop Plants →",
    href: "/products",
    useOverlay: true,
    tagColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    subtextColor: "#FFFFFF",
  },
  {
    image: banner2,
    alt: "Aerial view of landscaped garden",
    tag: "Transform Your Space",
    heading: "Expert Landscaping Services",
    subtext: "We design & build dream gardens across Pakistan",
    buttonText: "Book Now →",
    href: "/landscaping-services",
    useOverlay: true,
    tagColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    subtextColor: "#FFFFFF",
  },
  {
    image: banner3,
    alt: "Flower workshop tools and plants on table",
    tag: "Hands-On Learning",
    heading: "Join Our Flower Workshop",
    subtext: "Learn floral arrangement & care — book your slot today",
    buttonText: "Book Your Slot →",
    href: "/flower-workshop",
    useOverlay: true,
    tagColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    subtextColor: "#FFFFFF",
  },
  {
    image: banner4,
    alt: "Houseplants on a bright windowsill",
    tag: "Expert Plant Care Tips",
    heading: "Keep Your Plants Thriving",
    subtext: "Expert guides for every plant in your home",
    buttonText: "Plant Care Guide →",
    href: "/guide",
    useOverlay: false,
    tagColor: "#FFFFFF",
    headingColor: "#FFFFFF",
    subtextColor: "#FFFFFF",
  },
];

const Hero = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap());
    };

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api) {
      return;
    }

    const timer = window.setInterval(() => {
      const lastIndex = api.scrollSnapList().length - 1;
      const currentIndex = api.selectedScrollSnap();

      if (currentIndex >= lastIndex) {
        api.scrollTo(0);
        return;
      }

      api.scrollNext();
    }, 8000);

    return () => window.clearInterval(timer);
  }, [api]);

  return (
    <section className="relative overflow-hidden">
      <Carousel setApi={setApi} opts={{ loop: true }} className="w-full max-w-full">
        <CarouselContent className="ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.heading} className="pl-0">
              <div className="relative h-[500px] w-full max-w-full min-w-0 overflow-hidden md:h-[620px]">
                <img
                  src={slide.image}
                  alt={slide.alt}
                  className="h-full w-full max-w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {slide.useOverlay ? (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none" />
                ) : null}

                {/* One column: same desktop-style stack on all breakpoints; gap-3 removes tablet “percent gap” blowout */}
                <div className="pointer-events-none absolute inset-0">
                  <div
                    className={cn(
                      "pointer-events-none absolute left-[8%] z-10 flex w-[min(560px,calc(100%-16vw))] max-w-[85vw] flex-col gap-3",
                      // Anchor block from bottom so copy sits above carousel controls; grows upward with tight internal gaps
                      "bottom-[5.25rem] md:bottom-[5.75rem] lg:bottom-[6.25rem]",
                    )}
                  >
                    {slide.tag ? (
                      <span
                        className="text-sm font-normal tracking-wide drop-shadow-sm md:text-[0.9375rem]"
                        style={{ color: slide.tagColor }}
                      >
                        {slide.tag}
                      </span>
                    ) : null}

                    <h1
                      className="font-bold leading-tight drop-shadow-sm text-3xl md:text-4xl md:leading-[1.12] lg:text-[52px] lg:leading-[1.1]"
                      style={{ color: slide.headingColor }}
                    >
                      {slide.heading}
                    </h1>

                    <p
                      className="text-base font-normal leading-relaxed drop-shadow-sm md:text-[1.0625rem] lg:text-lg"
                      style={{ color: slide.subtextColor }}
                    >
                      {slide.subtext}
                    </p>

                    <div className="pointer-events-auto w-fit pt-0.5">
                      <Button
                        asChild
                        className="h-11 rounded-[8px] bg-[#2D6A4F] px-6 text-[15px] font-medium text-white hover:bg-[#24563f]"
                      >
                        <Link to={slide.href}>{slide.buttonText}</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex max-w-full items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => api?.scrollPrev()}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
          {slides.map((slide, index) => (
            <button
              key={slide.heading}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                selectedIndex === index ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white/90"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          aria-label="Next slide"
          onClick={() => api?.scrollNext()}
          className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-black/40 text-white backdrop-blur hover:bg-black/60"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
