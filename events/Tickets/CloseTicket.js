const { Events } = require('discord.js')
const closeTicket = require('../../utils/closeTicket') // Asegúrate de que esta ruta sea correcta

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // Verifica si la interacción es un botón y su customId es 'close-ticket'
    if (interaction.isButton() && interaction.customId === 'close-ticket') {
      // Llama a la función closeTicket con los parámetros correctos
      await closeTicket(
        interaction.channel, // 'channel'
        interaction.user, // 'closerUser' (el usuario que presionó el botón)
        'Completado', // 'reason' (razón para el cierre)
        interaction.guild, // 'guild'
        interaction, // 'sourceInteraction' (la interacción original del botón)
        false // 'forceClose' (forzar cierre del ticket sin encuesta)
      )
    }
  }
}
