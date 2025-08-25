const { EmbedBuilder } = require('discord.js')
// TODO: Importar otras funciones de edición de embeds (ej: editOpeningEmbed)
const editPanelEmbed = require('./editEmbed')

/**
 * Maneja las interacciones de los menús de selección de embeds.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleEmbedSelectMenus(interaction, ticketConfig) {
  // Se accede al primer valor seleccionado del menú
  const selectedValue = interaction.values[0]
  const customId = interaction.customId

  // El customId del menú de selección determinará la lógica
  if (customId.startsWith('embed-color-')) {
    const embedType = customId.split('-')[2]

    // Se obtienen los datos del embed actual o un objeto vacío
    const existingEmbedData = ticketConfig.embeds[embedType] || {}
    // Se crea un EmbedBuilder con los datos existentes
    const embedBuilder = new EmbedBuilder(existingEmbedData)
    // Se establece el nuevo color usando el valor hexadecimal
    embedBuilder.setColor(selectedValue)

    // Se guarda la representación JSON actualizada del embed
    ticketConfig.embeds[embedType] = embedBuilder.toJSON()
    await ticketConfig.save()

    // Se edita la respuesta para mostrar el menú de edición con el nuevo color
    // TODO: Usar una función de edición dinámica en lugar de hardcodear editPanelEmbed
    await editPanelEmbed(interaction, ticketConfig)
  }
}

module.exports = handleEmbedSelectMenus
