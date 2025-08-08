const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require('discord.js')

async function updateTicketPreferences(interaction, ticketConfig) {
  const preferencesOptions = [
    {
      name: 'Reclamable',
      description: `Estado actual: ${
        ticketConfig.claimable.enabled ? '✅ Habilitado' : '❌ Deshabilitado'
      }`,
      value: 'toggle-claimable',
      emoji: '✋'
    },
    {
      name: 'Reasignable',
      description: `Estado actual: ${
        ticketConfig.reassignable.enabled ? '✅ Habilitado' : '❌ Deshabilitado'
      }`,
      value: 'toggle-reassignable',
      emoji: '🤝'
    },
    {
      name: 'Logs',
      description: `Estado actual: ${
        ticketConfig.loggable.enabled ? '✅ Habilitado' : '❌ Deshabilitado'
      }`,
      value: 'toggle-logs',
      emoji: '📁'
    },
    {
      name: 'Motivo de Apertura requerido',
      description: `Estado actual: ${
        ticketConfig.openingReason.enabled ? '✅ Habilitado' : '❌ Deshabilitado'
      }`,
      value: 'toggle-openingReason',
      emoji: '📝'
    },
    {
      name: 'Configurar Surveys',
      description: `Estado actual: ${
        ticketConfig.survey.enabled ? '✅ Habilitado' : '❌ Deshabilitado'
      }`,
      value: 'edit-surveys',
      emoji: '⭐'
    },
    {
      name: 'Recordatorios de Inactividad',
      description: 'Configura recordatorios y cierre automático.',
      value: 'edit-idle',
      emoji: '⏳'
    }
  ]

  const preferencesEmbed = new EmbedBuilder()
    .setColor('Blue')
    .setTitle('Preferencias de Tickets')
    .setDescription('Selecciona una preferencia para editar.')

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ticket-config-preferences')
    .setPlaceholder('Editar Preferencia')

  const options = preferencesOptions.map((option) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(option.name)
      .setDescription(option.description)
      .setValue(option.value)
      .setEmoji(option.emoji)
  )
  selectMenu.addOptions(options)

  const row = new ActionRowBuilder().addComponents(selectMenu)

  await interaction.editReply({ embeds: [preferencesEmbed], components: [row] })
}

module.exports = updateTicketPreferences
