const editSurveys = require('./editSurveys')

async function handleSurveySelectMenus(interaction, ticketConfig) {
  const selectedValue = interaction.values[0]

  switch (interaction.customId) {
    case 'survey-select-channel':
      ticketConfig.survey.channel = selectedValue
      // Si el canal es 'DM', la encuesta no puede ser obligatoria y tampoco puede expirar.
      if (selectedValue === 'DM') {
        ticketConfig.survey.isMandatory = false
        ticketConfig.survey.expires.enabled = false
      }
      await ticketConfig.save()
      await editSurveys(interaction, ticketConfig)
      break
    case 'survey-announce-channel-select':
      ticketConfig.survey.announceChannel = selectedValue
      await ticketConfig.save()
      await editSurveys(interaction, ticketConfig)
      break
  }
}

module.exports = handleSurveySelectMenus
