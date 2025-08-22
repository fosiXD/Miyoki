const editSurveys = require('./editSurveys')
const editSurveyExpires = require('./editSurveyExpires')
const editSurveyAnnounceChannel = require('./editSurveyAnnounceChannel') // Nueva importación

/**
 * Maneja las interacciones de los botones de encuestas.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleSurveyButtons(interaction, ticketConfig) {
  const customId = interaction.customId

  switch (customId) {
    case 'survey-toggle-enabled':
      ticketConfig.survey.enabled = !ticketConfig.survey.enabled
      break
    case 'survey-toggle-mandatory':
      if (ticketConfig.survey.channel !== 'DM') {
        ticketConfig.survey.isMandatory = !ticketConfig.survey.isMandatory
        if (ticketConfig.survey.isMandatory) {
          ticketConfig.survey.expires.enabled = false
          ticketConfig.survey.expires.time = null
        }
      }
      break
    case 'survey-toggle-expires':
      if (!ticketConfig.survey.isMandatory) {
        if (!ticketConfig.survey.expires.enabled) {
          // Habilitar la expiración y mostrar el menú de configuración de tiempo
          ticketConfig.survey.expires.enabled = true
          await editSurveyExpires(interaction, ticketConfig)
          return
        } else {
          // Deshabilitar la expiración y borrar el tiempo
          ticketConfig.survey.expires.enabled = false
          ticketConfig.survey.expires.time = null
        }
      }
      break
    case 'survey-set-announce-channel':
      await editSurveyAnnounceChannel(interaction, ticketConfig)
      return
  }

  await ticketConfig.save()
  await editSurveys(interaction, ticketConfig)
}

module.exports = handleSurveyButtons
