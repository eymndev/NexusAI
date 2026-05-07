const fs = require('fs');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.tmpdir(), 'nexus_knowledge.json');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const getKnowledge = () => {
        try {
            if (fs.existsSync(dbPath)) {
                return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            }
        } catch (e) {
            console.error("Bilgi okuma hatası:", e);
        }
        return [];
    };

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ knowledge: getKnowledge() })
        };
    }

    if (event.httpMethod === 'POST') {
        try {
            const body = JSON.parse(event.body);
            if (body.text) {
                const data = getKnowledge();
                data.push(body.text);
                fs.writeFileSync(dbPath, JSON.stringify(data));

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
