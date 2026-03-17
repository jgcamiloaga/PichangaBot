import { StringSelectMenuInteraction, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';
import { getRandomFootballImage } from '../services/unsplash.service';
import { extractUnixFromDiscordTimestamp, formatDateForInput } from '../services/validation.service';

export const handleSelectMenus = async (interaction: StringSelectMenuInteraction) => {
    if (interaction.customId === 'sel_edit_match') {
        const selectedOption = interaction.values[0];

        if (!interaction.message.reference?.messageId) {
            await interaction.reply({ content: 'No pude encontrar el partido original.', ephemeral: true });
            return;
        }

        try {
            const originalMatchMessage = await interaction.channel?.messages.fetch(interaction.message.reference.messageId);

            if (!originalMatchMessage || !originalMatchMessage.embeds.length) {
                 await interaction.reply({ content: 'El mensaje del partido ya no existe.', ephemeral: true });
                 return;
            }
            
            const updatedEmbed = EmbedBuilder.from(originalMatchMessage.embeds[0]);

            if (selectedOption === 'edit_details') {
                const currentTitle = updatedEmbed.data.title?.replace('⚽ ', '').replace(' ⚽', '') || '';
                const dateFieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '🗓️ Fecha y Hora');
                let currentDate = '';
                if (dateFieldIndex !== undefined && dateFieldIndex !== -1 && updatedEmbed.data.fields) {
                    const unix = extractUnixFromDiscordTimestamp(updatedEmbed.data.fields[dateFieldIndex].value);
                    if (unix !== null) currentDate = formatDateForInput(new Date(unix * 1000));
                }

                const locFieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '📍 Ubicación');
                let currentLocation = (locFieldIndex !== undefined && locFieldIndex !== -1 && updatedEmbed.data.fields) 
                    ? updatedEmbed.data.fields[locFieldIndex].value 
                    : '';
                const linkMatch = currentLocation.match(/\[.*\]\((.*)\)/);
                if (linkMatch) currentLocation = linkMatch[1];

                const spotsFieldIdx = updatedEmbed.data.fields?.findIndex(field => field.name === '👥 Cupos Totales');
                const spotsRaw = (spotsFieldIdx !== undefined && spotsFieldIdx !== -1 && updatedEmbed.data.fields)
                    ? updatedEmbed.data.fields[spotsFieldIdx].value
                    : '';
                const currentSpots = spotsRaw.includes('/') ? spotsRaw.split('/')[1].replace(/\*/g, '').trim() : spotsRaw.replace(/\*/g, '').trim();

                const modal = new ModalBuilder()
                    .setCustomId(`modal_edit_match_${originalMatchMessage.id}`)
                    .setTitle('Editar Pichanga');

                const nameInput = new TextInputBuilder().setCustomId('input_edit_name').setLabel("Nombre del encuentro").setStyle(TextInputStyle.Short).setValue(currentTitle).setRequired(true);
                const dateInput = new TextInputBuilder().setCustomId('input_edit_datetime').setLabel("Fecha y Hora").setStyle(TextInputStyle.Short).setValue(currentDate).setRequired(true);
                const locInput = new TextInputBuilder().setCustomId('input_edit_location').setLabel("Ubicación (Lugar o Link)").setStyle(TextInputStyle.Short).setValue(currentLocation).setRequired(true);
                const spotsInput = new TextInputBuilder().setCustomId('input_edit_spots').setLabel("¿Cuántos jugadores en total?").setStyle(TextInputStyle.Short).setValue(currentSpots).setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(dateInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(locInput),
                    new ActionRowBuilder<TextInputBuilder>().addComponents(spotsInput)
                );

                await interaction.showModal(modal);
                return;

            } else if (selectedOption === 'change_image') {
                await interaction.deferUpdate();
                try {
                    const newImageUrl = await getRandomFootballImage();
                    updatedEmbed.setImage(newImageUrl);
                    await originalMatchMessage.edit({ embeds: [updatedEmbed] });
                    await interaction.editReply({ content: '✅ Imagen actualizada correctamente en el partido.', components: [] });
                } catch (imgError) {
                    console.error('Error al cambiar imagen:', imgError);
                    await interaction.editReply({ content: '❌ Hubo un error al obtener la imagen. Inténtalo de nuevo en unos momentos.', components: [] });
                }
                return;
            }
        } catch (e) {
            console.error('Error en sel_edit_match:', e);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Hubo un error al acceder al mensaje del partido.', ephemeral: true });
            }
        }
    }
};
