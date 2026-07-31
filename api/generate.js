// ─── THIS RUNS ON THE EDGE (25s timeout instead of 10s) ───
export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    // Only accept POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 1. Verify app token
        const token = req.headers.get('x-app-token');
        if (token !== process.env.APP_TOKEN) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 2. Read config from environment variables
        const API_KEY = process.env.GEMINI_API_KEY;
        const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. Build Gemini URL
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        // 4. Read the request body from the app
        const body = await req.json();

        // 5. Forward to Gemini
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        // 6. Return Gemini's response to the app
        const data = await response.json();

        return new Response(JSON.stringify(data), {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}