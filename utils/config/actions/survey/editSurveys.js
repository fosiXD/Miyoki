const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder
} = require('discord.js')
const formatDuration = require('../../../formatDuration')

/**
 * Muestra el submenú para configurar las encuestas.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function editSurveys(interaction, ticketConfig) {
  const survey = ticketConfig.survey

  const surveysEmbed = new EmbedBuilder()
    .setColor('DarkOrange')
    .setTitle('Configuración de Encuestas ⭐')
    .setDescription(
      'Edita las preferencias de las encuestas para los tickets. Algunas opciones se desactivarán automáticamente si entran en conflicto con otras.'
    )
    .addFields(
      {
        name: 'Estado de Encuestas',
        value: `\`${survey.enabled ? '✅ Habilitado' : '❌ Deshabilitado'}\``,
        inline: true
      },
      {
        name: 'Canal de Anuncio',
        value: survey.announceChannel
          ? `<#${survey.announceChannel}>`
          : '`Ninguno`',
        inline: true
      },
      {
        name: 'Canal de Envío',
        value: `\`${survey.channel}\``,
        inline: true
      },
      {
        name: 'Mandatoria',
        value: `\`${survey.isMandatory ? '✅ Sí' : '❌ No'}\``,
        inline: true
      },
      {
        name: 'Expira',
        value: `\`${
          survey.expires.enabled
            ? `✅ Sí (${formatDuration(survey.expires.time)})`
            : '❌ No'
        }\``,
        inline: true
      }
    )

  // Botones para toggles
  const toggleRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('survey-toggle-enabled')
      .setLabel(survey.enabled ? 'Deshabilitar' : 'Habilitar')
      .setStyle(survey.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('survey-toggle-mandatory')
      .setLabel(`${survey.isMandatory ? 'Deshabilitar' : 'Habilitar'} Obligatorio`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('survey-toggle-expires')
      .setLabel(`${survey.expires.enabled ? 'Deshabilitar' : 'Habilitar'} Expirable`)
      .setStyle(ButtonStyle.Secondary)
  )

  // Menú de selección para el canal
  const channelSelect = new StringSelectMenuBuilder()
    .setCustomId('survey-select-channel')
    .setPlaceholder('Selecciona el canal de envío')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('DM (Mensaje Directo)')
        .setValue('DM')
        .setDescription(
          'La encuesta se enviará al usuario por mensaje directo.'
        )
        .setEmoji('📬')
        .setDefault(survey.channel === 'DM'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Ticket')
        .setValue('Ticket')
        .setDescription('La encuesta se enviará en el canal del ticket.')
        .setEmoji('📄')
        .setDefault(survey.channel === 'Ticket')
    )

  const channelRow = new ActionRowBuilder().addComponents(channelSelect)

  // Botones para el canal de anuncio y volver
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('survey-set-announce-channel')
      .setLabel('Establecer Canal de Anuncio')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('go-back-to-preferences')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.editReply({
    embeds: [surveysEmbed],
    components: [toggleRow, channelRow, actionRow]
  })
}

module.exports = editSurveys
