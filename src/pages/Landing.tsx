import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import ServiceCategories from "@/components/landing/ServiceCategories";
import FeaturedFreelancers from "@/components/landing/featured/FeaturedFreelancers";
import Footer from "@/components/layout/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <ServiceCategories />
        <FeaturedFreelancers />

        {/* Value Proposition / CTA */}
        <section className="py-24 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Built for the future of robotics</h2>
            <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
              Join the fastest growing community of robotics experts and clients.
              Start building the future today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-background text-foreground px-8 py-3 rounded-full font-bold hover:bg-background/90 transition-colors text-lg shadow-xl">
                Find Talent
              </button>
              <button className="bg-primary-foreground/10 border-2 border-primary-foreground/20 text-primary-foreground px-8 py-3 rounded-full font-bold hover:bg-primary-foreground/20 transition-colors text-lg">
                Find Work
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;
