import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/env';
import { setupReadyEvent } from './events/ready';
import { setupInteractionCreateEvent } from './events/interactionCreate';
import { setupMessageDeleteEvent } from './events/messageDelete';

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

setupReadyEvent(client);
setupInteractionCreateEvent(client);
setupMessageDeleteEvent(client);

client.on('error', (error) => {
    console.error('[Discord Error]', error.message);
});

client.login(config.discordToken).catch(error => {
    console.error('[Discord Error] No se pudo iniciar sesión:', error.message);
});