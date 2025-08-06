const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
const Tickets = require('../../db/schemas/Tickets/Tickets')

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (interaction.customId !== 'reassign-ticket') return

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

    const ticketData = await Tickets.findOneAndUpdate(
      {
        ChannelID: interaction.channel.id
      },
      {
        Status: 'Pending',
        ClaimedBy: null
      },
      { new: true }
    )

    if (!ticketData) {
      return interaction.reply({
        content:
          'No se encontró un ticket válido asociado a este canal para reasignar.',
        ephemeral: true
      })
    }

    const ticketChannel = interaction.channel

    try {
      await ticketChannel.permissionOverwrites.set([
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
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
    } catch (err) {
      console.error('Ha habido un problema reasignando el ticket.', err)
      return interaction.reply({
        content:
          'Hubo un error al reasignar el ticket, por favor contacta con la administración.',
        ephemeral: true
      })
    }

    const Buttons = new ActionRowBuilder()
    try {
      if (ticketConfig.claimable.enabled) {
        const claimButton =
          Object.keys(ticketConfig.buttons.claim).length !== 0
            ? new ButtonBuilder(ticketConfig.buttons.claim)
            : new ButtonBuilder()
                .setCustomId('claim-ticket')
                .setLabel('Reclamar')
                .setEmoji('🔓')
                .setStyle(ButtonStyle.Success)

        Buttons.addComponents(claimButton)
      } else {
        const closeButton =
          Object.keys(ticketConfig.buttons.close).length !== 0
            ? new ButtonBuilder(ticketConfig.buttons.close)
            : new ButtonBuilder()
                .setCustomId('close-ticket')
                .setLabel('Cerrar Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)

        Buttons.addComponents(closeButton)
      }

      await interaction.message.edit({ components: [Buttons] })
    } catch (err) {
      console.error(
        'Hubo un error agregando los botones al Embed del ticket',
        err
      )
      await interaction.channel.send({
        content: 'Ha habido un error asignando los botones al embed del ticket.'
      })
    }

    let embed
    try {
      if (
        ticketConfig.embeds.reassigned &&
        Object.keys(ticketConfig.embeds.reassigned).length > 0
      ) {
        const formattedCustomEmbedData = formatEmbedData(
          interaction,
          ticketConfig.embeds.reassigned,
          formatDynamicText
        )

        embed = new EmbedBuilder(formattedCustomEmbedData)
      } else {
        embed = new EmbedBuilder()
          .setColor('Blue')
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.avatarURL()
          })
          .setTitle(`Ticket Reasignado`)
          .setDescription(
            'El ticket ha sido reasignado. Por favor espera a que un nuevo Staff lo reclame.'
          )
          .setFooter({
            text: `${interaction.guild.name}`
          })
          .setTimestamp(Date.now())
      }

      await interaction.channel.send({ embeds: [embed] })
    } catch (err) {
      console.error(
        'Hubo un error al enviar el embed de reasignación en el ticket',
        err
      )
      await interaction.channel.send({
        content: 'Ha habido un error enviando el Embed de reasignación.'
      })
    }

    await interaction.reply({
      content: 'Ticket reasignado satisfactoriamente.',
      ephemeral: true
    })
  }
}
