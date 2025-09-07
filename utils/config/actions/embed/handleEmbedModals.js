const { EmbedBuilder } = require('discord.js')
const TicketConfig = require('../../../../db/schemas/Tickets/TicketConfig')
const editEmbed = require('./editEmbed')
const formatDynamicText = require('../../../formatTag')
const formatEmbedData = require('../../../formatEmbed')

/**
 * Envía un mensaje de seguimiento con la previsualización del embed.
 * @param {object} interaction La interacción de Discord.
 * @param {EmbedBuilder} embed El EmbedBuilder a previsualizar.
 */
async function sendEmbedPreview(interaction, embed) {
  // Asegurarse de que el embed tenga un título o una descripción por defecto si no existen
  const embedData = formatEmbedData(
    interaction,
    embed.toJSON(),
    formatDynamicText
  )

  const previewEmbed = new EmbedBuilder(embedData)

  if (!embedData.title && !embedData.description) {
    embed.setTitle('Embed Vacío: Título por Defecto')
    embed.setDescription('Descripción por Defecto')
  }

  // Enviar el mensaje de previsualización
  await interaction.followUp({
    embeds: [previewEmbed],
    ephemeral: true // Esto hace que el mensaje solo sea visible para el usuario que lo activó
  })
}

/**
 * Maneja el envío de formularios (modals) para la edición de embeds.
 * @param {object} interaction La interacción de Discord.
 */
async function handleEmbedModals(interaction) {
  const customId = interaction.customId

  // Analizar el customId dinámico del modal (ej: 'edit-title-panel-modal')
  const [action, field, embedType, modalSuffix] = customId.split('-')

  if (modalSuffix === 'modal') {
    const ticketConfig = await TicketConfig.findOne({
      Guild: interaction.guild.id
    })
    if (!ticketConfig) {
      return interaction.followUp({
        content: 'No se encontró la configuración de tickets.',
        ephemeral: true
      })
    }

    const newValue = interaction.fields.getTextInputValue(`${field}Input`)

    // Obtener los datos del embed existentes, o un objeto vacío si no hay datos
    const existingEmbedData = ticketConfig.embeds[embedType] || {}

    // Crear una nueva instancia de EmbedBuilder a partir de los datos existentes
    const embedBuilder = new EmbedBuilder(existingEmbedData)

    // Usar un switch para aplicar el cambio correcto al EmbedBuilder
    switch (field) {
      case 'title':
        embedBuilder.setTitle(newValue)
        break
      case 'description':
        embedBuilder.setDescription(newValue)
        break
      // TODO: Agregar más casos para otros campos como 'footer', 'image', etc.
    }

    // Guardar la representación toJSON() del embed actualizado en la base de datos
    ticketConfig.embeds[embedType] = embedBuilder.toJSON()
    await ticketConfig.save()

    await interaction.deferUpdate()

    // Enviar el mensaje de previsualización antes de redirigir
    await sendEmbedPreview(interaction, embedBuilder)

    // Redirigir de nuevo a la pantalla de edición de ese embed
    await editEmbed(interaction, ticketConfig, embedType)
  }
}

module.exports = handleEmbedModals
