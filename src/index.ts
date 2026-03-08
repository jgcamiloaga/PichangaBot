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

client.login(config.discordToken).catch(error => {
    console.error('[Discord Error] No se pudo iniciar sesión en Discord:', error);
});

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('PichangaBot está vivo y pateando! ⚽'));

app.listen(port, () => {
    console.log(`[Express] Servidor web escuchando en el puerto ${port}`);
});