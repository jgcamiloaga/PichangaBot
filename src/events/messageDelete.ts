import { Client, Events } from 'discord.js';
import { deleteActiveMatch } from '../services/match.service';

export function setupMessageDeleteEvent(client: Client) {
    client.on(Events.MessageDelete, async (message) => {
        if (message.id) {
            await deleteActiveMatch(message.id);
        }
    });
}
