const {
  Events,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
const Tickets = require('../../db/schemas/Tickets/Tickets')
const formatDynamicText = require('../../utils/formatTag')
const formatEmbedData = require('../../utils/formatEmbed')

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (interaction.customId !== 'claim-ticket') return

    const ticketConfig = await TicketConfig.findOne({
      Guild: interaction.guild.id
    })

    if (!ticketConfig) {
      return interaction.reply({
        content:
          'No se ha configurado el sistema de tickets para este servidor. Contacta a un administrador.',
        ephemeral: true
      })
    }

    const ticketData = await Tickets.findOne({
      ChannelID: interaction.channel.id
    })

    // Roles de quien realizó la interacción
    const memberRoles = interaction.member.roles.cache

    // Roles de Staff configurados en el servidor
    const staffRoleIds = ticketConfig.staffs || []

    // Roles de Manager configurados en el servidor
    const managerRoleIds = ticketConfig.managers || []

    // Verificar si el usuario tiene alguno de los roles de Staff
    const isStaff = staffRoleIds.some((roleId) => memberRoles.has(roleId))

    // Verificar si el usuario tiene alguno de los roles de Manager
    const isManager = managerRoleIds.some((roleId) => memberRoles.has(roleId))

    // Verificar si el usuario es admin
    const isAdmin = interaction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )

    // Verificaciones antes de reclamar el ticket
    if (!isStaff && !isManager && !isAdmin) {
      return interaction.reply({
        content: '¡Solo un Staff, Manager o Admin puede reclamar el ticket!',
        ephemeral: true
      })
    }

    // Actualizar datos del ticket
    try {
      await Tickets.updateOne(
        { _id: ticketData._id },
        {
          ClaimedBy: interaction.user.id,
          Status: 'Active',
          $addToSet: { Staff: interaction.user.id }
        }
      )
    } catch (error) {
      console.error('Error al actualizar el ticket:', error)
      return interaction.reply({
        content: 'Ocurrió un error al actualizar el ticket.',
        ephemeral: true
      })
    }

    const ticketChannel = interaction.channel

    await ticketChannel.permissionOverwrites.set([
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: ticketData.User,
        allow: [PermissionsBitField.Flags.ViewChannel]
      },
      ...(Array.isArray(ticketConfig.staffs)
        ? ticketConfig.staffs.map((roleId) => ({
            id: roleId,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }))
        : []),
      ...(Array.isArray(ticketConfig.managers)
        ? ticketConfig.managers.map((roleId) => ({
            id: roleId,
            allow: [PermissionsBitField.Flags.ViewChannel]
          }))
        : [])
    ])

    let embed
    try {
      if (
        ticketConfig.embeds.claimed &&
        Object.keys(ticketConfig.embeds.claimed).length > 0
      ) {
        const formattedCustomEmbedData = formatEmbedData(
          interaction,
          ticketConfig.embeds.claimed,
          formatDynamicText
        )

        embed = new EmbedBuilder(formattedCustomEmbedData)
      } else {
        embed = new EmbedBuilder()
          .setColor('Green')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL()
          })
          .setTitle(`Ticket Reclamado`)
          .setDescription(
            `A partir de ahora serás atendido por ${interaction.user.username}. Por favor sea paciente con las respuestas y no le escriba por privado si no recibe una respuesta pronta.`
          )
          .setFooter({
            text: `${interaction.guild.name}`
          })
          .setTimestamp(Date.now())
      }

      await interaction.channel.send({ embeds: [embed] })
    } catch (err) {
      console.error('Hubo un error al reclamar el ticket', err)
      return interaction.reply({
        content:
          'Ha habido un problema al reclamar el ticket. Por favor contacta con la administración.',
        ephemeral: true
      })
    }

    const Buttons = new ActionRowBuilder()

    try {
      const closeButton = new ButtonBuilder()
        .setCustomId('close-ticket')
        .setLabel('Cerrar Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)

      Buttons.addComponents(closeButton)

      if (ticketConfig.reassignable.enabled) {
        const reassignButton = new ButtonBuilder()
          .setCustomId('reassign-ticket')
          .setLabel('Reasignar Ticket')
          .setEmoji('🔓')
          .setStyle(ButtonStyle.Primary)

        Buttons.addComponents(reassignButton)
      }

      await interaction.message.edit({ components: [Buttons] })

      await interaction.reply({
        content: 'Ticket reclamado satisfactoriamente.',
        ephemeral: true
      })
    } catch (err) {
      console.error(
        'Hubo un error agregando los botones al Embed del ticket',
        err
      )
      await interaction.channel.send({
        content: 'Ha habido un error asignando los botones al embed del ticket.'
      })
    }
  }
}
