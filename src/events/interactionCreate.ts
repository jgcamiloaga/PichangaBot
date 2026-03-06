import { Client, Events } from 'discord.js';
import { handleCommands } from '../handlers/commands.handler';
import { handleButtons } from '../handlers/buttons.handler';
import { handleModals } from '../handlers/modals.handler';
import { handleSelectMenus } from '../handlers/select-menus.handler';

export function setupInteractionCreateEvent(client: Client) {
    client.on(Events.InteractionCreate, async (interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                await handleCommands(interaction);
            } else if (interaction.isButton()) {
                await handleButtons(interaction);
            } else if (interaction.isStringSelectMenu()) {
                await handleSelectMenus(interaction);
            } else if (interaction.isModalSubmit()) {
                await handleModals(interaction);
            }
        } catch (error) {
            console.error('Unhandled Interaction Error:', error);
        }
    });
}
