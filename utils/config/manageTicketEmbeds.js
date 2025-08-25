const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')

async function manageTicketEmebds(interaction) {
  const embedOptions = [
    {
      name: 'Panel',
      description: 'Embed del panel de tickets',
      value: 'panel-embed',
      emoji: '📌'
    },
    {
      name: 'Apertura',
      description: 'Embed que se envía al abrir un ticket',
      value: 'opening-embed',
      emoji: '📭'
    },
    {
      name: 'Reclamado',
      description: 'Embed que se envía al reclamar un ticket',
      value: 'claimed-embed',
      emoji: '🏷️'
    },
    {
      name: 'Reasignado',
      description: 'Embed que se envía al reasignar un ticket',
      value: 'reassigned-embed',
      emoji: '🔓'
    },
    {
      name: 'Cierre',
      description: 'Embed que se envía al cerrar un ticket',
      value: 'closing-embed',
      emoji: '🗑️'
    }
  ]
  const embed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Configurar Embeds')
    .setDescription('Selecciona el embed que quieres editar.')

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-config-embeds')
    .setPlaceholder('Gestionar Embeds')

  const options = embedOptions.map((option) =>
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
    embeds: [embed],
    components: [row, backToMenuButton]
  })
}

module.exports = manageTicketEmebds
