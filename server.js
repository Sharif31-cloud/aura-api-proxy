const express = require('express');
const fetch = require('node-fetch');
const app = express();

// ─── YOUR SECRET KEY (stored as env variable on Render, NEVER in code) ───
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// ─── SIMPLE APP TOKEN (so strangers can't abuse your server) ───
const APP_TOKEN = process.env.APP_TOKEN || 'aura-secret-2025';

app.use(express.json({ limit: '2mb' }));

// ─── HEALTH CHECK ───
app.get('/', (req, res) => {
    res.json({ status: 'Aura API Proxy is running ✅' });
});

// ─── MAIN PROXY ENDPOINT ───
app.post('/api/generate', async (req, res) => {
    try {
        // 1. Verify the request comes from YOUR app
        const token = req.headers['x-app-token'];
        if (token !== APP_TOKEN) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // 2. Build the real Gemini URL with the secret key
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        // 3. Forward the request to Gemini
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        // 4. Return Gemini's response to the app
        return res.json(data);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Aura proxy running on port ${PORT}`));