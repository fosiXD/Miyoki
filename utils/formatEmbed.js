/**
 * Formatea un objeto de datos de embed de Discord, aplicando una función de formato de texto dinámico
 * a las propiedades de cadena relevantes.
 * @param {import('discord.js').Interaction} interaction El objeto de interacción de Discord.js.
 * @param {Object} embedData El objeto de datos del embed a formatear.
 * @param {function(import('discord.js').Interaction, string): string} formatText La función para formatear el texto dinámico (ej. formatDynamicText).
 * @returns {Object} El objeto de datos del embed con las cadenas formateadas.
 */
function formatEmbedData(interaction, embedData, formatText) {
  // Clonamos el objeto para no modificar el original
  const formattedEmbed = { ...embedData }

  // Propiedades de primer nivel
  if (typeof formattedEmbed.title === 'string') {
    formattedEmbed.title = formatText(interaction, formattedEmbed.title)
  }
  if (typeof formattedEmbed.description === 'string') {
    formattedEmbed.description = formatText(
      interaction,
      formattedEmbed.description
    )
  }
  if (typeof formattedEmbed.url === 'string') {
    // Si tu URL puede tener tags
    formattedEmbed.url = formatText(interaction, formattedEmbed.url)
  }
  if (typeof formattedEmbed.color === 'string') {
    // Si tu color puede ser una cadena formateable (menos común)
    formattedEmbed.color = formatText(interaction, formattedEmbed.color)
  }

  // Propiedades anidadas (Autor)
  if (formattedEmbed.author && typeof formattedEmbed.author.name === 'string') {
    formattedEmbed.author.name = formatText(
      interaction,
      formattedEmbed.author.name
    )
  }
  if (formattedEmbed.author && typeof formattedEmbed.author.url === 'string') {
    formattedEmbed.author.url = formatText(
      interaction,
      formattedEmbed.author.url
    )
  }
  if (
    formattedEmbed.author &&
    typeof formattedEmbed.author.icon_url === 'string'
  ) {
    formattedEmbed.author.icon_url = formatText(
      interaction,
      formattedEmbed.author.icon_url
    )
  }

  // Propiedades anidadas (Footer)
  if (formattedEmbed.footer && typeof formattedEmbed.footer.text === 'string') {
    formattedEmbed.footer.text = formatText(
      interaction,
      formattedEmbed.footer.text
    )
  }
  if (
    formattedEmbed.footer &&
    typeof formattedEmbed.footer.icon_url === 'string'
  ) {
    formattedEmbed.footer.icon_url = formatText(
      interaction,
      formattedEmbed.footer.icon_url
    )
  }

  // Propiedades anidadas (Imagen y Miniatura)
  if (formattedEmbed.image && typeof formattedEmbed.image.url === 'string') {
    formattedEmbed.image.url = formatText(interaction, formattedEmbed.image.url)
  }
  if (
    formattedEmbed.thumbnail &&
    typeof formattedEmbed.thumbnail.url === 'string'
  ) {
    formattedEmbed.thumbnail.url = formatText(
      interaction,
      formattedEmbed.thumbnail.url
    )
  }

  // Campos (Fields) - Requiere iteración
  if (Array.isArray(formattedEmbed.fields)) {
    formattedEmbed.fields = formattedEmbed.fields.map((field) => {
      const newField = { ...field } // Clonar el campo para no mutar el original
      if (typeof newField.name === 'string') {
        newField.name = formatText(interaction, newField.name)
      }
      if (typeof newField.value === 'string') {
        newField.value = formatText(interaction, newField.value)
      }
      return newField
    })
  }

  return formattedEmbed
}

module.exports = formatEmbedData // Exporta esta función
