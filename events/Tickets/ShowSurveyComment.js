const { PermissionsBitField, Events } = require('discord.js')
const StaffTicketsStats = require('../../db/schemas/Staff/staffTicketStats')
const Tickets = require('../../db/schemas/Tickets/Tickets')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')

async function showSurveyComment(interaction) {
  if (
    !interaction.isButton() ||
    !interaction.customId.startsWith('comment_show_')
  ) {
    return
  }

  await interaction.deferReply({ ephemeral: true })

  const customIdParts = interaction.customId.split('_')
  const ticketID = customIdParts[2]

  try {
    // Obtenemos los datos del ticket para el StaffID y el UserID
    const ticketData = await Tickets.findById(ticketID)
    if (!ticketData) {
      return interaction.editReply({
        content: 'No se encontró el ticket asociado a este comentario.'
      })
    }

    // Obtenemos la configuración del ticket para los roles de Staff
    const ticketConfig = await TicketConfig.findOne({ Guild: ticketData.Guild })

    // Verificación de permisos
    const memberRoles = interaction.member.roles.cache
    const staffRoleIds = ticketConfig.staffs || []
    const managerRoleIds = ticketConfig.managers || []
    const isStaff = staffRoleIds.some((roleId) => memberRoles.has(roleId))
    const isManager = managerRoleIds.some((roleId) => memberRoles.has(roleId))
    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )

    // También verificamos si el usuario es el Staff evaluado
    const isStaffEvaluated = ticketData.ClaimedBy === interaction.user.id

    // Si el usuario no tiene los permisos necesarios y no es el staff evaluado, denegamos el acceso.
    if (!isStaff && !isManager && !isAdmin && !isStaffEvaluated) {
      return interaction.editReply({
        content: 'No tienes permisos para ver este comentario.'
      })
    }

    // Búsqueda del documento en StaffTicketsStats
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
        content: 'No se encontró el comentario de la encuesta.'
      })
    }

    // Buscamos la categoría y el comentario dentro del documento
    let comment = 'Sin comentario.'
    const starCategories = [
      'OneStar',
      'TwoStar',
      'ThreeStar',
      'FourStar',
      'FiveStar'
    ]

    for (const category of starCategories) {
      const detailsArray = staffDoc.Stats.SurveyDetails[category] || []
      const foundDetail = detailsArray.find(
        (detail) => detail.TicketID === ticketID
      )
      if (foundDetail && foundDetail.Comment) {
        comment = foundDetail.Comment
        break
      }
    }

    // Respondemos al usuario con el comentario de manera efímera
    await interaction.editReply({
      content: `**Comentario del ticket ${ticketID}:**\n\`\`\`${comment}\`\`\``
    })
  } catch (err) {
    console.error(`Error al mostrar el comentario del ticket ${ticketID}:`, err)
    return interaction.editReply({
      content:
        'Hubo un error interno al buscar el comentario. Por favor, contacta a un administrador.'
    })
  }
}

module.exports = {
    name: Events.InteractionCreate,
    execute: showSurveyComment
}
