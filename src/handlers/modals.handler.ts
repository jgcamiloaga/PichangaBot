import { ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ActionRowData, MessageActionRowComponentBuilder } from 'discord.js';
import { getRandomFootballImage } from '../services/unsplash.service';
import { getNickname, refreshPlayerListNicknames } from '../services/nickname.service';
import { saveActiveMatch } from '../services/match.service';
import { parseMatchDate, isDateInPast, isValidSpots, getDiscordTimestamp, EMPTY_LIST_MSG, parseAvailableSpots, updateSpotsField, countPlayers } from '../services/validation.service';
import { getGuildRole } from '../services/guild.service';

export const handleModals = async (interaction: ModalSubmitInteraction) => {
    if (interaction.customId === 'modal_add_guests') {
        const guestsCountStr = interaction.fields.getTextInputValue('input_guests_count');
        const guestsCount = parseInt(guestsCountStr, 10);

        if (isNaN(guestsCount) || guestsCount <= 0) {
            await interaction.reply({ content: '❌ Por favor, ingresa un número válido mayor a 0. 😅', ephemeral: true });
            return;
        }

        if (guestsCount > 10) {
            await interaction.reply({ content: '❌ No puedes llevar más de **10 invitados** a la vez. 😅', ephemeral: true });
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

            const alreadyInList = currentPlayers.includes(`• ${userMention}`);
            const slotsNeeded = guestsCount + (alreadyInList ? 0 : 1);

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1) {
                const available = parseAvailableSpots(updatedEmbed.data.fields[spotsFieldIndex].value);
                if (!isNaN(available) && slotsNeeded > available) {
                    const msg = alreadyInList
                        ? `¡Lo siento! Solo quedan **${available}** cupos disponibles. No puedes llevar a ${guestsCount} invitados. 😢`
                        : `¡Lo siento! Solo quedan **${available}** cupos disponibles (incluyendo el tuyo). No puedes llevar a ${guestsCount} invitados. 😢`;
                    await interaction.reply({ content: msg, ephemeral: true });
                    return;
                }
            }

            if (interaction.isFromMessage()) {
                await interaction.deferUpdate();
            }

            if (currentPlayers === EMPTY_LIST_MSG) {
                currentPlayers = '';
            }

            if (!alreadyInList) {
                let playerEntry = userMention;
                if (interaction.guild) {
                    const nickname = await getNickname(interaction.guild.id, interaction.user.id);
                    if (nickname) playerEntry += ` (${nickname})`;
                }
                currentPlayers += (currentPlayers ? '\n' : '') + `• ${playerEntry}`;
            }

            for (let i = 0; i < guestsCount; i++) {
                currentPlayers += (currentPlayers ? '\n' : '') + `• Invitado de ${userMention}`;
            }

            if (interaction.guild) {
                currentPlayers = await refreshPlayerListNicknames(currentPlayers, interaction.guild.id);
            }

            updatedEmbed.data.fields[fieldIndex].value = currentPlayers;

            if (spotsFieldIndex !== undefined && spotsFieldIndex !== -1 && updatedEmbed.data.fields) {
                updatedEmbed.data.fields[spotsFieldIndex].value = updateSpotsField(updatedEmbed.data.fields[spotsFieldIndex].value, -slotsNeeded);
            }

            if (interaction.isFromMessage()) {
                await interaction.editReply({ embeds: [updatedEmbed] });
            } else {
                await interaction.reply({ content: '✅ ¡Invitados agregados!', ephemeral: true });
            }
        }
        return;
    }

    const isCreate = interaction.customId === 'modal_create_match';
    const isEdit = interaction.customId.startsWith('modal_edit_match');

    if (isCreate || isEdit) {
        const prefix = isCreate ? 'input_match_' : 'input_edit_';
        const matchName = interaction.fields.getTextInputValue(`${prefix}name`);
        const datetimeRaw = interaction.fields.getTextInputValue(`${prefix}datetime`);
        const location = interaction.fields.getTextInputValue(`${prefix}location`);
        const spotsRaw = interaction.fields.getTextInputValue(`${prefix}spots`);

        const parsedDate = parseMatchDate(datetimeRaw);
        if (!parsedDate) {
            await interaction.reply({
                content: '❌ **Formato de fecha inválido.**\nUsa el formato `DD/MM/YYYY HH:mm`\nEjemplo: `15/03/2025 18:30`',
                ephemeral: true
            });
            return;
        }

        if (isDateInPast(parsedDate)) {
            await interaction.reply({
                content: '❌ **No puedes crear un partido en el pasado.**\nElige una fecha y hora futura.',
                ephemeral: true
            });
            return;
        }

        if (!isValidSpots(spotsRaw)) {
            await interaction.reply({
                content: '❌ **Cantidad de jugadores inválida.**\nDebe ser un número entero entre **2 y 50**.',
                ephemeral: true
            });
            return;
        }

        const locationValue = location.startsWith('http://') || location.startsWith('https://')
            ? `[Ver en Google Maps](${location})`
            : location;

        const discordTimestamp = getDiscordTimestamp(parsedDate);
        const spots = parseInt(spotsRaw.trim(), 10);

        const matchEmbed = new EmbedBuilder()
            .setAuthor({
                name: `🔥 Organizado por ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL() || undefined
            })
            .setTitle(`⚽ ${matchName.toUpperCase()} ⚽`)
            .setDescription('¡Preparate para el mejor partido de la semana! Revisa los detalles abajo y asegura tu cupo antes de que se acaben.')
            .setColor('#FF5733')
            .addFields(
                { name: '🗓️ Fecha y Hora', value: discordTimestamp, inline: true },
                { name: '📍 Ubicación', value: locationValue, inline: true },
                { name: '👥 Cupos Totales', value: `**${spots} / ${spots}**`, inline: true },
                { name: '📋 Lista de Jugadores', value: EMPTY_LIST_MSG }
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
            await interaction.deferReply();
            try {
                const imageUrl = await getRandomFootballImage();
                if (imageUrl) matchEmbed.setImage(imageUrl);

                if (interaction.guild) {
                    const roleId = await getGuildRole(interaction.guild.id);
                    const mentionContent = roleId ? `<@&${roleId}> ¡Hay un nuevo partido! ⚽` : undefined;

                    await interaction.editReply({
                        content: mentionContent,
                        embeds: [matchEmbed],
                        components: [actionRow]
                    });

                    const message = await interaction.fetchReply();
                    await saveActiveMatch(message.id, interaction.channelId!, interaction.guild.id);
                } else {
                    await interaction.editReply({
                        embeds: [matchEmbed],
                        components: [actionRow]
                    });
                }
            } catch (err) {
                console.error('Error al crear el partido:', err);
                await interaction.editReply({ content: '❌ Ocurrió un error al crear el partido. Por favor intenta de nuevo.' });
            }
        } else if (isEdit) {
            const matchId = interaction.customId.replace('modal_edit_match_', '');
            let originalMatchMessage = interaction.message;
            try {
                const fetched = await interaction.channel?.messages.fetch(matchId);
                if (fetched) originalMatchMessage = fetched;
            } catch (e: any) {
                console.error('Error fetching original message', e);
            }

            if (!originalMatchMessage) {
                await interaction.reply({ content: '❌ No se encontró el mensaje del partido. Puede que haya sido eliminado.', ephemeral: true });
                return;
            }

            const originalEmbed = originalMatchMessage.embeds[0];
            const playersField = originalEmbed.data.fields?.find(f => f.name === '📋 Lista de Jugadores');

            if (playersField) {
                const currentPlayerCount = countPlayers(playersField.value);
                if (spots < currentPlayerCount) {
                    await interaction.reply({
                        content: `❌ **No puedes reducir los cupos a ${spots}.** Ya hay **${currentPlayerCount}** jugadores inscritos. El mínimo permitido es **${currentPlayerCount}**.`,
                        ephemeral: true
                    });
                    return;
                }
            }

            if (playersField && matchEmbed.data.fields) {
                const playersIndex = matchEmbed.data.fields.findIndex(f => f.name === '📋 Lista de Jugadores');
                if (playersIndex !== -1) {
                    matchEmbed.data.fields[playersIndex].value = playersField.value;
                }

                const spotsIndex = matchEmbed.data.fields.findIndex(f => f.name === '👥 Cupos Totales');
                if (spotsIndex !== -1) {
                    matchEmbed.data.fields[spotsIndex].value = `**${spots - countPlayers(playersField.value)} / ${spots}**`;
                }
            }

            if (originalEmbed.data.image?.url) {
                matchEmbed.setImage(originalEmbed.data.image.url);
            }

            const oldActionRow = originalMatchMessage.components[0] as unknown as ActionRowData<MessageActionRowComponentBuilder>;
            await originalMatchMessage.edit({ embeds: [matchEmbed], components: [oldActionRow] });
            await interaction.reply({ content: '✅ ¡Detalles del partido actualizados exitosamente!', ephemeral: true });
        }
    }
};
