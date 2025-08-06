const {
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js')
const Tickets = require('../../db/schemas/Tickets/Tickets')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
const formatDynamicText = require('../../utils/formatTag')
const formatEmbedData = require('../../utils/formatEmbed')

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    if (interaction.customId !== 'open-ticket') return

    const openedTicket = await Tickets.findOne({ User: interaction.user.id })

    if (openedTicket && openedTicket.Status !== 'Completed')
      return interaction.reply({
        content: `Ya tienes un ticket abierto. <#${openedTicket.ChannelID}>`,
        ephemeral: true
      })

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

    const parent = ticketConfig.openingChannel.parent
    const channelName = !!ticketConfig.openingChannel.name
      ? formatDynamicText(interaction, ticketConfig.openingChannel.name)
      : formatDynamicText(interaction, 'ticket-{user}')

    let ticketChannel
    try {
      ticketChannel = await interaction.guild.channels.create({
        name: channelName,
        parent: parent,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
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
        ]
      })
    } catch (err) {
      console.error('Error creando el canal del ticket:', err)
      return interaction.reply({
        content:
          'Ha habido un error creando el canal del ticket. Por favor revisa la configuración de permisos del bot o la categoría padre.',
        ephemeral: true
      })
    }

    // Guardar datos en la base de datos
    const newData = await Tickets.create({
      Guild: interaction.guild.id,
      User: interaction.user.id,
      ChannelID: ticketChannel.id
    })

    let embed

    if (Object.keys(ticketConfig.embeds.opening || {}).length !== 0) {
      const formattedCustomEmbedData = formatEmbedData(
        interaction,
        ticketConfig.embeds.opening,
        formatDynamicText
      )
      embed = new EmbedBuilder(formattedCustomEmbedData)
    } else {
      // Si no hay configuración de embed personalizada, creamos el embed con valores por defecto
      embed = new EmbedBuilder()
        .setColor('1742d1')
        .setTitle(`Ticket de ${interaction.user.username}`)
        .setDescription(
          'Muchas gracias por abrir un ticket.\n\nMientras le atendemos, por favor vaya comentando su problema.'
        )
        .setThumbnail(interaction.user.avatarURL())
        .setFooter({
          text: `${interaction.guild.name} | ID: ${newData._id}`
        })
        .setTimestamp(Date.now())
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
    } catch (err) {
      console.error(
        'Hubo un error agregando los botones al Embed del ticket',
        err
      )
      await interaction.channel.send({
        content: 'Ha habido un error asignando los botones al embed del ticket.'
      })
    }

    const ticketEmbed = await ticketChannel
      .send({ embeds: [embed] })
      .catch(async (err) => {
        console.error(
          'Ha habido un error al enviar el Embed al crear el ticket.',
          err
        ) // TODO: Añadir opciones para cerrar el ticket en caso de dar error
        await ticketChannel.send({
          content:
            'Ha habido un error enviando el embed del ticket. Por favor revisa la configuración.'
        })
      })

    await ticketEmbed.edit({ components: [Buttons] }).catch(async (err) => {
      console.error(
        'Ha habido un error al añadir el botón para el ticket. Por favor revisa la configuración.',
        err
      )
      ticketChannel.send({
        content:
          'Ha habido un error enviando el embed del ticket. Por favor revisa la configuración.'
      })
    })

    await interaction
      .reply({ content: `Ticket creado. ${ticketChannel}`, ephemeral: true })
      .catch(async (err) => {
        console.error('Error creando el canal del ticket.', err)
        return interaction.followUp({
          content:
            'Ha habido un error creando el canal del ticket. Por favor revisa la configuración.',
          ephemeral: true
        })
      })
  }
}
