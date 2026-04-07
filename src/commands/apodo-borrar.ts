import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { removeNickname } from '../services/nickname.service';
import { refreshAllActiveMatchEmbeds } from '../services/match.service';

export const data = new SlashCommandBuilder()
    .setName('apodo-borrar')
    .setDescription('Borra tu apodo personalizado y vuelve a usar tu mención estándar en las listas de este servidor.');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', flags: 64 });
        return;
    }
    
    try {
        await removeNickname(interaction.guild.id, interaction.user.id);
        await interaction.reply({ content: `✅ ¡Tu apodo ha sido eliminado correctamente! A partir de ahora aparecerás con tu nombre estándar de Discord en las listas de este servidor.`, flags: 64 });
        await refreshAllActiveMatchEmbeds(interaction.client, interaction.guild.id);
    } catch (error) {
        console.error('Error al borrar el apodo:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Hubo un error al intentar borrar tu apodo. Inténtalo de nuevo más tarde.', flags: 64 });
        } else {
            await interaction.followUp({ content: 'Hubo un error interno al intentar propagar tu cambio.', flags: 64 });
        }
    }
}
