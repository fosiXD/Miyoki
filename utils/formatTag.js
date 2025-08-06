/**
 * Formatea una cadena de texto reemplazando los tags entre llaves con valores dinámicos
 * obtenidos del objeto de interacción de Discord.js.
 * @param {import('discord.js').Interaction} interaction - El objeto de interacción de Discord.js.
 * @param {string} textTemplate - La cadena de texto que puede contener tags entre llaves, por ejemplo, "¡Hola, {user}!".
 * @returns {string} La cadena de texto formateada con los valores dinámicos.
 */
function formatDynamicText(interaction, textTemplate, ticketData = null) {
  // Objeto de nombres dinámicos. Se construye dentro de la función para usar el 'interaction' actual.
  const dynamicValues = {
    user: interaction.user.username,
    memberDisplay: interaction.member.displayName
  }

  if (ticketData) {
    dynamicValues.ticket_id = ticketData._id // <--- Probablemente la línea 13
    dynamicValues.ticket_owner = `<@${ticketData.User}>`
  }

  // Usa una expresión regular global para encontrar TODAS las ocurrencias de tags.
  // g: búsqueda global, i: insensible a mayúsculas/minúsculas (opcional, pero a menudo útil para tags)
  return textTemplate.replace(/\{([^}]+)\}/g, (match, tagName) => {
    // Verifica si el tag extraído existe en nuestro objeto dynamicValues
    if (Object.prototype.hasOwnProperty.call(dynamicValues, tagName)) {
      return dynamicValues[tagName] // Retorna el valor dinámico
    }
    return match // Si el tag no se encuentra, retorna el tag original (ej. "{unfoundTag}")
  })
}

module.exports = formatDynamicText
