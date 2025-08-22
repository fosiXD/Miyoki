const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js')
const formatDuration = require('../../../formatDuration') // Importa una función para formatear la duración

async function editIdle(interaction, ticketConfig) {
  // Aseguramos que tenemos los valores por defecto si no existen
  const reminderTime = ticketConfig.idle.reminder || 0
  const closeTime = ticketConfig.idle.close || 0

  const idleEmbed = new EmbedBuilder()
    .setColor('Orange')
    .setTitle('Configuración de Inactividad ⏳')
    .setDescription(
      'Configura el tiempo de recordatorio y cierre automático para los tickets inactivos.'
    )
    .addFields(
      {
        name: 'Recordatorio (Reminder)',
        value: `\`${formatDuration(reminderTime)}\``,
        inline: true
      },
      {
        name: 'Cierre (Close)',
        value: `\`${formatDuration(closeTime)}\``,
        inline: true
      }
    )

  // Botones para el tiempo de Recordatorio
  const reminderButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('idle-reminder-30m')
      .setLabel('+30 min')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('idle-reminder-1h')
      .setLabel('+1 h')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('idle-reminder-clear')
      .setLabel('Borrar')
      .setStyle(ButtonStyle.Danger),
  )

  // Botones para el tiempo de Cierre
  const closeButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('idle-close-30m')
      .setLabel('+30 min')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('idle-close-1h')
      .setLabel('+1 h')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('idle-close-clear')
      .setLabel('Borrar')
      .setStyle(ButtonStyle.Danger),
  )

  // Botón para volver al menú anterior
  const backButtonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('go-back-to-preferences')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.editReply({
    embeds: [idleEmbed],
    components: [reminderButtons, closeButtons, backButtonRow]
  })
}

module.exports = editIdle
