const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')
const formatDuration = require('../../formatDuration')

/**
 * Muestra el menú de configuración para el tiempo de expiración de encuestas.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function editSurveyExpires(interaction, ticketConfig) {
  const survey = ticketConfig.survey
  const expiresTime = survey.expires.time || 0

  const surveyExpiresEmbed = new EmbedBuilder()
    .setColor('DarkOrange')
    .setTitle('Configuración de Expiración de Encuestas ⏳')
    .setDescription(
      'Define el tiempo después del cual una encuesta sin respuesta será eliminada.'
    )
    .addFields({
      name: 'Tiempo de Expiración Actual',
      value: `\`${
        expiresTime > 0 ? formatDuration(expiresTime) : 'No establecido'
      }\``,
      inline: true
    })

  const timeButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('survey-expire-add-30m')
      .setLabel('+30m')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('survey-expire-add-1h')
      .setLabel('+1h')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('survey-expire-clear')
      .setLabel('Borrar')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('go-back-to-surveys')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Primary)
  )

  await interaction.editReply({
    embeds: [surveyExpiresEmbed],
    components: [timeButtons]
  })
}

module.exports = editSurveyExpires
