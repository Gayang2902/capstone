const crypto = require('crypto');

let sessionId = null;
let aesKey = null;

function createSession() {
    sessionId = crypto.randomBytes(16).toString('hex');
    return sessionId;
}

async function handleRequest(req) {
    const { cmd, source, session_id, data } = req;

    switch (cmd) {
        case "derive_key":
            aesKey = crypto.createHash('sha256').update(data.password).digest('hex');
            return {
                status: "ok",
                message: "success",
                data: { AES_KEY: aesKey }
            };

        case "decrypt_db":
            if (!aesKey) return { status: "error", message: "no aes key", data: {} };
            return {
                status: "ok",
                message: "success",
                data: {}
            };

        case "get_password":
            return {
                status: "ok",
                message: "success",
                data: {
                    password: "wow!!!password"
                }
            };

        default:
            return {
                status: "error",
                message: "unknown command",
                data: {}
            };
    }
}

module.exports = { handleRequest };
