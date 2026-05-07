let globalKnowledgeBase = [];

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ knowledge: globalKnowledgeBase })
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            if (body.text) {
                globalKnowledgeBase.push(body.text);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, message: "Bilgi eklendi!" })
                };
            } else {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "Text is required" }) };
            }
        } catch (err) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
        }
    }

    return { statusCode: 405, headers, body: "Method Not Allowed" };
};
