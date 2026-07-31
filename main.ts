import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_KEY = Deno.env.get("GEMINI_API_KEY");
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const APP_TOKEN = Deno.env.get("APP_TOKEN") || "aura-secret-2025";

serve(async (req: Request) => {
    const url = new URL(req.url);

    // ─── HEALTH CHECK ───
    if (url.pathname === "/") {
        const maskedKey = API_KEY
            ? API_KEY.substring(0, 6) + "..." + API_KEY.substring(API_KEY.length - 4)
            : "NOT SET";

        return new Response(JSON.stringify({
            status: "Aura API Proxy is running ✅",
            model: MODEL,
            apiKey: maskedKey,
            timeout: "60 seconds (Deno)",
            platform: "Deno Deploy",
            endpoints: { generate: "/api/generate" }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }

    // ─── MAIN PROXY ENDPOINT ───
    if (url.pathname === "/api/generate" && req.method === "POST") {
        try {
            // 1. Verify app token
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

            // 2. Build Gemini URL
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

            // 3. Read request body from app
            const body = await req.json();

            // 4. Forward to Gemini
            const response = await fetch(geminiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            // 5. Return Gemini's response
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

    // ─── 404 ───
    return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
    });
});