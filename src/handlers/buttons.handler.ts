import { ButtonInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, InteractionReplyOptions } from 'discord.js';
import { getNicknameCached, refreshPlayerListNicknames } from '../services/nickname.service';
import { extractUnixFromDiscordTimestamp, EMPTY_LIST_MSG, parseAvailableSpots, updateSpotsField } from '../services/validation.service';
import { withMessageLock } from '../services/lock.service';

export const handleButtons = async (interaction: ButtonInteraction) => {
  try {
        const ephemeralFlags = 64;
        const safeReply = async (options: InteractionReplyOptions) => {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply(options);
            }
        };
        const ensureDeferred = async () => {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.deferUpdate();
            }
        };
    const originalEmbed = interaction.message.embeds[0];
    if (!originalEmbed) {
        await safeReply({ content: 'Este mensaje no tiene un embed valido para actualizar.', flags: ephemeralFlags });
        return;
    }
    const updatedEmbed = EmbedBuilder.from(originalEmbed);

    const fieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '📋 Lista de Jugadores');
    const spotsFieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '👥 Cupos Totales');

    if (fieldIndex !== undefined && fieldIndex !== -1 && updatedEmbed.data.fields) {
        let currentPlayers = updatedEmbed.data.fields[fieldIndex].value;
        const userMention = `<@${interaction.user.id}>`;

        const isMatchAction = interaction.customId === 'btn_join' || interaction.customId === 'btn_leave' || interaction.customId === 'btn_add_guests';
        if (isMatchAction) {
            const dateFieldIndex = updatedEmbed.data.fields?.findIndex(f => f.name === '🗓️ Fecha y Hora');
            if (dateFieldIndex !== undefined && dateFieldIndex !== -1) {
                const dateFieldValue = updatedEmbed.data.fields[dateFieldIndex].value;
                const unix = extractUnixFromDiscordTimestamp(dateFieldValue);
                if (unix !== null && unix * 1000 < Date.now()) {
                    const finishedMessages: Record<string, string> = {
                        'btn_join':       '🔒 **Este partido ya ha terminado.** No puedes unirte a un partido finalizado.',
                        'btn_leave':      '🔒 **Este partido ya ha terminado.** No puedes bajarte de un partido finalizado.',
                        'btn_add_guests': '🔒 **Este partido ya ha terminado.** No puedes agregar invitados a un partido finalizado.',
                    };
                    await safeReply({
                        content: finishedMessages[interaction.customId],
                        flags: ephemeralFlags
                    });
                    return;
                }
            }
        }

        if (interaction.customId === 'btn_join') {
            await ensureDeferred();

            if (currentPlayers.includes(`• ${userMention}`)) {
                if (interaction.guild) {
                    currentPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
                    updatedEmbed.data.fields[fieldIndex].value = currentPlayers;
                }
                await interaction.editReply({ embeds: [updatedEmbed] });
                await interaction.followUp({ content: '¡Ya estás en la lista, crack! ⚽ (Lista actualizada)', flags: ephemeralFlags });
                return;
            }

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1) {
                const available = parseAvailableSpots(updatedEmbed.data.fields[spotsFieldIndex].value);
                if (!isNaN(available) && available <= 0) {
                    await interaction.followUp({ content: '¡Lo siento! Ya no quedan cupos para este partido. 😢', flags: ephemeralFlags });
                    return;
                }
            }

            let playerEntry = userMention;

            if (interaction.guild) {
                const nickname = await getNicknameCached(interaction.guild.id, interaction.user.id);
                if (nickname) {
                    playerEntry += ` (${nickname})`;
                }
            }

            if (currentPlayers === EMPTY_LIST_MSG) {
                currentPlayers = `• ${playerEntry}`;
            } else {
                currentPlayers += `\n• ${playerEntry}`;
            }

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1 && updatedEmbed.data.fields) {
                updatedEmbed.data.fields[spotsFieldIndex].value = updateSpotsField(updatedEmbed.data.fields[spotsFieldIndex].value, -1);
            }
        }
        else if (interaction.customId === 'btn_leave') {
            await ensureDeferred();

            if (!currentPlayers.includes(`• ${userMention}`)) {
                await interaction.followUp({ content: 'No estás en la lista, no puedes bajarte. 😅', flags: ephemeralFlags });
                return;
            }

            const allLines = currentPlayers.split('\n');
            const removedCount = allLines.filter(p => p.includes(userMention)).length;

            currentPlayers = allLines
                .filter(p => !p.includes(userMention))
                .join('\n')
                .trim();

            if (currentPlayers === '') {
                currentPlayers = EMPTY_LIST_MSG;
            }

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1 && updatedEmbed.data.fields) {
                updatedEmbed.data.fields[spotsFieldIndex].value = updateSpotsField(updatedEmbed.data.fields[spotsFieldIndex].value, removedCount);
            }
        }
        else if (interaction.customId === 'btn_add_guests') {
            const modal = new ModalBuilder()
                .setCustomId('modal_add_guests')
                .setTitle('Llevar Invitados');

            const countInput = new TextInputBuilder()
                .setCustomId('input_guests_count')
                .setLabel("¿Cuántos invitados extra llevas?")
                .setPlaceholder("Ej: 2")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(countInput);
            modal.addComponents(firstRow);

            await interaction.showModal(modal);
            return;
        }
        else if (interaction.customId.startsWith('btn_edit_')) {
            const organizerId = interaction.customId.replace('btn_edit_', '');
            if (interaction.user.id !== organizerId) {
                await interaction.reply({ content: 'Solo el organizador puede editar este partido. 🚫', flags: ephemeralFlags });
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`sel_edit_match:${interaction.message.id}`)
                .setPlaceholder('¿Qué deseas hacer?')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Editar Detalles del Partido')
                        .setDescription('Cambia nombre, fecha, lugar o cupos')
                        .setValue('edit_details')
                        .setEmoji('📝'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Cambiar Imagen de Portada')
                        .setDescription('Buscar otra foto aleatoria de Unsplash')
                        .setValue('change_image')
                        .setEmoji('🖼️')
                );

            const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

            await interaction.reply({
                content: '¿Qué opción te gustaría modificar en tu partido?',
                components: [selectRow],
                flags: ephemeralFlags
            });
            return;
        }

        await ensureDeferred();

        await withMessageLock(interaction.message.id, async () => {
            if (interaction.guild) {
                currentPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
            }
            if (!updatedEmbed.data.fields) {
                return;
            }
            updatedEmbed.data.fields[fieldIndex].value = currentPlayers;

            if (interaction.deferred) {
                await interaction.editReply({ embeds: [updatedEmbed] });
            } else {
                // Unlikely to reach here without being deferred or returned, but just in case
                await interaction.update({ embeds: [updatedEmbed] });
            }
        });
    }
  } catch (err: any) {
    console.error('Error en handleButtons:', err);
    try {
            const msg = { content: '❌ Ocurrió un error inesperado. Por favor intenta de nuevo.', flags: 64 };
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(msg);
      } else {
        await interaction.followUp(msg);
      }
    } catch { /* la interacción ya expiró, no hay nada que hacer */ }
  }
};
