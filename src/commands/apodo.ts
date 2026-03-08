import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { saveNickname, refreshPlayerListNicknames } from '../services/nickname.service';
import { getActiveMatches } from '../services/match.service';

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
        await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', ephemeral: true });
        return;
    }

    const nickname = interaction.options.getString('texto', true);
    
    try {
        await saveNickname(interaction.guild.id, interaction.user.id, nickname);
        await interaction.reply({ content: `✅ ¡Tu apodo ha sido guardado como **"${nickname}"**! A partir de ahora aparecerás así en las listas de las pichangas de este servidor.`, ephemeral: true });

        const activeMatches = await getActiveMatches(interaction.guild.id);
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
                            const newPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
                            
                            if (currentPlayers !== newPlayers) {
                                console.log(`[Apodo] Actualizando embed del mensaje ${matchDef.messageId}`);
                                const updatedFields = embed.data.fields.map(f => {
                                    if (f.name === '📋 Lista de Jugadores') {
                                        return { ...f, value: newPlayers };
                                    }
                                    return f;
                                });
                                embed.setFields(updatedFields);

                                await matchMsg.edit({ embeds: [embed] });
                            } else {
                                console.log(`[Apodo] Sin cambios necesarios en mensaje ${matchDef.messageId}`);
                                console.log(`   -> Contenido actual: ${currentPlayers.replace(/\n/g, '\\n')}`);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`Error actualizando partido activo ${matchDef.messageId}:`, err);
            }
        }
    } catch (error) {
        console.error('Error al guardar el apodo:', error);
        if (!interaction.replied) {
            await interaction.reply({ content: 'Hubo un error al intentar guardar tu apodo. Inténtalo de nuevo más tarde.', ephemeral: true });
        } else {
            await interaction.followUp({ content: 'Hubo un error interno al intentar propagar tu apodo.', ephemeral: true });
        }
    }
}
