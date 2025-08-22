const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')

/**
 * Muestra un menú de selección para establecer el canal de anuncio de encuestas.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function editSurveyAnnounceChannel(interaction, ticketConfig) {
  const guildChannels = interaction.guild.channels.cache
    .filter((channel) => channel.type === 0) // Filtra solo canales de texto
    .sort((a, b) => a.position - b.position)
    .map((channel) =>
      new StringSelectMenuOptionBuilder()
        .setLabel(`#${channel.name}`)
        .setValue(channel.id)
        .setDefault(channel.id === ticketConfig.survey.announceChannel)
    )

  const channelSelectMenu = new StringSelectMenuBuilder()
    .setCustomId('survey-announce-channel-select')
    .setPlaceholder('Selecciona un canal para los anuncios')
    .addOptions(guildChannels)

  const selectRow = new ActionRowBuilder().addComponents(channelSelectMenu)

  const embed = new EmbedBuilder()
    .setColor('DarkOrange')
    .setTitle('Canal de Anuncio de Encuestas 📬')
    .setDescription(
      'Selecciona el canal donde se publicarán los anuncios de encuestas. Esto solo aplica si la encuesta no es obligatoria.'
    )

  const backButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('go-back-to-surveys')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Primary)
  )

  await interaction.editReply({
    embeds: [embed],
    components: [selectRow, backButton],
    ephemeral: true
  })
}

module.exports = editSurveyAnnounceChannel
