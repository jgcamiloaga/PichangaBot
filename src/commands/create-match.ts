import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder 
} from 'discord.js';

export const data = new SlashCommandBuilder()
    .setName('crear-partido')
    .setDescription('Abre el formulario de creación de pichanga');

export async function execute(interaction: ChatInputCommandInteraction) {
    const modal = new ModalBuilder()
        .setCustomId('modal_create_match')
        .setTitle('Configuración de la Pichanga');

    const matchNameInput = new TextInputBuilder()
        .setCustomId('input_match_name')
        .setLabel("Nombre del encuentro")
        .setPlaceholder("Ej: Clásico de los Viernes")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const dateTimeInput = new TextInputBuilder()
        .setCustomId('input_match_datetime')
        .setLabel("Fecha y Hora (DD/MM/YYYY HH:mm)")
        .setPlaceholder("Ej: 15/03/2025 18:30")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const locationInput = new TextInputBuilder()
        .setCustomId('input_match_location')
        .setLabel("Ubicación (Lugar o Link)")
        .setPlaceholder("Ej: La 10 o https://goo.gl/maps/...")
        .setStyle(TextInputStyle.Short) 
        .setRequired(true);

    const spotsInput = new TextInputBuilder()
        .setCustomId('input_match_spots')
        .setLabel("¿Cuántos jugadores en total? (2-50)")
        .setPlaceholder("Ej: 10")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(matchNameInput);
    const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(dateTimeInput);
    const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(locationInput);
    const fourthRow = new ActionRowBuilder<TextInputBuilder>().addComponents(spotsInput);

    modal.addComponents(firstRow, secondRow, thirdRow, fourthRow);

    await interaction.showModal(modal);
}