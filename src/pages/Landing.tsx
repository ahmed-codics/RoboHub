import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cpu, Zap, Shield, Users } from "lucide-react";
import logoImage from "@/assets/logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="RemoteRobotics Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-foreground">RemoteRobotics</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/partners">
              <Button variant="ghost">Partners</Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Connect with Expert
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {" "}Robotics Engineers
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The premier marketplace for remote robotics work. Find specialized freelancers or hire
            top talent for your ROS, SLAM, embedded systems, and automation projects.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg">
                Start as Freelancer
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline">
                Hire Talent
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-20">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">500+</div>
            <div className="text-muted-foreground mt-2">Expert Engineers</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">200+</div>
            <div className="text-muted-foreground mt-2">Projects Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-primary">95%</div>
            <div className="text-muted-foreground mt-2">Success Rate</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          Why Choose RemoteRobotics?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Cpu className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Specialized Skills</h3>
            <p className="text-muted-foreground">
              Access experts in ROS, SLAM, computer vision, control systems, and embedded robotics.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Zap className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Fast Matching</h3>
            <p className="text-muted-foreground">
              Post jobs and receive qualified bids within hours from vetted professionals.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Shield className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Secure Payments</h3>
            <p className="text-muted-foreground">
              Escrow protection for all projects ensures safe and reliable transactions.
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-card-foreground">Premium Plans</h3>
            <p className="text-muted-foreground">
              Upgrade to unlimited bids and priority placement for just $10/month.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of robotics professionals and clients today.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 RemoteRobotics. The premier platform for remote robotics work.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
