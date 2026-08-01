export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // The Android app sends the exact JSON payload in req.body
        const requestBody = req.body;

        // Using your exact model name that was working
        const modelName = "gemini-3.1-flash-lite"; 
        const apiKey = process.env.GEMINI_API_KEY; // Vercel will read this from Environment Variables

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Send the Gemini response back to your Android app
        return res.status(200).json(data);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}