const { Events } = require('discord.js')
const Tickets = require('../../db/schemas/Tickets/Tickets') // Ruta a tu esquema de Tickets
const closeTicket = require('../../utils/closeTicket') // Ruta a tu función closeTicket

module.exports = {
  name: Events.ChannelDelete,
  async execute(channel) {
    // Ignorar si el canal no es un canal de texto o no está en un gremio
    if (channel.type !== 0 || !channel.guild) {
      return
    }

    try {
      // Buscar un ticket que coincida con el ID del canal eliminado
      const ticketData = await Tickets.findOne({ ChannelID: channel.id })

      // Si se encuentra un ticket asociado a este canal
      if (ticketData) {
        // Verificar si el ticket ya está marcado como 'Completed' o 'Closed'
        // Esto es para evitar intentar cerrar un ticket que ya ha sido procesado
        if (ticketData.Status === 'Completed') {
          return
        }

        await closeTicket(
          channel,
          channel.client.user, // El bot es quien registra el cierre en este caso
          'Canal Eliminado Externamente', // Razón del cierre
          channel.guild,
          null // No hay interacción de origen, ya que el canal fue eliminado directamente
        )
      }
    } catch (error) {
      console.error(
        `Error al manejar la eliminación del canal ${channel.id} para tickets:`,
        error
      )
    }
  }
}
