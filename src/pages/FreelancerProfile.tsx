import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReviewsList from "@/components/reviews/ReviewsList";
import SaveButton from "@/components/SaveButton";
import { useSeo } from "@/hooks/useSeo";
import {
  Loader2, User, MapPin, Link as LinkIcon, Linkedin, Star, Briefcase,
  CheckCircle2, Award, GraduationCap, Calendar, MessageSquare, ArrowLeft,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
}

interface Experience {
  id: string; title: string; company: string | null; location: string | null;
  start_date: string | null; end_date: string | null; is_current: boolean; description: string | null;
}
interface Education {
  id: string; school: string; degree: string | null; field: string | null;
  start_year: string | null; end_year: string | null;
}
interface Certification {
  id: string; name: string; issuer: string | null; issued_at: string | null; credential_url: string | null;
}
interface PortfolioImage { id: string; image_url: string; title: string | null; description: string | null; }

const FreelancerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [stats, setStats] = useState({ completed: 0, reviews: 0, rating: 0 });

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, name, headline, bio, location, avatar_url, linkedin_url, website_url, created_at")
        .eq("id", id)
        .maybeSingle();

      if (!active) return;

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(profileData as Profile);

      const [skillsRes, expRes, eduRes, certRes, portRes, reviewsRes, escrowRes] = await Promise.all([
        supabase.from("freelancer_skills").select("skill").eq("user_id", id),
        supabase.from("profile_experience").select("*").eq("user_id", id).order("sort_order", { ascending: true }),
        supabase.from("profile_education").select("*").eq("user_id", id).order("sort_order", { ascending: true }),
        supabase.from("profile_certifications").select("*").eq("user_id", id).order("sort_order", { ascending: true }),
        supabase.from("portfolio_images").select("*").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("reviews").select("rating").eq("reviewee_id", id),
        supabase.from("escrow_transactions").select("id").eq("freelancer_id", id).eq("status", "released"),
      ]);

      if (!active) return;

      setSkills((skillsRes.data || []).map((s: any) => s.skill));
      setExperience((expRes.data as Experience[]) || []);
      setEducation((eduRes.data as Education[]) || []);
      setCertifications((certRes.data as Certification[]) || []);
      setPortfolio((portRes.data as PortfolioImage[]) || []);

      const reviews = reviewsRes.data || [];
      const rating = reviews.length
        ? Math.round((reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length) * 10) / 10
        : 0;
      setStats({ completed: (escrowRes.data || []).length, reviews: reviews.length, rating });

      setLoading(false);
    };

    load();
    return () => { active = false; };
  }, [id]);

  useSeo(
    profile ? profile.name : "Freelancer",
    profile ? profile.headline || profile.bio || `${profile.name} on RemoteRobotics` : undefined
  );

  const memberSince = profile
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : "";

  const isTopRated = stats.rating >= 4.8 && stats.reviews >= 3;

  const handleContact = () => navigate(user ? "/messages" : "/auth");
  const handleHire = () => navigate(user ? "/jobs" : "/auth");

  const formatRange = (start: string | null, end: string | null, current?: boolean) => {
    const s = start ? new Date(start).getFullYear() : "";
    const e = current ? "Present" : end ? new Date(end).getFullYear() : "";
    if (!s && !e) return "";
    return [s, e].filter(Boolean).join(" — ");
  };

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        )}

        {!loading && notFound && (
          <div className="rounded-lg border border-slate-200 bg-white p-16 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-900">Freelancer not found</p>
            <p className="mt-2 text-slate-500">This profile may have been removed or the link is incorrect.</p>
            <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={() => navigate("/search")}>
              Browse talent
            </Button>
          </div>
        )}

        {!loading && profile && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column — identity + actions */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="pt-6 flex flex-col items-center text-center">
                  <Avatar className="h-28 w-28 mb-4 ring-4 ring-teal-50">
                    <AvatarImage src={profile.avatar_url || ""} />
                    <AvatarFallback><User className="h-12 w-12 text-slate-400" /></AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                  {profile.headline && <p className="mt-1 text-slate-600">{profile.headline}</p>}

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{profile.location}</span>
                    )}
                    <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Member since {memberSince}</span>
                  </div>

                  {isTopRated && (
                    <Badge className="mt-4 bg-amber-100 text-amber-800 hover:bg-amber-100 border-0 gap-1">
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Top Rated
                    </Badge>
                  )}

                  <div className="mt-6 grid w-full grid-cols-2 gap-3">
                    <Button onClick={handleHire} className="bg-teal-600 hover:bg-teal-700 text-white">
                      <Briefcase className="h-4 w-4 mr-1.5" /> Hire
                    </Button>
                    <Button onClick={handleContact} variant="outline" className="border-slate-200">
                      <MessageSquare className="h-4 w-4 mr-1.5" /> Message
                    </Button>
                  </div>
                  <SaveButton itemType="freelancer" itemId={profile.id} variant="full" className="mt-3 w-full justify-center" />

                  {(profile.linkedin_url || profile.website_url) && (
                    <div className="mt-4 flex w-full flex-col gap-2">
                      {profile.website_url && (
                        <a href={profile.website_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline">
                          <LinkIcon className="h-4 w-4" /> Website
                        </a>
                      )}
                      {profile.linkedin_url && (
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="grid grid-cols-3 divide-x divide-slate-100 py-6 text-center">
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">{stats.completed}</p>
                    <p className="text-xs text-slate-500 mt-1">Jobs done</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900 flex items-center justify-center gap-1">
                      {stats.rating || "—"}
                      {stats.rating > 0 && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Rating</p>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">{stats.reviews}</p>
                    <p className="text-xs text-slate-500 mt-1">Reviews</p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {skills.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-base">Skills</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-slate-100 text-slate-700">{skill}</Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right column — details */}
            <div className="lg:col-span-2 space-y-6">
              {profile.bio && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-lg">About</CardTitle></CardHeader>
                  <CardContent><p className="whitespace-pre-line text-slate-600 leading-relaxed">{profile.bio}</p></CardContent>
                </Card>
              )}

              {portfolio.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Portfolio</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {portfolio.map((item) => (
                      <figure key={item.id} className="group overflow-hidden rounded-lg border border-slate-200">
                        <img src={item.image_url} alt={item.title || "Portfolio item"}
                          className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        {item.title && <figcaption className="px-2 py-1.5 text-xs text-slate-600 truncate">{item.title}</figcaption>}
                      </figure>
                    ))}
                  </CardContent>
                </Card>
              )}

              {experience.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-teal-600" /> Experience</CardTitle></CardHeader>
                  <CardContent className="space-y-5">
                    {experience.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-slate-100 pl-4">
                        <p className="font-semibold text-slate-900">{exp.title}</p>
                        <p className="text-sm text-slate-600">
                          {[exp.company, exp.location].filter(Boolean).join(" · ")}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{formatRange(exp.start_date, exp.end_date, exp.is_current)}</p>
                        {exp.description && <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{exp.description}</p>}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {education.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><GraduationCap className="h-5 w-5 text-teal-600" /> Education</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="border-l-2 border-slate-100 pl-4">
                        <p className="font-semibold text-slate-900">{edu.school}</p>
                        <p className="text-sm text-slate-600">{[edu.degree, edu.field].filter(Boolean).join(", ")}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{[edu.start_year, edu.end_year].filter(Boolean).join(" — ")}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {certifications.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Award className="h-5 w-5 text-teal-600" /> Certifications</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {cert.credential_url ? (
                              <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="hover:text-teal-700 hover:underline">{cert.name}</a>
                            ) : cert.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {[cert.issuer, cert.issued_at ? new Date(cert.issued_at).getFullYear() : null].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-slate-200 shadow-sm">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-teal-600" /> Reviews</CardTitle></CardHeader>
                <CardContent><ReviewsList userId={profile.id} /></CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default FreelancerProfile;
