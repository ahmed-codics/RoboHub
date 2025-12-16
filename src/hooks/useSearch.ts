import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SearchResultProfile = {
    id: string;
    name: string;
    bio: string;
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
                const searchTerm = `%${query}%`; // For ILIKE

                // 1. Search Freelancers (Profiles)
                // Explicitly selecting ONLY profile fields to avoid relationship error
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, name, bio, avatar_url')
                    .or(`name.ilike.${searchTerm},bio.ilike.${searchTerm}`);

                if (profileError) throw profileError;

                let allProfiles = (profileData || []).map((p: any) => ({
                    ...p,
                    skills: [] as string[]
                }));


                // 2. Also find freelancers by SKILL (separate query)
                const { data: skillData, error: skillError } = await supabase
                    .from('freelancer_skills')
                    .select('user_id, skill')
                    .ilike('skill', searchTerm);

                if (!skillError && skillData && skillData.length > 0) {
                    const userIds = skillData.map(s => s.user_id);
                    // Fetch profiles for these skills if not already found
                    const { data: skillProfiles } = await supabase
                        .from('profiles')
                        .select('id, name, bio, avatar_url')
                        .in('id', userIds);

                    if (skillProfiles) {
                        const newProfiles = skillProfiles.map((p: any) => ({
                            ...p,
                            skills: [] as string[]
                        }));

                        // Merge with existing matches
                        allProfiles = [...allProfiles, ...newProfiles];
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
                        allSkills.forEach((item: any) => {
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
                    .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);

                if (jobError) throw jobError;
                setJobs(jobData || []);

            } catch (err: any) {
                console.error("Search failed:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(performSearch, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    return { freelancers, jobs, loading, error };
};
