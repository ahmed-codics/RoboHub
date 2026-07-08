import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, X, Upload, Camera, Trash2 } from "lucide-react";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  headline: z.string().trim().max(160, "Headline must be less than 160 characters").optional(),
  location: z.string().trim().max(120, "Location must be less than 120 characters").optional(),
  bio: z.string().trim().max(2000, "Bio must be less than 2000 characters").optional(),
  linkedin_url: z.string().trim().max(300, "LinkedIn URL is too long").optional(),
  website_url: z.string().trim().max(300, "Website URL is too long").optional()
});

const skillSchema = z.string().trim().min(1, "Skill cannot be empty").max(50, "Skill must be less than 50 characters");

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

interface ProfileSectionProps {
  userId: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  onUpdate: () => void;
}

type FreelancerSkill = Database["public"]["Tables"]["freelancer_skills"]["Row"];
type PortfolioImage = Database["public"]["Tables"]["portfolio_images"]["Row"];
type ProfileExperience = Database["public"]["Tables"]["profile_experience"]["Row"];
type ProfileEducation = Database["public"]["Tables"]["profile_education"]["Row"];
type ProfileCertification = Database["public"]["Tables"]["profile_certifications"]["Row"];

const ProfileSection = ({ userId, profile, onUpdate }: ProfileSectionProps) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [headline, setHeadline] = useState(profile?.headline || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [newSkill, setNewSkill] = useState("");
  const [skills, setSkills] = useState<FreelancerSkill[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [experience, setExperience] = useState<ProfileExperience[]>([]);
  const [education, setEducation] = useState<ProfileEducation[]>([]);
  const [certifications, setCertifications] = useState<ProfileCertification[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioTitle, setPortfolioTitle] = useState("");
  const [portfolioDescription, setPortfolioDescription] = useState("");

  const loadSkills = useCallback(async () => {
    const { data, error } = await supabase
      .from("freelancer_skills")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error loading skills:", error);
      return;
    }

    setSkills(data || []);
  }, [userId]);

  const loadPortfolioImages = useCallback(async () => {
    const { data, error } = await supabase
      .from("portfolio_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading portfolio:", error);
      return;
    }

    setPortfolioImages(data || []);
  }, [userId]);

  const loadStructuredProfile = useCallback(async () => {
    const [experienceResult, educationResult, certificationResult] = await Promise.all([
      supabase
        .from("profile_experience")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profile_education")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("profile_certifications")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
    ]);

    if (!experienceResult.error) setExperience(experienceResult.data || []);
    if (!educationResult.error) setEducation(educationResult.data || []);
    if (!certificationResult.error) setCertifications(certificationResult.data || []);
  }, [userId]);

  useEffect(() => {
    setName(profile?.name || "");
    setHeadline(profile?.headline || "");
    setLocation(profile?.location || "");
    setBio(profile?.bio || "");
    setLinkedinUrl(profile?.linkedin_url || "");
    setWebsiteUrl(profile?.website_url || "");
    setAvatarUrl(profile?.avatar_url || "");
    loadSkills();
    loadPortfolioImages();
    loadStructuredProfile();
  }, [userId, profile, loadSkills, loadPortfolioImages, loadStructuredProfile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Profile picture updated!");
      onUpdate();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload image"));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploadingPortfolio(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolios")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("portfolios")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("portfolio_images")
        .insert([
          {
            user_id: userId,
            image_url: publicUrl,
            title: portfolioTitle || null,
            description: portfolioDescription || null,
          },
        ]);

      if (insertError) throw insertError;

      toast.success("Portfolio image added!");
      setPortfolioTitle("");
      setPortfolioDescription("");
      loadPortfolioImages();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload image"));
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleDeletePortfolioImage = async (imageId: string, imageUrl: string) => {
    try {
      const fileName = imageUrl.split("/").pop();
      const filePath = `${userId}/${fileName}`;

      await supabase.storage.from("portfolios").remove([filePath]);

      const { error } = await supabase
        .from("portfolio_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;

      toast.success("Portfolio image deleted");
      loadPortfolioImages();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete image"));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      // Validate input
      const validatedData = profileSchema.parse({
        name,
        headline: headline || undefined,
        location: location || undefined,
        bio: bio || undefined,
        linkedin_url: linkedinUrl || undefined,
        website_url: websiteUrl || undefined,
      });

      const { error } = await supabase
        .from("profiles")
        .update({ 
          name: validatedData.name, 
          headline: validatedData.headline || null,
          location: validatedData.location || null,
          bio: validatedData.bio || null,
          linkedin_url: validatedData.linkedin_url || null,
          website_url: validatedData.website_url || null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      setEditing(false);
      onUpdate();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(getErrorMessage(error, "Failed to update profile"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      // Validate skill
      const validatedSkill = skillSchema.parse(newSkill);

      const { error } = await supabase
        .from("freelancer_skills")
        .insert([{ user_id: userId, skill: validatedSkill }]);

      if (error) throw error;

      toast.success("Skill added!");
      setNewSkill("");
      loadSkills();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(getErrorMessage(error, "Failed to add skill"));
      }
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
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to remove skill"));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="text-2xl">
                {name.split(" ").map((n) => n[0]).join("").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label
                htmlFor="avatar-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Change Photo"}
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploadingAvatar}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max 5MB. JPG, PNG or GIF
              </p>
            </div>
          </div>

          {/* Name and Bio */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                disabled={!editing}
                placeholder="e.g., ROS2 Navigation and Embedded Systems Engineer"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!editing}
                  placeholder="City, Country"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                <Input
                  id="linkedin-url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  disabled={!editing}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website-url">Website URL</Label>
              <Input
                id="website-url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={!editing}
                placeholder="Portfolio or personal website"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!editing}
                placeholder="Tell clients about your experience, expertise, and what makes you unique..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setName(profile?.name || "");
                    setHeadline(profile?.headline || "");
                    setLocation(profile?.location || "");
                    setBio(profile?.bio || "");
                    setLinkedinUrl(profile?.linkedin_url || "");
                    setWebsiteUrl(profile?.website_url || "");
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(experience.length > 0 || education.length > 0 || certifications.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Background</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {experience.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900">Experience</h3>
                <div className="space-y-3">
                  {experience.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="text-sm text-slate-600">
                        {[item.company, item.location].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[item.start_date, item.is_current ? "Present" : item.end_date].filter(Boolean).join(" - ")}
                      </p>
                      {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900">Education</h3>
                <div className="space-y-3">
                  {education.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{item.school}</p>
                      <p className="text-sm text-slate-600">
                        {[item.degree, item.field].filter(Boolean).join(" • ")}
                      </p>
                      <p className="text-xs text-slate-500">
                        {[item.start_year, item.end_year].filter(Boolean).join(" - ")}
                      </p>
                      {item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {certifications.length > 0 && (
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-900">Certifications</h3>
                <div className="space-y-3">
                  {certifications.map((item) => (
                    <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-sm text-slate-600">
                        {[item.issuer, item.issued_at].filter(Boolean).join(" • ")}
                      </p>
                      {item.credential_url && (
                        <a
                          className="mt-2 block text-sm text-teal-700 hover:underline"
                          href={item.credential_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View credential
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      )}

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill.id} variant="secondary" className="gap-1">
                {skill.skill}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => handleRemoveSkill(skill.id)}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g., ROS, Python, SLAM)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
            />
            <Button onClick={handleAddSkill} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Section */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Showcase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="portfolio-title">Project Title (Optional)</Label>
              <Input
                id="portfolio-title"
                value={portfolioTitle}
                onChange={(e) => setPortfolioTitle(e.target.value)}
                placeholder="e.g., Autonomous Navigation System"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio-desc">Description (Optional)</Label>
              <Textarea
                id="portfolio-desc"
                value={portfolioDescription}
                onChange={(e) => setPortfolioDescription(e.target.value)}
                placeholder="Brief description of the project..."
                rows={2}
              />
            </div>
            <div>
              <Label
                htmlFor="portfolio-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              >
                <Upload className="h-4 w-4" />
                {uploadingPortfolio ? "Uploading..." : "Add Portfolio Image"}
              </Label>
              <Input
                id="portfolio-upload"
                type="file"
                accept="image/*"
                onChange={handlePortfolioUpload}
                disabled={uploadingPortfolio}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Max 10MB. Show your best work!
              </p>
            </div>
          </div>

          {portfolioImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
              {portfolioImages.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.image_url}
                    alt={image.title || "Portfolio image"}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center p-4 text-white">
                    {image.title && (
                      <p className="font-semibold text-sm text-center mb-1">
                        {image.title}
                      </p>
                    )}
                    {image.description && (
                      <p className="text-xs text-center mb-3 line-clamp-2">
                        {image.description}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleDeletePortfolioImage(image.id, image.image_url)
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {portfolioImages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No portfolio images yet. Upload your best work to showcase your skills!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSection;
