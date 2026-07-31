const API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const APP_TOKEN = Deno.env.get("APP_TOKEN") || "aura-secret-2025";

Deno.serve(async (req: Request) => {
    const url = new URL(req.url);

    // ─── HEALTH CHECK ───
    if (url.pathname === "/") {
        return new Response(JSON.stringify({
            status: "Aura API Proxy is running ✅",
            endpoints: { key: "/api/key", generate: "/api/generate" }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // ─── KEY FETCH: App gets the key, then calls Gemini directly ───
    if (url.pathname === "/api/key" && req.method === "GET") {
        const token = req.headers.get("x-app-token");
        if (token !== APP_TOKEN) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 403,
                headers: { "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            apiKey: API_KEY,
            model: MODEL
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // ─── PROXY: Still available as fallback ───
    if (url.pathname === "/api/generate" && req.method === "POST") {
        try {
            const token = req.headers.get("x-app-token");
            if (token !== APP_TOKEN) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 403,
                    headers: { "Content-Type": "application/json" }
                });
            }

            if (!API_KEY) {
                return new Response(JSON.stringify({ error: "API key not configured" }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

            const body = await req.json();

            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: { "Content-Type": "application/json" }
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
    });
});