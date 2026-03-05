import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { removeNickname, refreshPlayerListNicknames } from '../services/nickname.service';
import { getActiveMatches } from '../services/match.service';

export const data = new SlashCommandBuilder()
    .setName('apodo-borrar')
    .setDescription('Borra tu apodo personalizado y vuelve a usar tu mención estándar en las listas de este servidor.');

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', ephemeral: true });
        return;
    }
    
    try {
        removeNickname(interaction.guild.id, interaction.user.id);
        await interaction.reply({ content: `✅ ¡Tu apodo ha sido eliminado correctamente! A partir de ahora aparecerás con tu nombre estándar de Discord en las listas de este servidor.`, ephemeral: true });

        const activeMatches = getActiveMatches(interaction.guild.id);
        for (const matchDef of activeMatches) {
            try {
                const channel = interaction.client.channels.cache.get(matchDef.channelId) || await interaction.client.channels.fetch(matchDef.channelId);
                if (channel && channel.isTextBased()) {
                    const textChannel = channel as TextChannel;
                    const fetchResult = await textChannel.messages.fetch({ message: matchDef.messageId, force: true });
                    const matchMsg = Array.isArray(fetchResult) ? null : fetchResult;

                    if (matchMsg && matchMsg.embeds.length > 0) {
                        const embed = EmbedBuilder.from(matchMsg.embeds[0]);
                        const fieldIndex = embed.data.fields?.findIndex(f => f.name === '📋 Lista de Jugadores');

                        if (fieldIndex !== undefined && fieldIndex !== -1 && embed.data.fields) {
                            const currentPlayers = embed.data.fields[fieldIndex].value;
                            const newPlayers = refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
                            
                            if (currentPlayers !== newPlayers) {
                                console.log(`[Apodo-Borrar] Actualizando embed del mensaje ${matchDef.messageId}`);
                                const updatedFields = embed.data.fields.map(f => {
                                    if (f.name === '📋 Lista de Jugadores') {
                                        return { ...f, value: newPlayers };
                                    }
                                    return f;
                                });
                                embed.setFields(updatedFields);

                                await matchMsg.edit({ embeds: [embed] });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error actualizando partido activo ${matchDef.messageId}:`, err);
            }
        }
    } catch (error) {
        console.error('Error al borrar el apodo:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Hubo un error al intentar borrar tu apodo. Inténtalo de nuevo más tarde.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'Hubo un error interno al intentar propagar tu cambio.', ephemeral: true });
        }
    }
}
