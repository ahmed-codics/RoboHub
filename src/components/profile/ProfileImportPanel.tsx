import { useState } from "react";
import type { ReactNode } from "react";
import { FileText, Loader2, Plus, RefreshCw, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ExtractedCertification,
  ExtractedEducation,
  ExtractedExperience,
  ExtractedProfile,
  dedupeStrings,
  emptyExtractedProfile,
  extractTextFromPdf,
  normalizeExtractedProfile,
  validateProfilePdf,
} from "@/lib/profileImport";

type Step = "upload" | "extracting" | "review" | "saved";

type ProfileImportPanelProps = {
  userId: string;
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  onApplied: () => void;
};

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const textValue = (value: unknown) => (typeof value === "string" ? value : "");

const ProfileImportPanel = ({ userId, profile, onApplied }: ProfileImportPanelProps) => {
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentPath, setDocumentPath] = useState("");
  const [importId, setImportId] = useState("");
  const [extractedProfile, setExtractedProfile] = useState<ExtractedProfile>(emptyExtractedProfile());
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);

  const resetImport = () => {
    setStep("upload");
    setSelectedFile(null);
    setDocumentPath("");
    setImportId("");
    setExtractedProfile(emptyExtractedProfile());
    setNewSkill("");
    setError("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      validateProfilePdf(file);
      setSelectedFile(file);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid PDF file.";
      setSelectedFile(null);
      setError(message);
      toast.error(message);
    }
  };

  const uploadAndExtract = async () => {
    if (!selectedFile) {
      toast.error("Choose a PDF first.");
      return;
    }

    setStep("extracting");
    setError("");

    try {
      const extractedText = await withTimeout(
        extractTextFromPdf(selectedFile),
        15000,
        "PDF text extraction took too long. Try a smaller text-based PDF."
      );

      const path = `${userId}/${Date.now()}-${sanitizeFileName(selectedFile.name)}`;
      const { error: uploadError } = await withTimeout(
        supabase.storage.from("profile-documents").upload(path, selectedFile, {
          contentType: "application/pdf",
          upsert: false,
        }),
        20000,
        "Document upload timed out."
      );

      if (uploadError) throw uploadError;
      setDocumentPath(path);

      const { data, error: functionError } = await withTimeout(
        supabase.functions.invoke("extract-profile-from-document", {
          body: {
            sourceType: "cv_pdf",
            documentPath: path,
            originalFilename: selectedFile.name,
            extractedText,
          },
        }),
        45000,
        "Profile extraction timed out. Please try again."
      );

      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);

      setImportId(data?.importId || "");
      setExtractedProfile(normalizeExtractedProfile(data?.profile));
      setStep("review");
      toast.success("Profile draft extracted. Review it before saving.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to extract profile.";
      setError(message);
      setStep("upload");
      toast.error(message);
    }
  };

  const updateProfileField = (field: keyof ExtractedProfile, value: string) => {
    setExtractedProfile((current) => ({ ...current, [field]: value }));
  };

  const addSkill = () => {
    const nextSkills = dedupeStrings([...extractedProfile.skills, newSkill]);
    setExtractedProfile((current) => ({ ...current, skills: nextSkills }));
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setExtractedProfile((current) => ({
      ...current,
      skills: current.skills.filter((item) => item !== skill),
    }));
  };

  const updateExperience = (index: number, field: keyof ExtractedExperience, value: string | boolean) => {
    setExtractedProfile((current) => ({
      ...current,
      experience: current.experience.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateEducation = (index: number, field: keyof ExtractedEducation, value: string) => {
    setExtractedProfile((current) => ({
      ...current,
      education: current.education.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const updateCertification = (index: number, field: keyof ExtractedCertification, value: string) => {
    setExtractedProfile((current) => ({
      ...current,
      certifications: current.certifications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const deleteDocument = async () => {
    if (!documentPath) return;
    setDeletingDocument(true);

    try {
      const { error: deleteError } = await supabase.storage.from("profile-documents").remove([documentPath]);
      if (deleteError) throw deleteError;
      setDocumentPath("");
      toast.success("Uploaded PDF deleted.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete uploaded PDF.";
      toast.error(message);
    } finally {
      setDeletingDocument(false);
    }
  };

  const applyToProfile = async () => {
    setSaving(true);
    setError("");

    try {
      const profileUpdate = {
        name: extractedProfile.name?.trim() || textValue(profile?.name) || "User",
        headline: extractedProfile.headline?.trim() || null,
        location: extractedProfile.location?.trim() || null,
        bio: extractedProfile.bio?.trim() || null,
        linkedin_url: extractedProfile.links.linkedin_url?.trim() || null,
        website_url: extractedProfile.links.website_url?.trim() || null,
        profile_import_completed_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId);

      if (profileError) throw profileError;

      const { data: existingSkills, error: skillsLoadError } = await supabase
        .from("freelancer_skills")
        .select("skill")
        .eq("user_id", userId);

      if (skillsLoadError) throw skillsLoadError;

      const currentSkillKeys = new Set((existingSkills || []).map((item) => item.skill.toLowerCase()));
      const skillsToInsert = dedupeStrings(extractedProfile.skills)
        .filter((skill) => !currentSkillKeys.has(skill.toLowerCase()))
        .map((skill) => ({ user_id: userId, skill }));

      if (skillsToInsert.length > 0) {
        const { error: skillsInsertError } = await supabase.from("freelancer_skills").insert(skillsToInsert);
        if (skillsInsertError) throw skillsInsertError;
      }

      await supabase.from("profile_experience").delete().eq("user_id", userId);
      const experienceRows = extractedProfile.experience
        .filter((item) => item.title?.trim())
        .map((item, index) => ({
          user_id: userId,
          title: item.title.trim(),
          company: item.company?.trim() || null,
          location: item.location?.trim() || null,
          start_date: item.start_date?.trim() || null,
          end_date: item.end_date?.trim() || null,
          is_current: Boolean(item.is_current),
          description: item.description?.trim() || null,
          source_import_id: importId || null,
          sort_order: index,
        }));

      if (experienceRows.length > 0) {
        const { error: experienceError } = await supabase.from("profile_experience").insert(experienceRows);
        if (experienceError) throw experienceError;
      }

      await supabase.from("profile_education").delete().eq("user_id", userId);
      const educationRows = extractedProfile.education
        .filter((item) => item.school?.trim())
        .map((item, index) => ({
          user_id: userId,
          school: item.school.trim(),
          degree: item.degree?.trim() || null,
          field: item.field?.trim() || null,
          start_year: item.start_year?.trim() || null,
          end_year: item.end_year?.trim() || null,
          description: item.description?.trim() || null,
          source_import_id: importId || null,
          sort_order: index,
        }));

      if (educationRows.length > 0) {
        const { error: educationError } = await supabase.from("profile_education").insert(educationRows);
        if (educationError) throw educationError;
      }

      await supabase.from("profile_certifications").delete().eq("user_id", userId);
      const certificationRows = extractedProfile.certifications
        .filter((item) => item.name?.trim())
        .map((item, index) => ({
          user_id: userId,
          name: item.name.trim(),
          issuer: item.issuer?.trim() || null,
          issued_at: item.issued_at?.trim() || null,
          credential_url: item.credential_url?.trim() || null,
          source_import_id: importId || null,
          sort_order: index,
        }));

      if (certificationRows.length > 0) {
        const { error: certificationError } = await supabase.from("profile_certifications").insert(certificationRows);
        if (certificationError) throw certificationError;
      }

      if (importId) {
        await supabase
          .from("profile_imports")
          .update({ status: "completed", extracted_json: extractedProfile as unknown as Json })
          .eq("id", importId);
      }

      setStep("saved");
      toast.success("Imported profile saved.");
      onApplied();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save imported profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <div>
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-teal-600" />
              Import from CV or LinkedIn PDF
            </CardTitle>
            <p className="mt-2 text-sm text-slate-600">
              Upload a text-based PDF, review the extracted profile, then choose what to save.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md border border-teal-100 bg-teal-50 p-3 text-sm text-teal-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>Your document is used only to extract your profile and can be deleted after import.</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-slate-500">
          {["Upload", "Extracting", "Review", "Saved"].map((label, index) => {
            const activeIndex = ["upload", "extracting", "review", "saved"].indexOf(step);
            return (
              <div
                key={label}
                className={`rounded-full px-3 py-2 text-center ${
                  index <= activeIndex ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-400"
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">
              <Label htmlFor="profile-document" className="mb-3 block text-sm font-semibold text-slate-700">
                PDF document
              </Label>
              <Input id="profile-document" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
              <p className="mt-2 text-xs text-slate-500">
                Max 10MB. For LinkedIn, save or print your profile as a PDF and upload it here.
              </p>
              {selectedFile && (
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <Button onClick={uploadAndExtract} disabled={!selectedFile} className="bg-teal-600 hover:bg-teal-700">
              <Upload className="mr-2 h-4 w-4" />
              Extract Profile Draft
            </Button>
          </div>
        )}

        {step === "extracting" && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="mt-4 font-semibold text-slate-900">Extracting your profile draft</p>
            <p className="mt-1 text-sm text-slate-500">This should finish in less than a minute.</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            {extractedProfile.warnings.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {extractedProfile.warnings.map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={extractedProfile.name || ""} onChange={(event) => updateProfileField("name", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Headline</Label>
                <Input value={extractedProfile.headline || ""} onChange={(event) => updateProfileField("headline", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={extractedProfile.location || ""} onChange={(event) => updateProfileField("location", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  value={extractedProfile.links.linkedin_url || ""}
                  onChange={(event) =>
                    setExtractedProfile((current) => ({
                      ...current,
                      links: { ...current.links, linkedin_url: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Website URL</Label>
                <Input
                  value={extractedProfile.links.website_url || ""}
                  onChange={(event) =>
                    setExtractedProfile((current) => ({
                      ...current,
                      links: { ...current.links, website_url: event.target.value },
                    }))
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  rows={5}
                  value={extractedProfile.bio || ""}
                  onChange={(event) => updateProfileField("bio", event.target.value)}
                />
              </div>
            </div>

            <section className="space-y-3">
              <h3 className="font-semibold text-slate-900">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {extractedProfile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="gap-1">
                    {skill}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(event) => setNewSkill(event.target.value)}
                  placeholder="Add skill"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" size="icon" onClick={addSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </section>

            <EditableList
              title="Experience"
              emptyText="No experience found. Add one if needed."
              items={extractedProfile.experience}
              onAdd={() =>
                setExtractedProfile((current) => ({
                  ...current,
                  experience: [...current.experience, { title: "", company: "", description: "" }],
                }))
              }
              onRemove={(index) =>
                setExtractedProfile((current) => ({
                  ...current,
                  experience: current.experience.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
              renderItem={(item, index) => (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Title" value={item.title || ""} onChange={(event) => updateExperience(index, "title", event.target.value)} />
                  <Input placeholder="Company" value={item.company || ""} onChange={(event) => updateExperience(index, "company", event.target.value)} />
                  <Input placeholder="Location" value={item.location || ""} onChange={(event) => updateExperience(index, "location", event.target.value)} />
                  <Input placeholder="Start date" value={item.start_date || ""} onChange={(event) => updateExperience(index, "start_date", event.target.value)} />
                  <Input placeholder="End date" value={item.end_date || ""} onChange={(event) => updateExperience(index, "end_date", event.target.value)} />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={Boolean(item.is_current)} onChange={(event) => updateExperience(index, "is_current", event.target.checked)} />
                    Current role
                  </label>
                  <Textarea className="md:col-span-2" placeholder="Description" value={item.description || ""} onChange={(event) => updateExperience(index, "description", event.target.value)} />
                </div>
              )}
            />

            <EditableList
              title="Education"
              emptyText="No education found. Add one if needed."
              items={extractedProfile.education}
              onAdd={() =>
                setExtractedProfile((current) => ({
                  ...current,
                  education: [...current.education, { school: "", degree: "", field: "" }],
                }))
              }
              onRemove={(index) =>
                setExtractedProfile((current) => ({
                  ...current,
                  education: current.education.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
              renderItem={(item, index) => (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="School" value={item.school || ""} onChange={(event) => updateEducation(index, "school", event.target.value)} />
                  <Input placeholder="Degree" value={item.degree || ""} onChange={(event) => updateEducation(index, "degree", event.target.value)} />
                  <Input placeholder="Field" value={item.field || ""} onChange={(event) => updateEducation(index, "field", event.target.value)} />
                  <Input placeholder="Start year" value={item.start_year || ""} onChange={(event) => updateEducation(index, "start_year", event.target.value)} />
                  <Input placeholder="End year" value={item.end_year || ""} onChange={(event) => updateEducation(index, "end_year", event.target.value)} />
                  <Textarea className="md:col-span-2" placeholder="Description" value={item.description || ""} onChange={(event) => updateEducation(index, "description", event.target.value)} />
                </div>
              )}
            />

            <EditableList
              title="Certifications"
              emptyText="No certifications found. Add one if needed."
              items={extractedProfile.certifications}
              onAdd={() =>
                setExtractedProfile((current) => ({
                  ...current,
                  certifications: [...current.certifications, { name: "", issuer: "" }],
                }))
              }
              onRemove={(index) =>
                setExtractedProfile((current) => ({
                  ...current,
                  certifications: current.certifications.filter((_, itemIndex) => itemIndex !== index),
                }))
              }
              renderItem={(item, index) => (
                <div className="grid gap-3 md:grid-cols-2">
                  <Input placeholder="Name" value={item.name || ""} onChange={(event) => updateCertification(index, "name", event.target.value)} />
                  <Input placeholder="Issuer" value={item.issuer || ""} onChange={(event) => updateCertification(index, "issuer", event.target.value)} />
                  <Input placeholder="Issued date" value={item.issued_at || ""} onChange={(event) => updateCertification(index, "issued_at", event.target.value)} />
                  <Input placeholder="Credential URL" value={item.credential_url || ""} onChange={(event) => updateCertification(index, "credential_url", event.target.value)} />
                </div>
              )}
            />

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row">
              <Button onClick={applyToProfile} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply to Profile
              </Button>
              <Button type="button" variant="outline" onClick={resetImport}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start Over
              </Button>
              {documentPath && (
                <Button type="button" variant="outline" onClick={deleteDocument} disabled={deletingDocument}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Uploaded PDF
                </Button>
              )}
            </div>
          </div>
        )}

        {step === "saved" && (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-6">
            <p className="font-semibold text-teal-950">Your imported profile is saved.</p>
            <p className="mt-1 text-sm text-teal-800">You can keep editing your public profile below.</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={resetImport}>
                Import Another PDF
              </Button>
              {documentPath && (
                <Button type="button" variant="outline" onClick={deleteDocument} disabled={deletingDocument}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Uploaded PDF
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

type EditableListProps<T> = {
  title: string;
  emptyText: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
};

const EditableList = <T,>({ title, emptyText, items, onAdd, onRemove, renderItem }: EditableListProps<T>) => (
  <section className="space-y-3">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-2 h-4 w-4" />
        Add
      </Button>
    </div>
    {items.length === 0 ? (
      <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        {emptyText}
      </p>
    ) : (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    )}
  </section>
);

export default ProfileImportPanel;
