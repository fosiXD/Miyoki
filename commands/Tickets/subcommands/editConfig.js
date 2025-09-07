const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js')
const client = require('../../../index')

async function mainMenu(interaction) {
  const configModules = [
    {
      name: 'Ticket Preferences', // Claimable, Reassignable, Logs, Surveys, Ticket channel options (parent and name), Opening reason options (if enabled and attachments), Idle
      description: 'Edit all ticket preferences.',
      value: 'ticket-preferences',
      emoji: '⚙️'
    },
    {
      name: 'Roles',
      description: 'Staff roles and Manager roles',
      value: 'roles',
      emoji: '🔑'
    },
    {
      name: 'Embeds',
      description: 'Embeds used.',
      value: 'embeds',
      emoji: '✏️'
    }
  ]

  const mainMenuEmbed = new EmbedBuilder()
    .setColor('Yellow')
    .setThumbnail(client.user.avatarURL())
    .setTitle('Configuración de Tickets')
    .setDescription('Por favor selecciona abajo qué módulo quieres configurar.')

  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket-config-menu')
    .setPlaceholder('Selecciona el Módulo')

  const options = configModules.map((module) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(module.name)
      .setDescription(module.description)
      .setValue(module.value)
      .setEmoji(module.emoji)
  )

  select.addOptions(options)

  const row = new ActionRowBuilder().addComponents(select)
  await interaction.editReply({ embeds: [mainMenuEmbed], components: [row] })
}

async function editConfig(interaction) {
  await interaction.deferReply({ ephemeral: true })
  await mainMenu(interaction)
}

module.exports = { editConfig, mainMenu }
