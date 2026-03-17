import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { setGuildRole, getGuildRole, clearGuildRole } from '../services/guild.service';

export const data = new SlashCommandBuilder()
    .setName('configurar-rol')
    .setDescription('Configura el rol que será mencionado al crear un nuevo partido')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(sub =>
        sub.setName('establecer')
            .setDescription('Establece el rol a mencionar al crear partido')
            .addRoleOption(opt =>
                opt.setName('rol')
                    .setDescription('El rol que recibirá notificaciones de nuevos partidos')
                    .setRequired(true)
            )
    )
    .addSubcommand(sub =>
        sub.setName('ver')
            .setDescription('Muestra el rol configurado actualmente')
    )
    .addSubcommand(sub =>
        sub.setName('borrar')
            .setDescription('Elimina el rol configurado — los partidos se crearán sin mención')
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({ content: 'Este comando solo puede usarse dentro de un servidor.', ephemeral: true });
        return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'establecer') {
        const role = interaction.options.getRole('rol', true);
        await setGuildRole(interaction.guild.id, role.id);
        await interaction.reply({
            content: `✅ ¡Listo! A partir de ahora, al crear un nuevo partido se mencionará a **${role.name}**.`,
            ephemeral: true
        });

    } else if (subcommand === 'ver') {
        const roleId = await getGuildRole(interaction.guild.id);
        if (!roleId) {
            await interaction.reply({
                content: '⚙️ No hay ningún rol configurado. Los partidos se crean sin mención.',
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `⚙️ El rol configurado para notificaciones es: <@&${roleId}>`,
                ephemeral: true
            });
        }

    } else if (subcommand === 'borrar') {
        const existingRoleId = await getGuildRole(interaction.guild.id);
        if (!existingRoleId) {
            await interaction.reply({
                content: '⚙️ No hay ningún rol configurado. No hay nada que borrar.',
                ephemeral: true
            });
            return;
        }
        await clearGuildRole(interaction.guild.id);
        await interaction.reply({
            content: '✅ Rol eliminado. Los partidos se crearán sin mencionar a nadie.',
            ephemeral: true
        });
    }
}
