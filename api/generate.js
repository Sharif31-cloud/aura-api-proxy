const fetch = require('node-fetch');

module.exports = async (req, res) => {
    // ─── ONLY ACCEPT POST ───
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // 1. Verify the request comes from YOUR app
        const token = req.headers['x-app-token'];
        if (token !== process.env.APP_TOKEN) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 2. Read secret key from environment (never in code)
        const API_KEY = process.env.GEMINI_API_KEY;
        const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

        // 3. Build the real Gemini URL
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        // 4. Forward the request to Gemini
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        // 5. Return Gemini's response to the app
        return res.status(200).json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
};