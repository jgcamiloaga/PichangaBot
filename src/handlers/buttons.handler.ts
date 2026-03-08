import { ButtonInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { getNickname, refreshPlayerListNicknames } from '../services/nickname.service';

export const handleButtons = async (interaction: ButtonInteraction) => {
    const originalEmbed = interaction.message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(originalEmbed);

    const fieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '📋 Lista de Jugadores');
    const spotsFieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '👥 Cupos Totales');

    if (fieldIndex !== undefined && fieldIndex !== -1 && updatedEmbed.data.fields) {
        let currentPlayers = updatedEmbed.data.fields[fieldIndex].value;
        const userMention = `<@${interaction.user.id}>`;

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
                const maxSpotsStr = updatedEmbed.data.fields[spotsFieldIndex].value;
                const maxSpots = parseInt(maxSpotsStr.replace(/\*/g, ''), 10);

                const currentPlayersCount = currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!'
                    ? 0
                    : currentPlayers.split('\n').length;

                if (!isNaN(maxSpots) && currentPlayersCount >= maxSpots) {
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

            if (currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!') {
                currentPlayers = `• ${playerEntry}`;
            } else {
                currentPlayers += `\n• ${playerEntry}`;
            }
        }
        else if (interaction.customId === 'btn_leave') {
            if (!currentPlayers.includes(`• ${userMention}`)) {
                await interaction.reply({ content: 'No estás en la lista, no puedes bajarte. 😅', ephemeral: true });
                return;
            }

            currentPlayers = currentPlayers
                .split('\n')
                .filter(p => !p.includes(userMention))
                .join('\n')
                .trim();

            if (currentPlayers === '') {
                currentPlayers = 'Nadie se ha inscrito aún... ¡Sé el primero!';
            }
        }
        else if (interaction.customId === 'btn_add_guests') {
            if (!currentPlayers.includes(`• ${userMention}`)) {
                await interaction.reply({ content: '¡Tienes que apuntarte tú primero dándole a "Me apunto!" antes de llevar invitados! ⚽', ephemeral: true });
                return;
            }

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
