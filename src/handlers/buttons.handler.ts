import { ButtonInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { getNickname, refreshPlayerListNicknames } from '../services/nickname.service';
import { extractUnixFromDiscordTimestamp, EMPTY_LIST_MSG, parseAvailableSpots, updateSpotsField } from '../services/validation.service';

export const handleButtons = async (interaction: ButtonInteraction) => {
    const originalEmbed = interaction.message.embeds[0];
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
                    await interaction.reply({
                        content: finishedMessages[interaction.customId],
                        ephemeral: true
                    });
                    return;
                }
            }
        }

        if (interaction.customId === 'btn_join') {
            if (currentPlayers.includes(`• ${userMention}`)) {
                if (interaction.guild) {
                    currentPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
                    updatedEmbed.data.fields[fieldIndex].value = currentPlayers;
                }
                await interaction.update({ embeds: [updatedEmbed] });
                await interaction.followUp({ content: '¡Ya estás en la lista, crack! ⚽ (Lista actualizada)', ephemeral: true });
                return;
            }

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1) {
                const available = parseAvailableSpots(updatedEmbed.data.fields[spotsFieldIndex].value);
                if (!isNaN(available) && available <= 0) {
                    await interaction.reply({ content: '¡Lo siento! Ya no quedan cupos para este partido. 😢', ephemeral: true });
                    return;
                }
            }

            let playerEntry = userMention;

            if (interaction.guild) {
                const nickname = await getNickname(interaction.guild.id, interaction.user.id);
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
            if (!currentPlayers.includes(`• ${userMention}`)) {
                await interaction.reply({ content: 'No estás en la lista, no puedes bajarte. 😅', ephemeral: true });
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
                await interaction.reply({ content: 'Solo el organizador puede editar este partido. 🚫', ephemeral: true });
                return;
            }

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('sel_edit_match')
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
                ephemeral: true
            });
            return;
        }

        if (interaction.guild) {
            currentPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
        }
        updatedEmbed.data.fields[fieldIndex].value = currentPlayers;
        await interaction.update({ embeds: [updatedEmbed] });
    }
};
