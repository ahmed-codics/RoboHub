import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import logoImage from "@/assets/logo.png";

const Partners = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoImage} alt="RemoteRobotics Logo" className="h-10 w-10" />
            <span className="text-xl font-bold text-foreground">RemoteRobotics</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Partners
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            We collaborate with leading organizations in the robotics industry
          </p>

          <div className="grid gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Robotics Corner</CardTitle>
                <CardDescription>
                  Your hub for robotics innovation and technology
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">
                  Robotics Corner is a leading platform dedicated to advancing robotics technology 
                  and connecting robotics enthusiasts worldwide.
                </p>
                <a 
                  href="https://roboticscorner.tech/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button className="w-full sm:w-auto">
                    Visit Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Partners;
