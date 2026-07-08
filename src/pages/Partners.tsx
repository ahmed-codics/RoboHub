import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const Partners = () => {
  return (
    <AppShell>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Our Partners
          </h1>
          <p className="text-lg text-slate-600">
            We collaborate with leading organizations in the robotics industry to bring you the best talent and opportunities.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900">Robotics Corner</CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Your hub for robotics innovation and technology
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Robotics Corner is a leading platform dedicated to advancing robotics technology 
                and connecting robotics enthusiasts worldwide. We partner with them to bring you 
                cutting-edge resources and community support.
              </p>
              <a 
                href="https://roboticscorner.tech/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button className="w-full sm:w-auto bg-slate-900 text-white hover:bg-slate-800 shadow-sm">
                  Visit Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
};

export default Partners;
