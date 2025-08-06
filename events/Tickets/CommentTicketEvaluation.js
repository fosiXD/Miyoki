const {
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonStyle
} = require('discord.js')
const StaffTicketsStats = require('../../db/schemas/Staff/staffTicketStats')

async function handleCommentInteraction(interaction) {
  // -------------------------------------------------------------
  // --- Lógica para mostrar el Modal al presionar el botón ---
  // -------------------------------------------------------------
  if (
    interaction.isButton() &&
    interaction.customId.startsWith('survey_comment_')
  ) {
    const customIdParts = interaction.customId.split('_')
    const ticketID = customIdParts[2]

    // Crear el Modal
    const modal = new ModalBuilder()
      .setCustomId(`survey_comment_modal_${ticketID}`)
      .setTitle('Deja tu comentario')

    const commentInput = new TextInputBuilder()
      .setCustomId('surveyCommentInput')
      .setLabel('¿Qué te pareció el servicio?')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)

    const actionRow = new ActionRowBuilder().addComponents(commentInput)
    modal.addComponents(actionRow)

    // Mostrar el Modal al usuario
    return interaction.showModal(modal)
  }

  // -------------------------------------------------------------
  // --- Lógica para procesar la respuesta del Modal ---
  // -------------------------------------------------------------
  if (
    interaction.isModalSubmit() &&
    interaction.customId.startsWith('survey_comment_modal_')
  ) {
    const customIdParts = interaction.customId.split('_')
    const ticketID = customIdParts[3]
    const comment = interaction.fields.getTextInputValue('surveyCommentInput')

    await interaction.deferReply({ ephemeral: true })

    try {
      // Búsqueda para encontrar la calificación y el índice correcto
      const staffDoc = await StaffTicketsStats.findOne({
        $or: [
          { 'Stats.SurveyDetails.OneStar.TicketID': ticketID },
          { 'Stats.SurveyDetails.TwoStar.TicketID': ticketID },
          { 'Stats.SurveyDetails.ThreeStar.TicketID': ticketID },
          { 'Stats.SurveyDetails.FourStar.TicketID': ticketID },
          { 'Stats.SurveyDetails.FiveStar.TicketID': ticketID }
        ]
      })

      if (!staffDoc) {
        return interaction.editReply({
          content: 'No se encontró el ticket de staff asociado a tu comentario.'
        })
      }

      // Buscamos la categoría de estrellas correcta y el índice del array
      const starCategories = [
        'OneStar',
        'TwoStar',
        'ThreeStar',
        'FourStar',
        'FiveStar'
      ]
      let starCategory = null
      let arrayIndex = -1

      for (const category of starCategories) {
        const detailsArray = staffDoc.Stats.SurveyDetails[category]
        arrayIndex = detailsArray.findIndex(
          (detail) => detail.TicketID === ticketID
        )
        if (arrayIndex !== -1) {
          starCategory = category
          break
        }
      }

      if (!starCategory) {
        return interaction.editReply({
          content: 'No se encontró el detalle de la encuesta para este ticket.'
        })
      }

      const updatePath = `Stats.SurveyDetails.${starCategory}.${arrayIndex}.Comment`
      await StaffTicketsStats.findOneAndUpdate(
        { _id: staffDoc._id },
        { $set: { [updatePath]: comment } },
        { new: true }
      )

      // Lógica para deshabilitar el botón de comentario
      const oldActionRow = interaction.message.components[0]
      const newActionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(oldActionRow.components[0].customId)
          .setLabel('✏️ Comentario añadido')
          .setStyle(ButtonStyle.Success)
          .setDisabled(true)
      )

      await interaction.editReply({
        content: '¡Gracias por tus comentarios! Se han guardado correctamente.'
      })
      await interaction.message.edit({ components: [newActionRow] })
    } catch (err) {
      console.error(
        `Error al procesar el comentario para el ticket ${ticketID}:`,
        err
      )
      return interaction.editReply({
        content:
          'Hubo un error interno al guardar tu comentario. Por favor, contacta a un administrador.'
      })
    }
  }
}

module.exports = {
  name: Events.InteractionCreate,
  execute: handleCommentInteraction
}
