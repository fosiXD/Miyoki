const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js')
const Tickets = require('../../db/schemas/Tickets/Tickets')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
const StaffTicketsStats = require('../../db/schemas/Staff/staffTicketStats')
const activeSurveys = require('../../utils/Maps/surveyMap')
const client = require('../../index')
const closeTicket = require('../../utils/closeTicket') // Importamos la función closeTicket

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // Si la interacción es un botón, pero no es de una encuesta, la ignoramos.
    if (
      interaction.isButton() &&
      interaction.customId.startsWith('survey_') &&
      !interaction.customId.startsWith('survey_comment')
    ) {
      await interaction.deferReply({ ephemeral: true })

      const msg = interaction.message

      // -----------------------------------------------------------------
      // --- Lógica para detectar la calificación del botón presionado ---
      // -----------------------------------------------------------------
      const customIdParts = interaction.customId.split('_')
      const starValue = customIdParts[1]
      const ticketID = customIdParts[2]

      let evaluationPoints
      let total
      switch (starValue) {
        case '1star':
          evaluationPoints = 'OneStar'
          total = 1
          break
        case '2star':
          evaluationPoints = 'TwoStar'
          total = 2
          break
        case '3star':
          evaluationPoints = 'ThreeStar'
          total = 3
          break
        case '4star':
          evaluationPoints = 'FourStar'
          total = 4
          break
        case '5star':
          evaluationPoints = 'FiveStar'
          total = 5
          break
        default:
          return interaction.editReply({
            content:
              'Hubo un error al procesar tu calificación. Inténtalo de nuevo.'
          })
      }

      try {
        const ticketData = await Tickets.findOneAndUpdate(
          {
            _id: ticketID,
            // Agregamos esta validación para evitar que el usuario califique el ticket más de una vez.
            Rated: { $ne: true }
          },
          {
            Rated: true
          },
          { new: true }
        )

        if (!ticketData) {
          // Si el ticket ya está calificado, no hacemos nada más y le avisamos al usuario.
          if (
            interaction.message &&
            interaction.message.components.length > 0
          ) {
            interaction.message.edit({ components: [] }).catch(() => {})
          }
          return interaction.editReply({
            content: 'Ya has calificado este ticket. ¡Gracias de nuevo!'
          })
        }

        const ticketConfig = await TicketConfig.findOne({
          Guild: ticketData.Guild
        })

        let targetStaffId
        // Si la función de reclamo está habilitada, usamos ClaimedBy.
        if (
          ticketConfig &&
          ticketConfig.claimable.enabled &&
          ticketData.ClaimedBy
        ) {
          targetStaffId = ticketData.ClaimedBy
        } else {
          // Si la función de reclamo está deshabilitada, usamos al último staff en hablar.
          // Esto es un ejemplo, puedes decidir si quieres calificar a todos o solo al último.
          // Aquí se califica al último staff en la lista.
          targetStaffId = ticketData.Staff[ticketData.Staff.length - 1]

          if (!targetStaffId) {
            return interaction.editReply({
              content: 'No se pudo determinar al Staff que atendió este ticket.'
            })
          }
        }

        const surveyDetails = {
          TicketID: ticketData._id,
          SurveyDate: Date.now(),
          Comment: null
        }

        const staffTicketData = await StaffTicketsStats.findOneAndUpdate(
          { Guild: ticketData.Guild, StaffID: targetStaffId },
          {
            $inc: {
              [`Stats.SurveyStats.${evaluationPoints}`]: 1,
              'Stats.SurveyStats.Total': total
            },
            $push: {
              [`Stats.SurveyDetails.${evaluationPoints}`]: surveyDetails
            }
          },
          { upsert: true, new: true }
        )

        // -------------------------------------------------------
        // --- Lógica para deshabilitar botones y cancelar el temporizador ---
        // -------------------------------------------------------

        const oldActionRow = interaction.message.components[0]
        const newActionRow = new ActionRowBuilder()

        for (const button of oldActionRow.components) {
          newActionRow.addComponents(
            new ButtonBuilder()
              .setCustomId(button.customId)
              .setLabel(button.label)
              .setStyle(button.style)
              .setDisabled(true)
          )
        }

        const commentButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`survey_comment_${ticketData._id}`)
            .setLabel('✏️ Añadir comentario')
            .setStyle(ButtonStyle.Primary)
        )

        const timeoutId = activeSurveys.get(msg.id)
        if (timeoutId) {
          clearTimeout(timeoutId)
          activeSurveys.delete(msg.id)
        }

        await interaction.editReply({
          content: '¡Gracias por calificar tu experiencia!'
        })

        await msg.edit({ components: [newActionRow, commentButton] })

        // ---------------------------------------------------------------------
        // --- Lógica para enviar el mensaje del survey al canal establecido ---
        // ---------------------------------------------------------------------
        if (
          ticketConfig &&
          ticketConfig.survey &&
          ticketConfig.survey.channel
        ) {
          const user = await client.users.fetch(staffTicketData.StaffID)
          const guild = await client.guilds.fetch(ticketData.Guild)
          const channel = await guild.channels.cache.get(
            ticketConfig.survey.announceChannel
          )

          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(total > 3 ? 'Green' : 'Red')
              .setTitle('Nuevo Survey recibido')
              .setThumbnail(user.avatarURL())
              .setDescription(
                `El Staff ${user.username} ha recibido ⭐x${total.toString()}`
              )
              .setFooter({ text: guild.name, iconURL: guild.iconURL() })
              .setTimestamp()

            const seeCommentButton = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`comment_show_${ticketData._id}`)
                .setLabel('📝 Ver Comentario')
                .setStyle(ButtonStyle.Primary)
            )
            await channel.send({
              embeds: [embed],
              components: [seeCommentButton]
            })
          }
        }

        // ---------------------------------------------------------------------
        // --- Lógica NUEVA: Cierre del ticket si estaba en estado pendiente ---
        // ---------------------------------------------------------------------
        if (ticketData.Status === 'PendingSurvey') {
          const ticketChannel = await client.channels.fetch(
            ticketData.ChannelID
          )
          if (ticketChannel) {
            // Llamamos a closeTicket con forceClose: true para evitar el bucle.
            await closeTicket(
              ticketChannel,
              interaction.user, // Usamos el usuario que calificó como el 'closer'
              `Encuesta completada por el usuario`,
              ticketChannel.guild,
              null,
              true // Forzamos el cierre del ticket
            )
          }
        }
      } catch (err) {
        console.error(`Hubo un error al evaluar el ticket ${ticketID}`, err)
        return interaction.editReply({
          content:
            'Hubo un error interno al procesar tu calificación. Por favor, contacta a un administrador.'
        })
      }
    }
  }
}
