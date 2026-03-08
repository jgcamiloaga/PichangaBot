import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/env';
import { setupReadyEvent } from './events/ready';
import { setupInteractionCreateEvent } from './events/interactionCreate';

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

setupReadyEvent(client);
setupInteractionCreateEvent(client);

client.login(config.discordToken);