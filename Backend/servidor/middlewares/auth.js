const jwt = require("jsonwebtoken");
const jwkToPem = require("jwk-to-pem");
const User = require("../models/User");

// Public JWK provided by Users service (RS256)
const USERS_JWK = {
    kty: "RSA",
    n: "t-hf3PP1_61OKyELI-ke6NgnZF7SSTv-mzL41-p5tsrGvSKGLodoNeiDBZtSmZnP5yYyBT3OATZSV-K8ezmkIrEXH09sKdpFhQ41z0SvXemIIfcQFOfJh11k_lMXzrdA_ahRCe59B0RdPH9hXyBQ8TMTL2sTpeRBY0y1NJsulX1qLf40DdJUaClrn-j3Omn3QHRwQF3k1lVD5AtpWcUWPMLuELnGFMO8P7QoCqGrUef1dd9zh2KcdI0DxNS7zrwv06_IlPK5CveE5ZQmJ3_E--pwBkJxjYwGQmRzbHuYVnMIFdD1ErZGzWoQ-IRNACToQQRRWLuod7GQ3bn_tydAYQ",
    e: "AQAB",
    alg: "RS256",
    use: "sig",
    kid: "users-rs256-v1",
};

let PEM;
function getPublicKey() {
    if (!PEM) {
        PEM = jwkToPem(USERS_JWK);
    }
    return PEM;
}

// Express middleware to authenticate Bearer access tokens
async function authenticateJWT(req, res, next) {
    try {
        const auth = req.headers["authorization"] || "";
        const token = auth.startsWith("Bearer ")
            ? auth.substring("Bearer ".length)
            : null;
        if (!token) {
            return res.status(401).json({ error: "Token de autorización faltante" });
        }

        const key = getPublicKey();
        const decoded = jwt.verify(token, key, { algorithms: ["RS256"] });

        // Attach user to request
        req.user = decoded;
        next();
    } catch (err) {
        console.error("Auth error:", err.message);
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}

module.exports = {
    authenticateJWT,
    getPublicKey,
    // Resuelve (si existe) el usuario local asociado al token y expone claims
    attachActorFromToken: async function attachActorFromToken(req, res, next) {
        try {
            if (!req.user) return res.status(401).json({ error: "No autenticado" });

            const claims = req.user || {};
            const username = String(claims.sub || "");
            const email = String(claims.email || "").toLowerCase();
            const externalUserId = (claims.user_id !== undefined && claims.user_id !== null)
                ? Number(claims.user_id)
                : undefined;
            const avatar_url = claims.image_url || null;

            // Importante: NO creamos usuarios aquí. Solo resolvemos si ya existe localmente.
            let user = null;
            // 1) Intentar por user_id externo
            if (Number.isFinite(externalUserId)) {
                user = await User.findOne({ user_id: externalUserId });
            }
            // 2) Fallback por username/email
            if (!user && username) user = await User.findOne({ username });
            if (!user && email) user = await User.findOne({ email });

            if (!user) {
                return res.status(401).json({ error: "No se pudo resolver el usuario local" });
            }

            req.actor = {
                mongo_id: user ? user._id.toString() : undefined,
                username: user ? user.username : username || undefined,
                email: user ? user.email : email || undefined,
                external_user_id: externalUserId,
                role: claims.role,
                permissions: claims.permissions || [],
                claims,
            };

            return next();
        } catch (err) {
            console.error("attachActorFromToken error:", err);
            return res.status(500).json({ error: "Error resolviendo el usuario de la sesión" });
        }
    },
};
