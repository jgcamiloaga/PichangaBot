import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/env';
import { setupReadyEvent } from './events/ready';
import { setupInteractionCreateEvent } from './events/interactionCreate';

// 1. Inicializamos el cliente del bot
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// 2. Cargamos los eventos modularizados
setupReadyEvent(client);
setupInteractionCreateEvent(client);

// 3. Conectar a Discord
client.login(config.discordToken);