import { ChatInputCommandInteraction } from 'discord.js';
import * as commandCreateMatch from '../commands/create-match';
import * as commandApodo from '../commands/apodo';
import * as commandApodoBorrar from '../commands/apodo-borrar';

export const handleCommands = async (interaction: ChatInputCommandInteraction) => {
    if (interaction.commandName === 'crear-partido') {
        try {
            await commandCreateMatch.execute(interaction);
        } catch (error) {
            console.error('Error in crear-partido:', error);
            await interaction.reply({ content: 'Hubo un error ejecutando el comando crear-partido.', ephemeral: true });
        }
    } else if (interaction.commandName === 'apodo') {
        try {
            await commandApodo.execute(interaction);
        } catch (error) {
             console.error('Error in apodo:', error);
             await interaction.reply({ content: 'Hubo un error ejecutando el comando apodo.', ephemeral: true });
        }
    } else if (interaction.commandName === 'apodo-borrar') {
        try {
            await commandApodoBorrar.execute(interaction);
        } catch (error) {
             console.error('Error in apodo-borrar:', error);
             await interaction.reply({ content: 'Hubo un error ejecutando el comando apodo-borrar.', ephemeral: true });
        }
    }
};
