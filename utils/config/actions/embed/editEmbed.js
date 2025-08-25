const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')

/**
 * Muestra la interfaz de edición para un embed específico.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 * @param {string} embedType El tipo de embed a editar (ej: 'panel', 'opening').
 */
async function editEmbed(interaction, ticketConfig, embedType) {
  // Se obtiene el objeto embedData del tipo de embed especificado
  const embedData = ticketConfig.embeds[embedType] || {}

  // Crea el embed actual con los datos guardados o valores por defecto genéricos
  const embed = new EmbedBuilder()
    .setTitle(
      embedData?.title ||
        `Título del Embed de ${
          embedType.charAt(0).toUpperCase() + embedType.slice(1)
        }`
    )
    .setDescription(
      embedData?.description ||
        `Descripción del embed de ${
          embedType.charAt(0).toUpperCase() + embedType.slice(1)
        }`
    )
    .setColor(embedData?.color || 'Grey')

  // Botones para las opciones de edición. Los Custom IDs son ahora dinámicos.
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`edit-title-${embedType}`)
      .setLabel('Editar Título')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`edit-description-${embedType}`)
      .setLabel('Editar Descripción')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`edit-color-${embedType}`)
      .setLabel('Editar Color')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`edit-image-${embedType}`)
      .setLabel('Editar Imagen')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`edit-thumbnail-${embedType}`)
      .setLabel('Editar Miniatura')
      .setStyle(ButtonStyle.Primary)
  )

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`edit-fields-${embedType}`)
      .setLabel('Añadir/Eliminar Campos')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('go-back-to-embed-menu')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
  )

  await interaction.editReply({
    embeds: [embed],
    components: [row1, row2]
  })
}

module.exports = editEmbed
