const {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle
} = require('discord.js')
const formatDynamicText = require('../utils/formatTag')
const formatEmbedData = require('../utils/formatEmbed')

// Mapa para almacenar los temporizadores de las encuestas activas.
// La clave será el ID del mensaje de la encuesta, y el valor será el ID del setTimeout.
const activeSurveys = require('../utils/Maps/surveyMap')

/**
 * Envía una encuesta de satisfacción al propietario de un ticket.
 * @param {import('discord.js').TextChannel} channel - El canal del ticket.
 * @param {object} ticketConfig - La configuración del ticket del servidor.
 * @param {object} ticketData - Los datos del ticket.
 */
async function ticketSurvey(channel, ticketConfig, ticketData) {
  try {
    // Obtener al propietario del ticket
    const ticketOwner = await channel.client.users.fetch(ticketData.User)
    if (!ticketOwner) {
      console.warn(
        `No se pudo obtener al propietario del ticket ${ticketData.User} para la encuesta.`
      )
      return
    }

    // Crear el embed de la encuesta
    let surveyEmbed
    if (
      ticketConfig.embeds &&
      ticketConfig.embeds.survey &&
      Object.keys(ticketConfig.embeds.survey).length > 0
    ) {
      surveyEmbed = new EmbedBuilder(
        formatEmbedData(
          ticketOwner, // Usamos el objeto de usuario para el formato
          ticketConfig.embeds.survey,
          formatDynamicText
        )
      )
    } else {
      // Embed por defecto si no hay configuración personalizada
      surveyEmbed = new EmbedBuilder()
        .setColor('#2E86C1')
        .setTitle('¡Valora tu experiencia!')
        .setDescription(
          'Por favor, tómate un momento para calificar tu experiencia de soporte.'
        )
        .setFooter({ text: `Ticket ID: ${ticketData._id}` })
        .setTimestamp()
    }

    // Crear los botones para la encuesta
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`survey_1star_${ticketData._id}`)
        .setLabel('⭐x1')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`survey_2star_${ticketData._id}`)
        .setLabel('⭐x2')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`survey_3star_${ticketData._id}`)
        .setLabel('⭐x3')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`survey_4star_${ticketData._id}`)
        .setLabel('⭐x4')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`survey_5star_${ticketData._id}`)
        .setLabel('⭐x5')
        .setStyle(ButtonStyle.Secondary)
    )

    let sentMessage

    // Enviar la encuesta según el canal de configuración
    if (ticketConfig.survey.channel === 'DM') {
      sentMessage = await ticketOwner
        .send({
          embeds: [surveyEmbed],
          components: [row]
        })
        .catch((dmErr) => {
          console.error(
            `No se pudo enviar la encuesta por DM a ${ticketOwner.username} (${ticketOwner.id}):`,
            dmErr
          )
        })
    } else if (ticketConfig.survey.channel === 'Ticket') {
      sentMessage = await channel.send({
        content: `<@${ticketOwner.id}>,`,
        embeds: [surveyEmbed],
        components: [row]
      })
    }

    // Si el mensaje se envió correctamente y la expiración está habilitada
    if (
      sentMessage &&
      ticketConfig.survey.expires.enabled &&
      ticketConfig.survey.expires.time
    ) {
      const expirationTimeMs = ticketConfig.survey.expires.time

      // Programar el temporizador para eliminar la encuesta
      const timeoutId = setTimeout(async () => {
        try {
          // Obtener la instancia del mensaje y eliminarla
          await sentMessage.delete()
          console.log(
            `Encuesta del ticket ${ticketData._id} eliminada después de la expiración.`
          )
        } catch (deleteError) {
          // Este error puede ocurrir si el usuario ya interactuó con el mensaje o lo borró
          console.warn(
            `No se pudo eliminar la encuesta del ticket ${ticketData._id}. Puede que ya no exista.`,
            deleteError.message
          )
        } finally {
          // Limpiar el temporizador del mapa
          activeSurveys.delete(sentMessage.id)
        }
      }, expirationTimeMs)

      // Almacenar el ID del temporizador para el mensaje enviado
      activeSurveys.set(sentMessage.id, timeoutId)
    }
  } catch (error) {
    console.error(
      `Error al enviar la encuesta del ticket ${ticketData._id}:`,
      error
    )
  }
}

module.exports = ticketSurvey
