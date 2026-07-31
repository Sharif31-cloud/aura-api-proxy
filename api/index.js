export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    const API_KEY = process.env.GEMINI_API_KEY;
    const maskedKey = API_KEY ? API_KEY.substring(0, 6) + '...' + API_KEY.substring(API_KEY.length - 4) : 'NOT SET';

    return new Response(JSON.stringify({
        status: 'Aura API Proxy is running ✅',
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash (default)',
        apiKey: maskedKey,
        timeout: '25 seconds (Edge)',
        endpoints: {
            generate: '/api/generate'
        }
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
}