const editSurveyExpires = require('./editSurveyExpires')

/**
 * Maneja las interacciones de los botones del menú de expiración de encuestas.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleSurveyExpireButtons(interaction, ticketConfig) {
  const customId = interaction.customId

  switch (customId) {
    case 'survey-expire-add-30m':
      // Asegurar que el tiempo actual no sea nulo antes de sumar
      ticketConfig.survey.expires.time =
        (ticketConfig.survey.expires.time || 0) + 30 * 60 * 1000
      break
    case 'survey-expire-add-1h':
      // Asegurar que el tiempo actual no sea nulo antes de sumar
      ticketConfig.survey.expires.time =
        (ticketConfig.survey.expires.time || 0) + 60 * 60 * 1000
      break
    case 'survey-expire-clear':
      ticketConfig.survey.expires.time = null
      break
    case 'go-back-to-surveys':
      // Este botón se maneja en el archivo principal, por lo que no se necesita lógica aquí
      break
    default:
      return // Salir si no es un botón de expiración conocido
  }

  await ticketConfig.save()
  // Vuelve a mostrar el menú de expiración con los cambios actualizados
  await editSurveyExpires(interaction, ticketConfig)
}

module.exports = handleSurveyExpireButtons
