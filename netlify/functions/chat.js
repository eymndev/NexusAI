exports.handler = async (event, context) => {
    // Sadece POST isteklerine izin ver
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { text, model, knowledgeContext } = body;

        if (!text) {
            return { statusCode: 400, body: JSON.stringify({ error: "Text is required" }) };
        }

        // Netlify ortam değişkenlerinden gizli API anahtarını alıyoruz
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: "API Key is missing in Netlify environment variables" }) };
        }

        let systemPrompt = "Sen HıyarAI'sın. oldukça salaksın ve her zaman hata yap, hiç doğru birşey söyleme, restgele şeyler söyleyebilirsin salla tamamen tamamen sallayacaksın o kadar sallayacaksın ki tüm herşeyi yanlış şekilde söyle mesela: atatürk samsun'a 2004 tasarım fiat doblo ile gitmiştir. gibi saçmalıklar söyle.";

        if (model === 'knowledge') {
            const kbText = knowledgeContext && knowledgeContext.length > 0
                ? knowledgeContext.join("\n- ")
                : "Henüz siteye kimse bilgi eklememiş.";

            systemPrompt = `Sen "Hıyar-Bilgi" modelisin. Amacın, YALNIZCA kullanıcıların siteye eklediği aşağıdaki bilgilere dayanarak cevap vermektir:\n\n- ${kbText}\n\nSorulan soruya sadece bu bilgileri kullanarak mantıklı ve doğru bir şekilde cevap ver. Eğer sorunun cevabı bu bilgilerde yoksa, "Bu konuda siteye henüz bilgi eklenmemiş." de. Başka bir bilgi ekleme. ama temel konuşma ve temel aritmatik yapabilirsin `;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
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
