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
async function editManagerRoles(interaction, ticketConfig) {
  const roleIDs = ticketConfig.managers
  const managerRolesString = []

  for (const roleId of roleIDs) {
    const role = interaction.guild.roles.cache.get(roleId)
    if (role) {
      managerRolesString.push(`<@&${roleId}>`)
    }
  }

  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Roles de Manager')
    .setDescription(
      `Los roles de Manager configurados son:\n\n${
        managerRolesString.length > 0
          ? managerRolesString.join('\n')
          : 'No hay roles de manager configurados.'
      }`
    )

  const managerRoleButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('add-manager-role')
      .setLabel('Añadir Rol')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('➕'),

    new ButtonBuilder()
      .setCustomId('remove-manager-role')
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
    components: [managerRoleButtons, backToRolesButton]
  })
}

module.exports = editManagerRoles
