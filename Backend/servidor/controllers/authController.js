const fetch = global.fetch || require('node-fetch');
const jwt = require('jsonwebtoken');
const { getPublicKey } = require('../middlewares/auth');
const User = require('../models/User');

const USERS_BASE_URL = process.env.USERS_BASE_URL || 'http://users-prod-alb-1703954385.us-east-1.elb.amazonaws.com/api/v1';

// POST /api/auth/login
async function login(req, res) {
    try {
        const { username, password, grant_type = 'password' } = req.body || {};
        if (!username || !password) {
            return res.status(400).json({ error: 'username y password son requeridos' });
        }

        const url = `${USERS_BASE_URL}/auth/login`;
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        const body = new URLSearchParams({ grant_type, username, password }).toString();

        const resp = await fetch(url, { method: 'POST', headers, body });
        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            return res.status(resp.status).json({ error: data.error || 'Error de autenticación' });
        }

        // Verificar o decodificar el token para extraer claims
        let profile = null;
        let token_verified = false;
        try {
            const key = getPublicKey();
            profile = jwt.verify(data.access_token, key, { algorithms: ['RS256'] });
            token_verified = true;
        } catch (_) {
            try { profile = jwt.decode(data.access_token) || null; } catch (_) {}
        }

        // Sincronizar el usuario en MongoDB (idempotente)
        let dbUser;
        try {
            if (profile && (profile.user_id != null || profile.sub)) {
                const normalized = normalizeProfile(profile);
                if (normalized.user_id != null && normalized.username && normalized.email) {
                    dbUser = await upsertUser(normalized);
                }
            }
        } catch (e) {
            console.error('No se pudo sincronizar el usuario en MongoDB:', e?.message || e);
        }

        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type || 'bearer',
            expires_in: 1800, // 30 minutes as per spec
            profile,
            user: dbUser ? serializeUser(dbUser) : undefined,
            token_verified
        });
    } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// POST /api/auth/refresh
async function refresh(req, res) {
    try {
        const { refresh_token } = req.body || {};
        if (!refresh_token) {
            return res.status(400).json({ error: 'refresh_token es requerido' });
        }

        const url = `${USERS_BASE_URL}/auth/refresh`;
        const headers = { 'Content-Type': 'application/json' };
        const body = JSON.stringify({ refresh_token });

        const resp = await fetch(url, { method: 'POST', headers, body });
        const data = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            return res.status(resp.status).json({ error: data.error || 'No se pudo refrescar el token' });
        }

        return res.status(200).json({
            access_token: data.access_token,
            token_type: data.token_type || 'bearer'
        });
    } catch (err) {
        console.error('refresh error', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
}

// GET /api/auth/me - validate current token and return claims
async function me(req, res) {
    try {
        // It will be populated by authenticateJWT middleware
        return res.status(200).json({ user: req.user });
    } catch (err) {
        return res.status(500).json({ error: 'Error interno' });
    }
}

module.exports = {
    login,
    refresh,
    me
};

// ===== Helpers =====
function normalizeProfile(profile) {
    const user_id = profile.user_id != null ? Number(profile.user_id) : undefined;
    const usernameClaim = (profile.sub || profile.username || '').toString().trim();
    const emailClaim = (profile.email || '').toString().toLowerCase().trim();
    const avatar_url = (profile.image_url || profile.avatar_url || null) || null;

    const username = usernameClaim || (emailClaim ? emailClaim.split('@')[0] : undefined);

    return { user_id, username, email: emailClaim, avatar_url };
}

async function upsertUser({ user_id, username, email, avatar_url }) {
    if (user_id == null) return null;

    const update = {
        $set: {
            username,
            email,
            avatar_url: avatar_url ?? null
        },
        $setOnInsert: {
            created_at: new Date()
        }
    };

    const doc = await User.findOneAndUpdate(
        { user_id },
        update,
        { new: true, upsert: true, runValidators: true }
    );
    return doc;
}

function serializeUser(u) {
    return {
        id: u._id,
        user_id: u.user_id,
        username: u.username,
        email: u.email,
        avatar_url: u.avatar_url,
        created_at: u.created_at
    };
}
