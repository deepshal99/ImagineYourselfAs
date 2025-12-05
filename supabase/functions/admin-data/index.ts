import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Admin emails - must match the frontend
const ADMIN_EMAILS = (Deno.env.get('ADMIN_EMAILS') || 'deepshal99@gmail.com')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify caller is authenticated
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // Create user-context client to verify the caller
        const userClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await userClient.auth.getUser(token);

        if (authError || !user) {
            throw new Error('Unauthorized: Invalid token');
        }

        // 2. Check if user is admin
        const callerEmail = user.email?.toLowerCase() || '';
        if (!ADMIN_EMAILS.includes(callerEmail)) {
            throw new Error('Forbidden: Admin access required');
        }

        console.log(`Admin access granted for: ${callerEmail}`);

        // 3. Create admin client with service_role for full access
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 4. Fetch all auth users
        const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers({
            perPage: 1000
        });

        if (usersError) {
            console.error('Error fetching auth users:', usersError);
            throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        // 5. Fetch user_credits data
        const { data: creditsData, error: creditsError } = await adminClient
            .from('user_credits')
            .select('*');

        if (creditsError) {
            console.error('Error fetching credits:', creditsError);
        }

        // 6. Fetch all creations for generation stats
        const { data: creationsData, error: creationsError } = await adminClient
            .from('creations')
            .select('*')
            .order('created_at', { ascending: false });

        if (creationsError) {
            console.error('Error fetching creations:', creationsError);
        }

        // 7. Fetch discovered_personas for persona management
        const { data: personasData, error: personasError } = await adminClient
            .from('discovered_personas')
            .select('*')
            .order('created_at', { ascending: true });

        if (personasError) {
            console.error('Error fetching personas:', personasError);
        }

        // 8. Build combined user data
        const creditsMap = new Map<string, any>();
        (creditsData || []).forEach((c: any) => {
            creditsMap.set(c.user_id, c);
        });

        // Count generations per user
        const generationCounts = new Map<string, { count: number; lastGen: string | null }>();
        (creationsData || []).forEach((c: any) => {
            const existing = generationCounts.get(c.user_id) || { count: 0, lastGen: null };
            existing.count++;
            if (!existing.lastGen || new Date(c.created_at) > new Date(existing.lastGen)) {
                existing.lastGen = c.created_at;
            }
            generationCounts.set(c.user_id, existing);
        });

        // Combine auth users with credits and generation data
        const users = (authUsers.users || []).map((authUser: any) => {
            const creditInfo = creditsMap.get(authUser.id);
            const genInfo = generationCounts.get(authUser.id);

            return {
                id: authUser.id,
                email: authUser.email || authUser.id.substring(0, 8) + '...',
                created_at: authUser.created_at,
                credits: creditInfo?.credits || 0,
                is_unlimited: creditInfo?.is_unlimited || false,
                generation_count: genInfo?.count || 0,
                last_generation: genInfo?.lastGen || null,
                user_metadata: {
                    full_name: authUser.user_metadata?.full_name,
                    avatar_url: authUser.user_metadata?.avatar_url
                }
            };
        }).sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // 9. Calculate stats
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const totalGenerations = creationsData?.length || 0;
        const generationsToday = (creationsData || []).filter(
            (c: any) => new Date(c.created_at) >= todayStart
        ).length;
        const generationsThisWeek = (creationsData || []).filter(
            (c: any) => new Date(c.created_at) >= weekStart
        ).length;
        const totalCreditsRemaining = (creditsData || []).reduce(
            (sum: number, c: any) => sum + (c.credits || 0), 0
        );

        const stats = {
            totalUsers: users.length,
            totalGenerations,
            totalCreditsConsumed: totalGenerations,
            totalCreditsRemaining,
            generationsToday,
            generationsThisWeek,
            cacheHitRate: 0,
            avgGenerationsPerUser: users.length > 0 ? totalGenerations / users.length : 0,
        };

        // 10. Build generations list with user emails
        const generations = (creationsData || []).map((creation: any) => {
            const userInfo = users.find((u: any) => u.id === creation.user_id);
            return {
                id: creation.id,
                user_id: creation.user_id,
                user_email: userInfo?.email || creation.user_id.substring(0, 8) + '...',
                persona_id: creation.persona_id,
                created_at: creation.created_at,
                image_url: creation.image_url,
            };
        });

        // 11. Return all data
        return new Response(JSON.stringify({
            users,
            stats,
            generations,
            personas: personasData || [],
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error: any) {
        console.error('Admin data error:', error);

        const status = error.message.includes('Forbidden') ? 403
            : error.message.includes('Unauthorized') ? 401
                : 500;

        return new Response(JSON.stringify({
            error: error.message,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status
        });
    }
});
