const { Events } = require('discord.js')
const Tickets = require('../../db/schemas/Tickets/Tickets')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignora mensajes de bots o si el autor no tiene el rol de staff.
    if (message.author.bot) return

    // Búsqueda del ticket. Si no es un canal de ticket, se ignora.
    const ticketData = await Tickets.findOne({ ChannelID: message.channel.id })
    if (!ticketData) return

    const ticketConfig = await TicketConfig.findOne({ Guild: message.guild.id })

    // Verifica si el autor del mensaje es un Staff usando su rol.
    const staffRoles = ticketConfig.staffs || []
    const isStaff = message.member?.roles.cache.some((role) =>
      staffRoles.includes(role.id)
    )

    if (isStaff) {
      const staffId = message.author.id

      try {
        // Paso 1: Elimina el ID del staff de la lista si ya existe.
        await Tickets.updateOne(
          { _id: ticketData._id },
          { $pull: { Staff: staffId } }
        )

        // Paso 2: Añade el ID del staff al final de la lista.
        await Tickets.updateOne(
          { _id: ticketData._id },
          { $push: { Staff: staffId } }
        )
      } catch (err) {
        console.error('Error al actualizar la lista de Staff del ticket:', err)
      }
    }
  }
}
