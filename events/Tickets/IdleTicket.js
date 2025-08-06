const { Events, EmbedBuilder } = require('discord.js') // Ensure EmbedBuilder is imported
const Tickets = require('../../db/schemas/Tickets/Tickets')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
const formatDynamicText = require('../../utils/formatTag')
const formatEmbedData = require('../../utils/formatEmbed')
const formatDuration = require('../../utils/formatDuration')
const closeTicket = require('../../utils/closeTicket') // <--- Ruta corregida: quitado el espacio extra

// This Map will store our timers. Key: Channel ID, Value: setTimeout ID
const { activeReminders, activeCloseTimers } = require('../../utils/Maps/idleMap')

module.exports = {
  name: Events.MessageCreate,

  async execute(message) {
    // Ignore bot messages to prevent infinite loops or unwanted reminders
    if (message.author.bot) return

    // Ensure the message is in a guild channel
    if (!message.guild || !message.channel) return

    const ticketData = await Tickets.findOne({ ChannelID: message.channel.id })

    // If it's not a ticket channel, or no ticket data found, do nothing
    if (!ticketData) return

    if (ticketData.Status === 'Idle') {
      ticketData.Status = 'Active'
      await ticketData.save()
    }

    const ticketConfig = await TicketConfig.findOne({ Guild: message.guild.id })

    // If no ticket config is found or idle reminders are not enabled, do nothing
    if (!ticketConfig || !ticketConfig.idle || !ticketConfig.idle.reminder) {
      // Clear any existing reminder if config changes and reminder is disabled
      if (activeReminders.has(message.channel.id)) {
        clearTimeout(activeReminders.get(message.channel.id))
        activeReminders.delete(message.channel.id)
      }
      // Clear any existing close timer if config changes and feature is disabled
      if (activeCloseTimers.has(message.channel.id)) {
        clearTimeout(activeCloseTimers.get(message.channel.id))
        activeCloseTimers.delete(message.channel.id)
      }
      return
    }

    const reminderTimeMs = ticketConfig.idle.reminder
    const closeTimeMs = ticketConfig.idle.close

    // --- Restart All Timers on New Activity ---

    // 1. Clear any existing reminder for this ticket
    if (activeReminders.has(message.channel.id)) {
      clearTimeout(activeReminders.get(message.channel.id))
      activeReminders.delete(message.channel.id)
    }

    // 2. Clear any existing close timer for this ticket
    if (activeCloseTimers.has(message.channel.id)) {
      clearTimeout(activeCloseTimers.get(message.channel.id))
      activeCloseTimers.delete(message.channel.id)
    }

    // --- Schedule a new reminder ---
    const reminderTimeoutId = setTimeout(async () => {
      try {
        // Ensure the channel still exists before sending
        const channel = message.guild.channels.cache.get(message.channel.id)
        if (!channel) {
          activeReminders.delete(message.channel.id) // Clean up if channel is gone
          activeCloseTimers.delete(message.channel.id) // Also clean up associated close timer
          return
        }

        ticketData.Status = 'Idle'
        await ticketData.save()

        // Fetch the ticket owner to send DM
        const ticketOwner = await message.client.users.fetch(ticketData.User)
        if (!ticketOwner) {
          console.warn(
            `Could not fetch ticket owner ${ticketData.User} for reminder in channel ${message.channel.id}`
          )
          // Continue to send in channel if DM is not possible
        }

        // --- Send Reminder Embed in Ticket Channel ---
        let embed
        if (
          ticketConfig.embeds &&
          ticketConfig.embeds.idleReminder &&
          Object.keys(ticketConfig.embeds.idleReminder).length > 0
        ) {
          // Assuming you have formatEmbedData and formatDynamicText imported
          embed = new EmbedBuilder(
            formatEmbedData(
              message,
              ticketConfig.embeds.idleReminder,
              formatDynamicText
            )
          )
        } else {
          // Default reminder embed for the channel
          embed = new EmbedBuilder()
            .setColor('Yellow')
            .setTitle('Ticket Inactivo')
            .setDescription(
              `Este ticket ha estado inactivo por un tiempo. ¿Necesitas más ayuda, <@${ticketData.User}>?`
            )
            .setFooter({
              text: `Si no hay actividad en ${formatDuration(
                closeTimeMs
              )} el ticket podría ser cerrado.`
            })
            .setTimestamp()
        }

        await channel.send({
          content: `<@${ticketData.User}>`, // Ping the user
          embeds: [embed]
        })

        // --- Send Reminder to User's DM ---
        if (ticketOwner) {
          let dmEmbed
          if (
            ticketConfig.embeds &&
            ticketConfig.embeds.idleReminderDM &&
            Object.keys(ticketConfig.embeds.idleReminderDM).length > 0
          ) {
            // Use a separate embed config for DM if needed, or reuse idleReminder
            dmEmbed = new EmbedBuilder(
              formatEmbedData(
                message,
                ticketConfig.embeds.idleReminderDM,
                formatDynamicText
              )
            )
          } else {
            // Default reminder embed for DM
            dmEmbed = new EmbedBuilder()
              .setColor('Yellow')
              .setTitle('Tu ticket está inactivo')
              .setDescription(
                `Hola ${ticketOwner.username},\n\nTu ticket en ${message.guild.name} ha estado inactivo. ¿Todavía necesitas ayuda?\n\n[Ir al Ticket](https://discord.com/channels/${message.guild.id}/${message.channel.id})`
              )
              .setFooter({ text: `Ticket: #${message.channel.name}` })
              .setTimestamp()
          }
          await ticketOwner.send({ embeds: [dmEmbed] }).catch((dmErr) => {
            console.error(
              `Could not send DM reminder to ${ticketOwner.username} (${ticketOwner.id}):`,
              dmErr
            )
            // This usually means the user has DMs disabled for bots.
          })
        }

        // After sending the reminder, clear it from the map (as it's done its job)
        activeReminders.delete(message.channel.id)
      } catch (error) {
        console.error(
          `Error sending idle reminder for ticket ${message.channel.id}:`,
          error
        )
        // Clean up both timers even on an error in sending the reminder
        activeReminders.delete(message.channel.id)
        activeCloseTimers.delete(message.channel.id)
      }
    }, reminderTimeMs) // Use the time from config

    // Store the new reminder timeout ID in the map
    activeReminders.set(message.channel.id, reminderTimeoutId)

    // --- Schedule Automatic Ticket Closure (after reminder + close time) ---
    // This timer will only trigger if no new activity happens AFTER the reminder
    const closeTimeoutId = setTimeout(async () => {
      try {
        const channel = message.guild.channels.cache.get(message.channel.id)
        if (!channel) {
          activeCloseTimers.delete(message.channel.id) // Clean up if channel is gone
          return
        }

        // Call the closeTicket function to automatically close the ticket
        await closeTicket(
          channel,
          message.client.user, // The bot is the 'closerUser' for automatic closure
          'Inactividad', // Reason for closure
          message.guild,
          null // No source interaction for an automatic closure
        )
      } catch (error) {
        console.error(
          `Error attempting to close ticket ${message.channel.id} due to inactivity:`,
          error
        )
      } finally {
        // Ensure the close timer is cleared from the map regardless of outcome
        activeCloseTimers.delete(message.channel.id)
      }
    }, reminderTimeMs + closeTimeMs) // This timer fires after the reminder time PLUS the close time

    // Store the new close timeout ID in the map
    activeCloseTimers.set(message.channel.id, closeTimeoutId)
  }
}
