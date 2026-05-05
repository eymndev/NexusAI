exports.handler = async (event, context) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const { username, password } = body;

        // Default to admin/1234 if no environment variables are set in Netlify
        const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1234";

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, token: "nexus_auth_token_ok" })
            };
        } else {
            return {
                statusCode: 401,
                body: JSON.stringify({ success: false, error: "Hatalı kullanıcı adı veya şifre!" })
            };
        }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
