const { EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')

async function updateTicketRoles(interaction) {
  const roleOptions = [
    {
      name: 'Staff',
      description: 'Roles de Staff',
      value: 'staff-roles',
      emoji: '🛡️'
    },
    {
      name: 'Managers',
      description: 'Roles de Manager',
      value: 'manager-roles',
      emoji: '👔'
    }
  ]
  const rolesEmbed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Roles de Staff')
    .setDescription('Selecciona el tipo de rol que quieres editar.')

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-config-roles')
    .setPlaceholder('Editar Roles')

  const options = roleOptions.map((option) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(option.name)
      .setDescription(option.description)
      .setValue(option.value)
      .setEmoji(option.emoji)
  )
  selectMenu.addOptions(options)

  const backToMenuButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('go-back-to-menu')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
  )

  const row = new ActionRowBuilder().addComponents(selectMenu)

  await interaction.editReply({
    embeds: [rolesEmbed],
    components: [row, backToMenuButton]
  })
}

module.exports = updateTicketRoles
