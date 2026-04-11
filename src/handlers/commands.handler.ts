import { ChatInputCommandInteraction } from 'discord.js';
import * as commandCreateMatch from '../commands/create-match';
import * as commandApodo from '../commands/apodo';
import * as commandApodoBorrar from '../commands/apodo-borrar';
import * as commandConfigurarRol from '../commands/configurar-rol';

export const handleCommands = async (interaction: ChatInputCommandInteraction) => {
    if (interaction.commandName === 'crear-partido') {
        try {
            await commandCreateMatch.execute(interaction);
        } catch (error) {
            console.error('Error in crear-partido:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Hubo un error ejecutando el comando crear-partido.', flags: 64 });
            }
        }
    } else if (interaction.commandName === 'apodo') {
        try {
            await commandApodo.execute(interaction);
        } catch (error) {
             console.error('Error in apodo:', error);
             if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: 'Hubo un error ejecutando el comando apodo.', flags: 64 });
             }
        }
    } else if (interaction.commandName === 'apodo-borrar') {
        try {
            await commandApodoBorrar.execute(interaction);
        } catch (error) {
             console.error('Error in apodo-borrar:', error);
             if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: 'Hubo un error ejecutando el comando apodo-borrar.', flags: 64 });
             }
        }
    } else if (interaction.commandName === 'configurar-rol') {
        try {
            await commandConfigurarRol.execute(interaction);
        } catch (error) {
             console.error('Error in configurar-rol:', error);
             if (!interaction.replied && !interaction.deferred) {
                 await interaction.reply({ content: 'Hubo un error ejecutando el comando configurar-rol.', flags: 64 });
             }
        }
    }
};
