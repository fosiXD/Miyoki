const { EmbedBuilder, AttachmentBuilder } = require('discord.js') // Asegúrate de importar AttachmentBuilder
const Tickets = require('../db/schemas/Tickets/Tickets')
const TicketConfig = require('../db/schemas/Tickets/TicketConfig')
const formatDynamicText = require('../utils/formatTag')
const formatEmbedData = require('../utils/formatEmbed')
const formatDuration = require('../utils/formatDuration')
const discordTranscripts = require('discord-html-transcripts')

/**
 * Registra los detalles del cierre de un ticket en el canal de logs configurado.
 * @param {import('discord.js').TextChannel} channel - El canal del ticket que fue o será cerrado.
 * @param {object} ticketConfig - El objeto de configuración del ticket del servidor.
 * @param {object} ticketData - Los datos del ticket que acaba de ser cerrado/actualizado.
 * @param {import('discord.js').User} closerUser - El usuario (o el bot) que está cerrando el ticket.
 * @param {import('discord.js').Interaction | null} [sourceInteraction=null] - (Opcional) La interacción original si el cierre fue por botón/comando.
 */
async function logTicket(
  channel,
  ticketConfig,
  ticketData,
  closerUser,
  sourceInteraction = null
) {
  const logChannelID = ticketConfig.loggable.channel
  const logChannel = await channel.guild.channels.cache.get(logChannelID)

  if (!logChannel) {
    const targetForWarning = sourceInteraction ? sourceInteraction : channel
    if (targetForWarning.replied || targetForWarning.deferred) {
      await targetForWarning
        .followUp({
          content:
            'Advertencia: No se pudo encontrar el canal de logs para enviar el transcript del ticket. Contacta a un administrador.',
          ephemeral: true
        })
        .catch(console.error)
    } else {
      await targetForWarning
        .send({
          content:
            'Advertencia: No se pudo encontrar el canal de logs para enviar el transcript del ticket. Contacta a un administrador.',
          ephemeral: true
        })
        .catch(console.error)
    }
    return
  }

  let user
  try {
    const memberObj = await channel.guild.members.fetch(ticketData.User)
    user = memberObj.user
  } catch (err) {
    console.error(
      `Error al obtener el dueño del ticket (${ticketData.User}) para el embed del log:`,
      err
    )
    user = { username: 'Usuario Desconocido', avatarURL: () => null }
  }

  const openedDurationMs = ticketData.ClosedAt - ticketData.OpenedAt
  const formattedDuration = formatDuration(openedDurationMs)

  const creationTimestampSeconds = Math.floor(ticketData.OpenedAt / 1000)
  const closedTimestampSeconds = Math.floor(ticketData.ClosedAt / 1000)

  let embed
  try {
    if (
      ticketConfig.embeds.log &&
      Object.keys(ticketConfig.embeds.log).length !== 0
    ) {
      const context = sourceInteraction || {
        guild: channel.guild,
        channel: channel,
        user: closerUser
      }
      embed = new EmbedBuilder(
        formatEmbedData(
          context,
          ticketConfig.embeds.log,
          formatDynamicText,
          ticketData
        )
      )
    } else {
      embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`Ticket Cerrado: ${channel.name}`)
        .setThumbnail(user.avatarURL())
        .addFields(
          {
            name: '🔗 ID del Ticket',
            value: `\`\`\`${ticketData._id}\`\`\``,
            inline: true
          },
          {
            name: '👤 Abierto por',
            value: `<@${ticketData.User}>`,
            inline: true
          },
          { name: '🔒 Cerrado por', value: `${closerUser}`, inline: true },
          {
            name: '📅 Fecha de Creación',
            value: `<t:${creationTimestampSeconds}:f>`,
            inline: true
          },
          {
            name: ' Fecha de Cierre',
            value: `<t:${closedTimestampSeconds}:f>`,
            inline: true
          },
          {
            name: '⌛ Tiempo Abierto',
            value: `\`\`\`${formattedDuration}\`\`\``,
            inline: false
          },
          {
            name: 'Razón de Cierre',
            value: `\`\`\`${ticketData.ClosedReason || 'N/A'}\`\`\``,
            inline: false
          }
        )
        .setFooter({ text: `${channel.guild.name} | Logs` })
        .setTimestamp(Date.now())
    }

    let transcriptAttachment
    try {
      // *** CAMBIO CRUCIAL AQUÍ: returnBuffer: true ***
      transcriptAttachment = await discordTranscripts.createTranscript(
        channel,
        {
          limit: -1,
          returnBuffer: true, // <-- ¡Esto es lo que necesitas!
          fileName: `${ticketData._id}-transcript.html`
        }
      )
    } catch (err) {
      console.error('Error al crear el transcript del ticket:', err)
      await logChannel
        .send({
          content: `Advertencia: No pude crear el transcript para el ticket ${channel.name}.`
        })
        .catch(console.error)
    }

    await logChannel.send({ files: [transcriptAttachment], embeds: [embed] })
  } catch (err) {
    console.error(
      'Hubo un error al enviar el embed del log (y/o transcript).',
      err
    )
    const targetForError = sourceInteraction ? sourceInteraction : channel
    if (targetForError.replied || targetForError.deferred) {
      await targetForError
        .followUp({
          content: `Advertencia: Ocurrió un error al enviar el log del ticket ${channel.name}.`
        })
        .catch(console.error)
    } else {
      await targetForError
        .followUp({
          content: `Advertencia: Ocurrió un error al enviar el log del ticket ${channel.name}.`
        })
        .catch(console.error)
    }
  }
}

module.exports = logTicket
