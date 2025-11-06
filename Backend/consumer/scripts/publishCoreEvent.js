#!/usr/bin/env node
require('dotenv').config();
const amqp = require('amqplib');

const RABBIT_URL = process.env.RABBIT_URL;
const EXCHANGE_NAME = process.env.EXCHANGE_NAME || 'letterboxd_exchange';

if (!RABBIT_URL) {
    console.error('[publishCoreEvent] Faltan credenciales: RABBIT_URL no está definido en el .env');
    process.exit(1);
}

function arg(name, def) {
    const v = process.argv.find(a => a.startsWith(`--${name}=`));
    if (!v) return def;
    return v.split('=')[1];
}

const rk = process.argv[2] || 'peliculas.pelicula.creada';
const id = Number(arg('id', '29'));
const titulo = arg('titulo', 'Pepe');
const poster = arg('poster', '/uploads/demo_poster.jpg');

function sampleMoviePayload(kind) {
    const base = {
        type: kind === 'borrada' ? 'peliculas.borrada' : (kind === 'actualizada' ? 'peliculas.actualizada' : 'peliculas.creada'),
        source: '/api/peliculas',
        datacontenttype: 'application/json',
        data: {
            id,
            titulo,
            poster
        }
    };
    return { data: base };
}

function inferKindFromRoutingKey(routingKey) {
    if (routingKey.endsWith('.borrada')) return 'borrada';
    if (routingKey.endsWith('.actualizada')) return 'actualizada';
    return 'creada';
}

async function publish() {
    const kind = inferKindFromRoutingKey(rk);
    const payload = sampleMoviePayload(kind);

    const conn = await amqp.connect(RABBIT_URL);
    try {
        const ch = await conn.createChannel();
        await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });

        const body = Buffer.from(JSON.stringify(payload));
        ch.publish(EXCHANGE_NAME, rk, body, {
            contentType: 'application/json',
            persistent: true
        });

        console.log(`[publishCoreEvent] Enviado -> exchange=${EXCHANGE_NAME} rk=${rk}`);
        console.log(JSON.stringify(payload, null, 2));

        setTimeout(() => {
            ch.close();
            conn.close();
            process.exit(0);
        }, 100);
    } catch (e) {
        console.error('[publishCoreEvent] Error publicando:', e.message);
        process.exit(1);
    }
}

publish();
