import { renderHook, waitFor } from '@testing-library/react';
import { useSearch } from '../hooks/useSearch';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Helper to mock Supabase query builder
const mockQueryBuilder = (data: any, error: any = null) => {
    const builder: any = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ data, error })),
    };
    return builder;
};

describe('useSearch', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should return empty results for empty query', async () => {
        const { result } = renderHook(() => useSearch(''));

        await waitFor(() => {
            expect(result.current.freelancers).toEqual([]);
            expect(result.current.jobs).toEqual([]);
            expect(result.current.loading).toBe(false);
        });
    });

    it('should fetch results for valid query', async () => {
        vi.useFakeTimers();
        const mockProfile = { id: '1', name: 'John', bio: 'Dev', avatar_url: null };
        const mockSkills = [{ user_id: '1', skill: 'ROS' }];
        const mockJobs = [{ id: '1', title: 'ROS Job', description: 'Desc', budget: 100, required_skills: ['ROS'], created_at: '2025-01-01' }];

        // Mock the chain for profiles
        const fromMock = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
            if (table === 'profiles') {
                return mockQueryBuilder([mockProfile]);
            }
            if (table === 'freelancer_skills') {
                // First call finds skills for creating userIds list
                // Second call populates skills for found users
                return mockQueryBuilder(mockSkills);
            }
            if (table === 'jobs') {
                return mockQueryBuilder(mockJobs);
            }
            return mockQueryBuilder([]);
        });

        const { result } = renderHook(() => useSearch('ROS'));

        // Fast-forward debounce
        vi.advanceTimersByTime(500);
        vi.useRealTimers();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.freelancers).toHaveLength(1);
            expect(result.current.freelancers[0].name).toBe('John');
            expect(result.current.freelancers[0].skills).toContain('ROS'); // Check manual join
            expect(result.current.jobs).toHaveLength(1);
            expect(result.current.jobs[0].title).toBe('ROS Job');
        });

        fromMock.mockRestore();
    });
});
