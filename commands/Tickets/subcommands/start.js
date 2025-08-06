const {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js')
const TicketConfig = require('../../../db/schemas/Tickets/TicketConfig')
const formatEmbedData = require('../../../utils/formatEmbed')
const formatDynamicText = require('../../../utils/formatTag')

async function startTickets(interaction) {
  const channel = interaction.options.getChannel('canal')
  const data = await TicketConfig.findOne({ Guild: interaction.guild.id })

  if (!data) {
    return interaction.reply({
      content:
        'El sistema de tickets no está configurado. Por favor utiliza `/ticket initiate-config` para comenzar.'
    })
  }

  try {
    data.panelChannel = channel.id
    await data.save()

    let embed

    if (Object.keys(data.embeds.panel || {}).length !== 0) {
      const formattedCustomEmbedData = formatEmbedData(
        interaction,
        data.embeds.panel,
        formatDynamicText
      )

      embed = new EmbedBuilder(formattedCustomEmbedData)
    } else {
      embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('Crea un Ticket')
        .setThumbnail(interaction.guild.iconURL())
        .setDescription(
          'Haz click en el botón de abajo para crear un nuevo ticket.'
        )
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL()
        })
        .setTimestamp()
    }

    const button =
      Object.keys(data.buttons.open).length !== 0
        ? new ButtonBuilder(data.buttons.open)
        : new ButtonBuilder()
            .setCustomId('open-ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📭')
            .setLabel('Crear Ticket')

    const row = new ActionRowBuilder().addComponents(button)
    await channel
      .send({ embeds: [embed], components: [row] })
      .then(async () => {
        await interaction.reply({
          content: `Panel enviado correctamente a ${channel}`,
          ephemeral: true
        })
      })
  } catch (err) {
    console.error('Hubo un error al inicializar el sistema de tickets: ', err)
    return interaction.reply({
      content:
        'Ha habido un problema al inicializar el sistema de tickets. Intenta nuevamente o contacta al equipo de soporte.',
      ephemeral: true
    })
  }
}

module.exports = startTickets
