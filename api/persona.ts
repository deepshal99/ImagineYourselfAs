import { createClient } from '@supabase/supabase-js';

export default async function handler(request: Request) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    // Fallback metadata if persona not found or ID missing
    let title = "PosterMe - Cast Yourself in Blockbuster Movies with AI";
    let description = "Instant AI casting. Upload a selfie and become the star of Dune, Batman, Barbie, and more. No design skills needed.";
    let image = "https://posterme.app/personas/movie_batman.webp"; // Default generic image

    if (id) {
        try {
            // Connect to Supabase to fetch persona details
            // Note: We use process.env for server-side environment variables in Vercel
            // Fallback to hardcoded values if env vars are missing (for immediate functionality)
            const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://syemomuztccylkgjpjsy.supabase.co';
            const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZW1vbXV6dGNjeWxrZ2pwanN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Mzk4NDIsImV4cCI6MjA4MDAxNTg0Mn0.leWIAincqFnt7hzICS3f6rI6__O_KT8j2MBlY0HF_es';

            if (supabaseUrl && supabaseKey) {
                const supabase = createClient(supabaseUrl, supabaseKey);

                // Fetch persona
                const { data: persona, error } = await supabase
                    .from('discovered_personas')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (persona && !error) {
                    // Dynamic Metadata Copy
                    title = `${persona.name} Movie Poster - Starring You | PosterMe`;
                    description = `See yourself cast as ${persona.name}. Create this official-style movie poster instantly with PosterMe AI.`;
                    image = persona.cover;
                }
            }
        } catch (e) {
            console.error("Error fetching persona metadata:", e);
        }
    }

    // Fetch the actual index.html content (the application shell)
    // In Vercel serverless, we can fetch the deployment URL or read if available.
    // A robust way for SPAs is to fetch the origin's index.html
    const appUrl = url.origin;
    let html = "";

    try {
        const response = await fetch(`${appUrl}/index.html`);
        html = await response.text();
    } catch (e) {
        // Fallback: simple HTML if fetch fails (should rarely happen on same deployment)
        return new Response(`Error loading application`, { status: 500 });
    }

    // Inject Metadata
    // We use simple string replacement to overwrite the default tags in index.html

    // Replace Title
    html = html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
    html = html.replace(/<meta name="title" content=".*?">/, `<meta name="title" content="${title}">`);

    // Replace Description
    html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`);

    // Replace OG Tags
    html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`);
    html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`);
    html = html.replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${image}">`);
    html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url.href.replace('/api/persona?id=', '/persona/')}">`);

    // Replace Twitter Tags
    html = html.replace(/<meta property="twitter:title" content=".*?">/, `<meta property="twitter:title" content="${title}">`);
    html = html.replace(/<meta property="twitter:description" content=".*?">/, `<meta property="twitter:description" content="${description}">`);
    html = html.replace(/<meta property="twitter:image" content=".*?">/, `<meta property="twitter:image" content="${image}">`);
    html = html.replace(/<meta property="twitter:url" content=".*?">/, `<meta property="twitter:url" content="${url.href.replace('/api/persona?id=', '/persona/')}">`);

    return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}

export const config = {
    runtime: 'edge', // Use Edge Runtime for speed
};
