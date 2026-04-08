import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { saveNickname } from '../services/nickname.service';
import { refreshAllActiveMatchEmbeds } from '../services/match.service';

export const data = new SlashCommandBuilder()
    .setName('apodo')
    .setDescription('Define un apodo personalizado para que aparezca en las listas de partidos.')
    .addStringOption(option => 
        option
            .setName('texto')
            .setDescription('Tu apodo (ej. El goleador)')
            .setRequired(true)
            .setMaxLength(30)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', flags: 64 });
        return;
    }

    const nickname = interaction.options.getString('texto', true);
    
    try {
        await saveNickname(interaction.guild.id, interaction.user.id, nickname);
        await interaction.reply({ content: `✅ ¡Tu apodo ha sido guardado como **"${nickname}"**! A partir de ahora aparecerás así en las listas de las pichangas de este servidor.`, flags: 64 });
        await refreshAllActiveMatchEmbeds(interaction.client, interaction.guild.id);
    } catch (error) {
        console.error('Error al guardar el apodo:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Hubo un error al intentar guardar tu apodo. Inténtalo de nuevo más tarde.', flags: 64 });
        } else {
            await interaction.followUp({ content: 'Hubo un error interno al intentar propagar tu apodo.', flags: 64 });
        }
    }
}
