const fetch = global.fetch || require('node-fetch');
const jwt = require('jsonwebtoken');
const { getPublicKey } = require('../middlewares/auth');

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

        // Optionally verify access token now and include profile
        let profile = null;
        try {
            const key = getPublicKey();
            profile = jwt.verify(data.access_token, key, { algorithms: ['RS256'] });
        } catch (_) {
            // ignore, token might still be valid for downstream; we just can't decode
        }

        return res.status(200).json({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            token_type: data.token_type || 'bearer',
            expires_in: 1800, // 30 minutes as per spec
            profile
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
