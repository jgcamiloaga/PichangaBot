import { Client, Events, REST, Routes } from 'discord.js';
import { config } from '../config/env';
import * as commandCreateMatch from '../commands/create-match';
import * as commandApodo from '../commands/apodo';
import * as commandApodoBorrar from '../commands/apodo-borrar';

export function setupReadyEvent(client: Client) {
    client.once(Events.ClientReady, async () => {
        console.log(`🟢 System online! Bot ${client.user?.tag} is ready.`);

        const rest = new REST({ version: '10' }).setToken(config.discordToken);
        try {
            console.log('⏳ Registering Slash Commands...');
            await rest.put(
                Routes.applicationCommands(client.user!.id),
                { body: [
                    commandCreateMatch.data.toJSON(),
                    commandApodo.data.toJSON(),
                    commandApodoBorrar.data.toJSON()
                ] },
            );
            console.log('✅ Commands registered successfully!');
        } catch (error) {
            console.error('❌ Error registering commands:', error);
        }
    });
}
