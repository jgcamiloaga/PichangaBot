import { ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getRandomFootballImage } from '../services/unsplash.service';
import { refreshPlayerListNicknames } from '../services/nickname.service';
import { saveActiveMatch } from '../services/match.service';

export const handleModals = async (interaction: ModalSubmitInteraction) => {
    if (interaction.customId === 'modal_add_guests') {
        const guestsCountStr = interaction.fields.getTextInputValue('input_guests_count');
        const guestsCount = parseInt(guestsCountStr, 10);

        if (isNaN(guestsCount) || guestsCount <= 0) {
            await interaction.reply({ content: 'Por favor, ingresa un número válido mayor a 0. 😅', ephemeral: true });
            return;
        }

        if (!interaction.message) return;

        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed);

        const fieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '📋 Lista de Jugadores');
        const spotsFieldIndex = updatedEmbed.data.fields?.findIndex(field => field.name === '👥 Cupos Totales');

        if (fieldIndex !== undefined && fieldIndex !== -1 && updatedEmbed.data.fields) {
            let currentPlayers = updatedEmbed.data.fields[fieldIndex].value;
            const userMention = `<@${interaction.user.id}>`;

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1) {
                const maxSpotsStr = updatedEmbed.data.fields[spotsFieldIndex].value;
                const maxSpots = parseInt(maxSpotsStr.replace(/\*/g, ''), 10);

                const currentPlayersCount = currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!'
                    ? 0
                    : currentPlayers.split('\n').length;

                if (!isNaN(maxSpots)) {
                    const cuposRestantes = maxSpots - currentPlayersCount;
                    if (guestsCount > cuposRestantes) {
                        await interaction.reply({
                            content: `¡Lo siento! Solo quedan **${cuposRestantes}** cupos disponibles. No puedes llevar a ${guestsCount} invitados. 😢`,
                            ephemeral: true
                        });
                        return;
                    }
                }
            }

            if (currentPlayers === 'Nadie se ha inscrito aún... ¡Sé el primero!') {
                currentPlayers = '';
            }

            for (let i = 0; i < guestsCount; i++) {
                currentPlayers += (currentPlayers ? '\n' : '') + `• Invitado de ${userMention}`;
            }
            
            if (interaction.guild) {
                currentPlayers = refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
            }

            updatedEmbed.data.fields[fieldIndex].value = currentPlayers;

            if (interaction.isFromMessage()) {
                await interaction.update({ embeds: [updatedEmbed] });
            }
        }
        return;
    }

    const isCreate = interaction.customId === 'modal_create_match';
    const isEdit = interaction.customId.startsWith('modal_edit_match');

    if (isCreate || isEdit) {
        const prefix = isCreate ? 'input_match_' : 'input_edit_';
        const matchName = interaction.fields.getTextInputValue(`${prefix}name`);
        const datetime = interaction.fields.getTextInputValue(`${prefix}datetime`);
        const location = interaction.fields.getTextInputValue(`${prefix}location`);
        const spots = interaction.fields.getTextInputValue(`${prefix}spots`);

        const locationValue = location.startsWith('http://') || location.startsWith('https://')
            ? `[Ver en Google Maps](${location})`
            : location;

        const imageUrl = await getRandomFootballImage();

        const matchEmbed = new EmbedBuilder()
            .setAuthor({
                name: `🔥 Organizado por ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL() || undefined
            })
            .setTitle(`⚽ ${matchName.toUpperCase()} ⚽`)
            .setDescription('¡Preparate para el mejor partido de la semana! Revisa los detalles abajo y asegura tu cupo antes de que se acaben.')
            .setColor('#FF5733')
            .setImage(imageUrl)
            .addFields(
                { name: '🗓️ Fecha y Hora', value: `\`${datetime}\``, inline: true },
                { name: '📍 Ubicación', value: locationValue, inline: true },
                { name: '👥 Cupos Totales', value: `**${spots}**`, inline: true },
                { name: '📋 Lista de Jugadores', value: 'Nadie se ha inscrito aún... ¡Sé el primero!' }
            )
            .setFooter({ text: 'Usa los botones de abajo para confirmar', iconURL: interaction.client.user?.displayAvatarURL() })
            .setTimestamp();

        const btnJoin = new ButtonBuilder()
            .setCustomId('btn_join')
            .setLabel('¡Me apunto! 🙋‍♂️')
            .setStyle(ButtonStyle.Success);

        const btnLeave = new ButtonBuilder()
            .setCustomId('btn_leave')
            .setLabel('Me bajo 😞')
            .setStyle(ButtonStyle.Danger);

        const btnAddGuests = new ButtonBuilder()
            .setCustomId('btn_add_guests')
            .setLabel('Llevaré Invitados 🤝')
            .setStyle(ButtonStyle.Primary);

        const btnEdit = new ButtonBuilder()
            .setCustomId(`btn_edit_${interaction.user.id}`)
            .setLabel('Opciones ⚙️')
            .setStyle(ButtonStyle.Secondary);

        const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(btnJoin, btnLeave, btnAddGuests, btnEdit);

        if (isCreate) {
            await interaction.reply({
                embeds: [matchEmbed],
                components: [actionRow]
            });
            
            if (interaction.guild) {
                const message = await interaction.fetchReply();
                saveActiveMatch(message.id, interaction.channelId!, interaction.guild.id);
            }
        } else if (isEdit) {
            let originalMatchMessage = interaction.message;

            if (interaction.customId.startsWith('modal_edit_match_')) {
                 const matchId = interaction.customId.replace('modal_edit_match_', '');
                 try {
                      const fetchedMessage = await interaction.channel?.messages.fetch(matchId);
                      if (fetchedMessage) originalMatchMessage = fetchedMessage;
                 } catch (e) {
                      console.error('Error fetching original message', e);
                 }
            }

            if (!originalMatchMessage) return;

            const originalEmbed = originalMatchMessage.embeds[0];
            const playersField = originalEmbed.data.fields?.find(f => f.name === '📋 Lista de Jugadores');

            if (playersField && matchEmbed.data.fields) {
                const playersIndex = matchEmbed.data.fields.findIndex(f => f.name === '📋 Lista de Jugadores');
                if (playersIndex !== -1) {
                    matchEmbed.data.fields[playersIndex].value = playersField.value;
                }
            }

            if (originalEmbed.data.image?.url) {
                matchEmbed.setImage(originalEmbed.data.image.url);
            }

            const oldActionRow = originalMatchMessage.components[0];

            if (interaction.customId.startsWith('modal_edit_match_')) {
                 await originalMatchMessage.edit({ embeds: [matchEmbed], components: [oldActionRow as any] });
                 await interaction.reply({ content: '✅ ¡Detalles del partido actualizados exitosamente!', ephemeral: true });
            } else if (interaction.isFromMessage()) {
                await interaction.update({
                    embeds: [matchEmbed],
                    components: [oldActionRow as any]
                });
            }
        }
    }
};
