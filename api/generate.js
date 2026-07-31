const fetch = require('node-fetch');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const token = req.headers['x-app-token'];
        if (token !== process.env.APP_TOKEN) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const API_KEY = process.env.GEMINI_API_KEY;
        const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        // ─── AUTO RETRY (up to 3 times with delay) ───
        const maxRetries = 3;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req.body)
                });

                const data = await response.json();

                // ─── IF RATE LIMITED (429) → WAIT & RETRY ───
                if (response.status === 429) {
                    // Gemini tells us how long to wait
                    const retryDelay = data.error?.retryDelay 
                        ? parseFloat(data.error.retryDelay) * 1000 
                        : attempt * 10000; // fallback: 10s, 20s, 30s

                    console.log(`Rate limited. Attempt ${attempt}/${maxRetries}. Waiting ${Math.round(retryDelay/1000)}s...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    continue; // retry
                }

                // ─── IF OTHER ERROR → RETURN IT ───
                if (!response.ok) {
                    return res.status(response.status).json(data);
                }

                // ─── SUCCESS → RETURN DATA ───
                return res.status(200).json(data);

            } catch (fetchError) {
                lastError = fetchError;
                console.log(`Fetch error. Attempt ${attempt}/${maxRetries}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 3000));
            }
        }

        // All retries failed
        return res.status(500).json({ error: 'All retries failed', details: lastError?.message });

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ error: error.message });
    }
};