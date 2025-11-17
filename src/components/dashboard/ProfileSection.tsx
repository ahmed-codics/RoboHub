import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Plus, X } from "lucide-react";

interface ProfileSectionProps {
  userId: string;
  profile: any;
  onUpdate: () => void;
}

const ProfileSection = ({ userId, profile, onUpdate }: ProfileSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [skills, setSkills] = useState<any[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ name, bio })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setEditing(false);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      const { error } = await supabase
        .from("freelancer_skills")
        .insert([{ user_id: userId, skill: newSkill.trim() }]);

      if (error) throw error;

      setNewSkill("");
      toast.success("Skill added!");
      loadSkills();
    } catch (error: any) {
      toast.error(error.message || "Failed to add skill");
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      const { error } = await supabase
        .from("freelancer_skills")
        .delete()
        .eq("id", skillId);

      if (error) throw error;

      toast.success("Skill removed");
      loadSkills();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove skill");
    }
  };

  const loadSkills = async () => {
    const { data, error } = await supabase
      .from("freelancer_skills")
      .select("*")
      .eq("user_id", userId);

    if (!error && data) {
      setSkills(data);
    }
  };

  useState(() => {
    loadSkills();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => (editing ? handleSaveProfile() : setEditing(true))}
            disabled={loading}
          >
            {editing ? "Save" : "Edit"}
          </Button>
        </div>
        <CardDescription>Your professional information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-bio">Bio</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell clients about your robotics expertise..."
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bio</p>
              <p className="text-sm">{profile?.bio || "No bio added yet"}</p>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill: any) => (
              <Badge key={skill.id} variant="secondary" className="gap-1">
                {skill.skill}
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add skill (e.g. ROS, SLAM)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
            />
            <Button size="sm" onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSection;
