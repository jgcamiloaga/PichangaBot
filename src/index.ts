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

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('PichangaBot está vivo y pateando! ⚽'));

app.listen(port, () => {
    console.log(`[Express] Servidor web escuchando en el puerto ${port}`);
});

// Diagnóstico de variables de entorno
const token = process.env.DISCORD_TOKEN || config.discordToken;
console.log(`[Diagnóstico] DISCORD_TOKEN disponible: ${token ? `SÍ (inicia con ${token.substring(0, 10)}...)` : 'NO ❌ - Variable vacía!'}`);

if (!token) {
    console.error('[Error Fatal] No se encontró DISCORD_TOKEN. El bot no puede iniciar.');
    process.exit(1);
}

client.login(token).catch(error => {
    console.error('[Discord Error] No se pudo iniciar sesión en Discord:', error.message);
});