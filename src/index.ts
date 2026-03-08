import { Client, GatewayIntentBits } from 'discord.js';
import express from 'express';
import { config } from './config/env';
import { setupReadyEvent } from './events/ready';
import { setupInteractionCreateEvent } from './events/interactionCreate';

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

setupReadyEvent(client);
setupInteractionCreateEvent(client);

// Capturar errores del WebSocket de Discord (token inválido, desconexiones, etc.)
client.on('error', (error) => {
    console.error('[Discord WebSocket Error]', error.message);
});

const discordToken = config.discordToken;
console.log(`[Diagnóstico] DISCORD_TOKEN -> longitud: ${discordToken.length} caracteres`);

if (!discordToken) {
    console.error('[Error Fatal] DISCORD_TOKEN está vacío. Verifica las variables de entorno en Render.');
} else {
    console.log('[Info] Intentando conectar con Discord...');

    const loginTimeout = setTimeout(() => {
        console.error('[Error Red] La conexión a Discord tardó más de 30s. Posible bloqueo de red en Render.');
    }, 30000);

    client.login(discordToken)
        .then(() => {
            clearTimeout(loginTimeout);
            console.log('[Info] Login enviado, esperando evento ready de Discord...');
        })
        .catch(error => {
            clearTimeout(loginTimeout);
            console.error('[Discord Error] No se pudo iniciar sesión:', error.message);
        });
}

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('PichangaBot está vivo y pateando! ⚽'));

app.listen(port, () => {
    console.log(`[Express] Servidor web escuchando en el puerto ${port}`);
});