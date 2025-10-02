import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import Collections from "@/components/Collections";
import Testimonials from "@/components/Testimonials";
import BlogPreview from "@/components/BlogPreview";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <FeaturedProducts />
        <Collections />
        <Testimonials />
        <BlogPreview />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
