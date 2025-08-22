const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')

/**
 * Muestra la configuración de roles de Staff para el servidor.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function editStaffRoles(interaction, ticketConfig) {
  const roleIDs = ticketConfig.staffs
  const staffRolesString = []

  for (const roleId of roleIDs) {
    const role = interaction.guild.roles.cache.get(roleId)
    if (role) {
      staffRolesString.push(`<@&${roleId}>`)
    }
  }

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Roles de Staff')
    .setDescription(
      `Los roles de Staff configurados son:\n\n${
        staffRolesString.length > 0
          ? staffRolesString.join('\n')
          : 'No hay roles de staff configurados.'
      }`
    )

  const manageRoleButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('add-staff-role')
      .setLabel('Añadir Rol')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('➕'),

    new ButtonBuilder()
      .setCustomId('remove-staff-role')
      .setLabel('Eliminar Rol')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('➖')
  )

  const backToRolesButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('go-back-to-roles')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.editReply({
    embeds: [embed],
    components: [manageRoleButtons, backToRolesButton]
  })
}

module.exports = editStaffRoles
