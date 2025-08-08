const editIdle = require('./editIdle')

async function handleIdleButtons(interaction, ticketConfig) {
  const customId = interaction.customId

  switch (customId) {
    case 'idle-reminder-30m':
      ticketConfig.idle.reminder =
        (ticketConfig.idle.reminder || 0) + 30 * 60 * 1000
      break
    case 'idle-reminder-1h':
      ticketConfig.idle.reminder =
        (ticketConfig.idle.reminder || 0) + 60 * 60 * 1000
      break
    case 'idle-reminder-clear':
      ticketConfig.idle.reminder = null
      break
    case 'idle-close-30m':
      ticketConfig.idle.close = (ticketConfig.idle.close || 0) + 30 * 60 * 1000
      break
    case 'idle-close-1h':
      ticketConfig.idle.close = (ticketConfig.idle.close || 0) + 60 * 60 * 1000
      break
    case 'idle-close-clear':
      ticketConfig.idle.close = null
      break
  }

  await ticketConfig.save()
  await editIdle(interaction, ticketConfig)
}

module.exports = handleIdleButtons
