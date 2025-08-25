const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')
const TicketConfig = require('../db/schemas/Tickets/TicketConfig')
const Tickets = require('../db/schemas/Tickets/Tickets')
const formatDynamicText = require('../utils/formatTag')
const formatEmbedData = require('../utils/formatEmbed')
const logTicket = require('./logTicket')
const ticketSurvey = require('./ticketSurvey')

const { activeReminders, activeCloseTimers } = require('./Maps/idleMap')

/**
 * Cierra un ticket de Discord, actualiza la base de datos, envía un mensaje de cierre,
 * genera un transcript y lo loguea.
 * @param {import('discord.js').TextChannel} channel - El canal del ticket a cerrar.
 * @param {import('discord.js').User} closerUser - El usuario (o el bot) que está cerrando el ticket.
 * @param {string} [reason='Desconocida'] - La razón del cierre del ticket (ej: 'Inactividad', 'Manual', 'Resuelto').
 * @param {import('discord.js').Guild} guild - El objeto de gremio (guild) donde se encuentra el ticket.
 * @param {object} [sourceInteraction=null] - (Opcional) La interacción original si el cierre fue por botón/comando.
 * @param {boolean} [forceClose=false] - Si es true, omite la verificación de la encuesta obligatoria.
 */

async function closeTicket(
  channel,
  closerUser,
  reason = 'Desconocida',
  guild,
  sourceInteraction = null,
  forceClose = false
) {
  if (sourceInteraction) await sourceInteraction.deferReply()
  if (!channel || !closerUser || !guild) {
    console.error(
      'closeTicket: Faltan argumentos esenciales (channel, closerUser, guild).'
    )
    await sourceInteraction.followUp({
      content:
        'Error interno al intentar cerrar el ticket: Argumentos incompletos.',
      ephemeral: true
    })
    return
  }

  const ticketConfig = await TicketConfig.findOne({ Guild: guild.id })

  if (!ticketConfig) {
    if (sourceInteraction) {
      await sourceInteraction.reply({
        content:
          'No se ha configurado el sistema de tickets para este servidor. Contacta a un administrador.',
        ephemeral: true
      })
    } else {
      // Si no hay interacción, solo loguear el error
      console.error(
        `closeTicket: No se encontró la configuración del ticket para el servidor ${guild.name} (${guild.id}).`
      )
    }
    return
  }

  // Adaptar las comprobaciones de permisos si se usa desde una interacción
  if (sourceInteraction) {
    const memberRoles = sourceInteraction.member.roles.cache
    const staffRoleIds = ticketConfig.staffs || []
    const managerRoleIds = ticketConfig.managers || []

    const isStaff = staffRoleIds.some((roleId) => memberRoles.has(roleId))
    const isManager = managerRoleIds.some((roleId) => memberRoles.has(roleId))
    const isAdmin = sourceInteraction.member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )

    if (!isStaff && !isManager && !isAdmin) {
      return sourceInteraction.reply({
        content: '¡Solo un Staff, Manager o Admin puede cerrar el ticket!',
        ephemeral: true
      })
    }
  }

  let ticketData
  try {
    ticketData = await Tickets.findOne({ ChannelID: channel.id })
  } catch (err) {
    console.error('Error al buscar el ticket en la base de datos:', err)
    if (sourceInteraction) {
      await sourceInteraction.reply({
        content:
          'Ocurrió un error al buscar los datos del ticket. Por favor, contacta a un administrador.',
        ephemeral: true
      })
    }
    return
  }

  if (!ticketData) {
    if (sourceInteraction) {
      await sourceInteraction.reply({
        content:
          'No se encontró un ticket válido asociado a este canal para cerrar.',
        ephemeral: true
      })
    }
    return
  }

  // ----------------------------------------------------------------------------------
  // --- LÓGICA NUEVA: Manejar encuestas obligatorias antes del cierre definitivo ---
  // ----------------------------------------------------------------------------------
  if (
    ticketConfig.survey.enabled &&
    ticketConfig.survey.isMandatory &&
    !ticketData.Rated &&
    !forceClose
  ) {
    // Si la encuesta es obligatoria y no ha sido calificada, no cerramos el ticket.
    // Actualizamos el estado para indicar que se está esperando la encuesta.
    try {
      await Tickets.findOneAndUpdate(
        { ChannelID: channel.id },
        {
          Status: 'PendingSurvey',
          ClosedReason: reason,
          ClosedBy: closerUser.id
        },
        { new: true }
      )

      const surveyMessage = await ticketSurvey(
        channel,
        ticketConfig,
        ticketData
      )

      if (sourceInteraction) {
        await sourceInteraction.followUp({
          content: 'Cerrando ticket...',
          ephemeral: true
        })
      }

      const forcedCloseButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`force_close_ticket_${ticketData._id}`)
          .setLabel('Forzar Cierre')
          .setStyle(ButtonStyle.Danger)
      )

      const mandatoryEmbed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('Encuesta Obligatoria Pendiente')
        .setDescription(
          `Este ticket no se puede cerrar hasta que el usuario complete la encuesta. Si la encuesta no se completa, un miembro del Staff puede usar el botón de abajo para forzar el cierre.`
        )
        .setFooter({ text: `Ticket ID: ${ticketData._id}` })
        .setTimestamp()

      await channel.send({
        embeds: [mandatoryEmbed],
        components: [forcedCloseButton]
      })
    } catch (err) {
      console.error(
        'Error al gestionar la encuesta obligatoria antes del cierre:',
        err
      )
      if (sourceInteraction) {
        await sourceInteraction.followUp({
          content:
            'Ocurrió un error al gestionar la encuesta obligatoria. Contacta a un administrador.',
          ephemeral: true
        })
      }
    }
    return // Salir de la función para evitar el cierre definitivo
  }

  // Si llegamos aquí, significa que la encuesta no es obligatoria, ya se completó, o es un cierre forzado.
  // Proceder con el cierre normal.
  try {
    const updatedTicketData = await Tickets.findOneAndUpdate(
      { ChannelID: channel.id },
      {
        Status: 'Completed',
        ClosedAt: Date.now(),
        ClosedReason: reason, // Guardar la razón del cierre
        ClosedBy: closerUser.id // Guardar quién lo cerró
      },
      { new: true }
    )
    ticketData = updatedTicketData
  } catch (err) {
    console.error(
      'Error al actualizar el ticket en la base de datos para cerrar:',
      err
    )
    if (sourceInteraction) {
      await sourceInteraction.reply({
        content:
          'Ocurrió un error al actualizar los datos del ticket para cerrar. Por favor, contacta a un administrador.',
        ephemeral: true
      })
    }
    return
  }

  // Si hay una interacción, intenta editar su mensaje para quitar los botones.
  // Esto se aplica si el cierre viene de un botón.
  if (sourceInteraction && sourceInteraction.message) {
    await sourceInteraction.message.edit({ components: [] }).catch((err) => {
      console.error(
        'Error al eliminar los botones del mensaje de interacción:',
        err
      )
    })
  }

  const closeDelayMs = 5000
  const closeTimestampSeconds = Math.floor((Date.now() + closeDelayMs) / 1000)
  const hammeredTime = `<t:${closeTimestampSeconds}:R>`

  // --- Enviar Embed de Cierre al Canal ---
  let closeEmbed
  try {
    if (
      ticketConfig.embeds.closing &&
      Object.keys(ticketConfig.embeds.closing).length > 0
    ) {
      closeEmbed = new EmbedBuilder(
        formatEmbedData(
          sourceInteraction || { channel: channel, guild: guild },
          ticketConfig.embeds.closing,
          formatDynamicText,
          ticketData
        )
      )
    } else {
      closeEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle(`Ticket Cerrado`)
        .setDescription(
          `Este ticket ha sido cerrado por ${closerUser}. Se eliminará ${hammeredTime}.`
        )
        .setFooter({
          text: `${guild.name} | Ticket ID: ${ticketData._id}`
        })
        .setTimestamp(Date.now())
    }
    await channel.send({ embeds: [closeEmbed] })
  } catch (err) {
    console.error(
      'Hubo un error al enviar el embed de cierre en el ticket',
      err
    )
    if (sourceInteraction) {
      await sourceInteraction.followUp({
        content:
          'Ha habido un error enviando el Embed de cierre del ticket. Un administrador debería revisar esto.',
        ephemeral: true
      })
    } else {
      await channel
        .send({
          content:
            'Ha habido un error enviando el Embed de cierre del ticket. (Automático)'
        })
        .catch(console.error)
    }
  }

  // Lógica para limpiar los temporizadores
  if (activeReminders.has(channel.id)) {
    clearTimeout(activeReminders.get(channel.id))
    activeReminders.delete(channel.id)
  }
  if (activeCloseTimers.has(channel.id)) {
    clearTimeout(activeCloseTimers.get(channel.id))
    activeCloseTimers.delete(channel.id)
  }

  // --- Generar y Enviar Transcript (si los logs están habilitados) ---
  if (ticketConfig.loggable && ticketConfig.loggable.enabled) {
    await logTicket(
      channel,
      ticketConfig,
      ticketData,
      closerUser,
      sourceInteraction
    )
  }

  // --- Iniciar proceso de valoración de ticket (solo si no es obligatorio y el ticket no ha sido calificado)
  if (
    ticketConfig.survey &&
    ticketConfig.survey.enabled &&
    !ticketConfig.survey.isMandatory &&
    !ticketData.Rated
  ) {
    await ticketSurvey(channel, ticketConfig, ticketData)
  }

  // --- Respuesta Final a la Interacción (mensaje de cuenta regresiva) ---
  if (sourceInteraction) {
    await sourceInteraction.followUp({
      content: 'Cerrando ticket...',
      ephemeral: true
    })
  }

  // --- Programar Eliminación del Canal ---
  setTimeout(async () => {
    try {
      // Asegúrate de que el canal aún existe antes de intentar eliminarlo
      const currentChannel = guild.channels.cache.get(channel.id)
      if (currentChannel) {
        await currentChannel.delete()
      }
    } catch (err) {
      console.error('Hubo un error eliminando el canal del ticket.', err)
      // Solo intentar followUp si hay una interacción original y sigue siendo válida
      if (
        sourceInteraction &&
        !sourceInteraction.replied &&
        !sourceInteraction.deferred
      ) {
        await sourceInteraction
          .followUp({
            content:
              'Hubo un error al eliminar el canal. Por favor chequea los permisos. (Este mensaje es solo visible para ti)',
            ephemeral: true
          })
          .catch(console.error)
      }
    }
  }, closeDelayMs)
}

module.exports = closeTicket
