import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().trim().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(50, "Description must be at least 50 characters").max(5000, "Description must be less than 5000 characters"),
  budget: z.number().positive("Budget must be positive").max(10000000, "Budget must be less than $10,000,000"),
  required_skills: z.array(z.string().trim().min(1).max(50)).max(20, "Maximum 20 skills allowed")
});

interface CreateJobDialogProps {
  userId: string;
  onJobCreated: () => void;
}

const CreateJobDialog = ({ userId, onJobCreated }: CreateJobDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = jobSchema.parse({
        title,
        description,
        budget: parseFloat(budget),
        required_skills: skills,
      });

      const { data: jobData, error } = await supabase.from("jobs").insert([
        {
          client_id: userId,
          title: validatedData.title,
          description: validatedData.description,
          budget: validatedData.budget,
          required_skills: validatedData.required_skills,
          status: "open",
        },
      ]).select().single();

      if (error) throw error;

      toast.success("Job posted successfully! Redirecting to payment...");
      
      // Initiate payment flow
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-paymob-payment',
        {
          body: {
            job_id: jobData.id,
            amount: validatedData.budget
          }
        }
      );

      if (paymentError) {
        console.error("Payment initiation error:", paymentError);
        toast.error("Job created but payment failed. Please contact support.");
        setOpen(false);
        onJobCreated();
        return;
      }

      // Redirect to Paymob payment page
      if (paymentData?.payment_url) {
        window.location.href = paymentData.payment_url;
      } else {
        throw new Error("No payment URL received");
      }

      setOpen(false);
      setTitle("");
      setDescription("");
      setBudget("");
      setSkills([]);
      onJobCreated();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to create job");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Post New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a New Job</DialogTitle>
          <DialogDescription>
            Describe your robotics project and attract qualified freelancers
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              placeholder="e.g. ROS2 Navigation Stack Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-description">Description</Label>
            <Textarea
              id="job-description"
              placeholder="Describe your project requirements, deliverables, and timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job-budget">Budget ($)</Label>
            <Input
              id="job-budget"
              type="number"
              step="0.01"
              min="1"
              placeholder="5000.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Required Skills</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add skill (e.g. ROS2, SLAM, Python)"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <Button type="button" size="sm" onClick={handleAddSkill}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Posting..." : "Post Job"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;
