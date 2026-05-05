exports.handler = async (event, context) => {
    // Sadece POST isteklerine izin ver
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { text } = body;

        if (!text) {
            return { statusCode: 400, body: JSON.stringify({ error: "Text is required" }) };
        }

        // Netlify ortam değişkenlerinden gizli API anahtarını alıyoruz
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "API Key is missing in Netlify environment variables" }) };
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: text }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return { statusCode: response.status, body: JSON.stringify(data) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                reply: data.candidates[0].content.parts[0].text
            })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
