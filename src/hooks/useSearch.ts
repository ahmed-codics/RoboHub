import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SearchResultProfile = {
    id: string;
    name: string;
    bio: string | null;
    headline: string | null;
    location: string | null;
    avatar_url: string | null;
    skills: string[];
};

export type SearchResultJob = {
    id: string;
    title: string;
    description: string;
    budget: number;
    required_skills: string[];
    created_at: string;
};

type ProfileSearchRow = Omit<SearchResultProfile, "skills">;

const toSearchProfile = (profile: ProfileSearchRow): SearchResultProfile => ({
    ...profile,
    skills: []
});

const getSearchTerms = (query: string) => {
    const normalized = query.trim().replace(/[^\w\s+#.-]/g, "");
    const tokens = normalized
        .split(/\s+/)
        .map(term => term.replace(/[^\w+#.-]/g, ""))
        .filter(term => term.length >= 2);

    return Array.from(new Set([normalized, ...tokens].filter(Boolean)));
};

const buildIlikeFilter = (columns: string[], terms: string[]) =>
    terms
        .flatMap(term => columns.map(column => `${column}.ilike.%${term}%`))
        .join(",");

export const useSearch = (query: string) => {
    const [freelancers, setFreelancers] = useState<SearchResultProfile[]>([]);
    const [jobs, setJobs] = useState<SearchResultJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) {
                setFreelancers([]);
                setJobs([]);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const terms = getSearchTerms(query);
                const profileFilter = buildIlikeFilter(["name", "bio", "headline", "location"], terms);
                const skillFilter = buildIlikeFilter(["skill"], terms);
                const experienceFilter = buildIlikeFilter(["title", "company"], terms);
                const certificationFilter = buildIlikeFilter(["name"], terms);
                const jobFilter = buildIlikeFilter(["title", "description"], terms);

                // 1. Search Freelancers (Profiles)
                // Explicitly selecting ONLY profile fields to avoid relationship error
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, name, bio, headline, location, avatar_url')
                    .or(profileFilter);

                if (profileError) throw profileError;

                let allProfiles = (profileData || []).map(toSearchProfile);


                // 2. Also find freelancers by SKILL (separate query)
                const { data: skillData, error: skillError } = await supabase
                    .from('freelancer_skills')
                    .select('user_id, skill')
                    .or(skillFilter);

                if (!skillError && skillData && skillData.length > 0) {
                    const userIds = skillData.map(s => s.user_id);
                    // Fetch profiles for these skills if not already found
                    const { data: skillProfiles } = await supabase
                        .from('profiles')
                        .select('id, name, bio, headline, location, avatar_url')
                        .in('id', userIds);

                    if (skillProfiles) {
                        const newProfiles = skillProfiles.map(toSearchProfile);

                        // Merge with existing matches
                        allProfiles = [...allProfiles, ...newProfiles];
                    }
                }

                // 2b. Find freelancers by imported experience/certifications.
                const { data: experienceData, error: experienceError } = await supabase
                    .from('profile_experience')
                    .select('user_id')
                    .or(experienceFilter);

                const { data: certificationData, error: certificationError } = await supabase
                    .from('profile_certifications')
                    .select('user_id')
                    .or(certificationFilter);

                const backgroundUserIds = [
                    ...(!experienceError && experienceData ? experienceData.map(item => item.user_id) : []),
                    ...(!certificationError && certificationData ? certificationData.map(item => item.user_id) : []),
                ];

                if (backgroundUserIds.length > 0) {
                    const { data: backgroundProfiles } = await supabase
                        .from('profiles')
                        .select('id, name, bio, headline, location, avatar_url')
                        .in('id', Array.from(new Set(backgroundUserIds)));

                    if (backgroundProfiles) {
                        allProfiles = [
                            ...allProfiles,
                            ...backgroundProfiles.map(toSearchProfile)
                        ];
                    }
                }

                // Deduplicate using Map by ID
                const uniqueProfilesMap = new Map(allProfiles.map(p => [p.id, p]));

                // 3. FETCH ALL SKILLS for these found users manually to populate 'skills' array
                // This replaces the join that was failing
                if (uniqueProfilesMap.size > 0) {
                    const allFoundUserIds = Array.from(uniqueProfilesMap.keys());
                    const { data: allSkills, error: allSkillsError } = await supabase
                        .from('freelancer_skills')
                        .select('user_id, skill')
                        .in('user_id', allFoundUserIds);

                    if (!allSkillsError && allSkills) {
                        allSkills.forEach((item) => {
                            if (uniqueProfilesMap.has(item.user_id)) {
                                const profile = uniqueProfilesMap.get(item.user_id);
                                if (profile && !profile.skills.includes(item.skill)) {
                                    profile.skills.push(item.skill);
                                }
                            }
                        });
                    }
                }

                setFreelancers(Array.from(uniqueProfilesMap.values()));


                // 4. Search Jobs
                const { data: jobData, error: jobError } = await supabase
                    .from('jobs')
                    .select('*')
                    .or(jobFilter);

                if (jobError) throw jobError;
                setJobs(jobData || []);

            } catch (err) {
                console.error("Search failed:", err);
                setError(err instanceof Error ? err.message : "Search failed");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    return { freelancers, jobs, loading, error };
};
