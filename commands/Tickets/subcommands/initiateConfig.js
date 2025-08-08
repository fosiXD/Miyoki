const TicketConfig = require('../../../db/schemas/Tickets/TicketConfig')
const {
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ChannelSelectMenuBuilder
} = require('discord.js')

async function createNewConfig(interaction) {
  const newConfig = new TicketConfig({
    Guild: interaction.guild.id,
    panelChannel: null,
    staffs: [],
    managers: [],
    claimable: { enabled: false },
    reassignable: { enabled: false },
    loggable: { enabled: false, channel: null },
    survey: {
      enabled: false,
      announceChannel: null,
      channel: null,
      expires: {
        enabled: false,
        time: null
      }
    },
    openingChannel: { name: 'ticket-{user}', parent: null },
    openingReason: {
      enabled: false
    },
    idle: { reminder: null, close: null },
    embeds: {
      panel: {},
      opening: {},
      claimed: {},
      reassigned: {},
      reason: { message: {}, attachment: {} },
      closing: {},
      log: {}
    },
    buttons: {
      open: {},
      claim: {},
      reassign: {},
      close: {},
      reopen: {},
      delete: {},
      log: {}
    }
  })

  let stepsCompleted = 0
  // Define totalSteps more dynamically if possible, or ensure it matches the actual steps.
  // For this flow: 1 (parent), 2 (claimable), 3 (reassignable - conditional, but always a step for check), 4 (loggable), 5 (log channel - conditional)
  // Let's count them as potential distinct steps for clearer tracking.
  const totalSteps = 5 // Parent, Claimable, Reassignable, Loggable, Log Channel

  let setupMessage = null // Declare setupMessage here to be accessible

  async function checkAndSave() {
    // A simpler way to track if all required steps are conceptually "completed"
    // based on your original logic.
    let currentCompleted = 0
    if (newConfig.openingChannel.parent) currentCompleted++ // Step 1
    if (newConfig.claimable.enabled !== undefined) currentCompleted++ // Step 2
    if (
      !newConfig.claimable.enabled ||
      newConfig.reassignable.enabled !== undefined
    )
      currentCompleted++ // Step 3 (reassignable is only asked if claimable is true, otherwise this is implicitly 'done')
    if (newConfig.loggable.enabled !== undefined) currentCompleted++ // Step 4
    if (!newConfig.loggable.enabled || newConfig.loggable.channel)
      currentCompleted++ // Step 5 (log channel is only asked if loggable is true, otherwise implicitly 'done')

    // If all conceptual steps are done based on the flow.
    if (currentCompleted >= totalSteps) {
      clearTimeout(timeout)
      try {
        const savedConfig = await newConfig.save()
        if (savedConfig) {
          if (setupMessage) await setupMessage.delete() // Delete the setup message on success
          await interaction.followUp({
            content: '✅ Configuración guardada exitosamente!',
            ephemeral: true
          })
          return true
        }
      } catch (error) {
        console.error('Error al guardar:', error)
        if (setupMessage) await setupMessage.delete() // Delete the setup message on error
        await interaction.followUp({
          content: `❌ Error al guardar: ${error.message}`,
          ephemeral: true
        })
      }
    }
    return false
  }

  const timeout = setTimeout(async () => {
    if (setupMessage) {
      try {
        await setupMessage.delete() // Delete the setup message if timeout
      } catch (err) {
        console.error('Error deleting setup message on timeout:', err)
      }
    }
    await interaction.followUp({
      content:
        '⏳ No completaste la configuración a tiempo. No se guardaron los cambios.',
      ephemeral: true
    })
  }, 900_000) // 15 minutos

  try {
    // 🟢 PASO 1: Seleccionar categoría de apertura
    const parentSelectionEmbed = new EmbedBuilder()
      .setColor(0xaec6cf)
      .setTitle('Categoría de Apertura')
      .setDescription(
        'Selecciona la categoría de canales en la que se crearán los tickets.'
      )

    const parentSelectionMenu = new ChannelSelectMenuBuilder()
      .setCustomId('ticket-parent')
      .setPlaceholder('Elige una categoría...')
      .addChannelTypes(ChannelType.GuildCategory)

    const parentRow = new ActionRowBuilder().addComponents(parentSelectionMenu)

    // Assign the message to setupMessage
    setupMessage = await interaction.channel.send({
      embeds: [parentSelectionEmbed],
      components: [parentRow]
    })

    const parentFilter = (i) =>
      i.customId === 'ticket-parent' && i.user.id === interaction.user.id
    const parentResponse = await setupMessage.awaitMessageComponent({
      // Use setupMessage
      filter: parentFilter,
      time: 60_000
    })

    const selectedChannelId = parentResponse.values[0]
    const selectedChannel =
      interaction.guild.channels.cache.get(selectedChannelId)

    if (
      !selectedChannel ||
      selectedChannel.type !== ChannelType.GuildCategory
    ) {
      // If setupMessage exists, delete it before replying with error
      if (setupMessage) await setupMessage.delete()
      return parentResponse.reply({
        content: '❌ Debes seleccionar una categoría válida.',
        ephemeral: true
      })
    }

    newConfig.openingChannel.parent = selectedChannelId // Se completa el paso 1
    await parentResponse.update({ components: [] }) // Clear components

    // 🟢 PASO 2: Preguntar si son reclamables
    await handleClaimableStep(
      interaction,
      newConfig,
      setupMessage, // Pass setupMessage
      checkAndSave
    )
  } catch (error) {
    console.error('Error en la configuración:', error)
    if (setupMessage) {
      try {
        await setupMessage.delete() // Delete setup message on general error
      } catch (err) {
        console.error('Error deleting setup message during initial error:', err)
      }
    }
    await interaction.followUp({
      content:
        '⏳ No seleccionaste ninguna opción a tiempo o ocurrió un error inesperado. No se guardaron cambios.',
      ephemeral: true
    })
    clearTimeout(timeout) // Clear the timeout if an error occurs
  }
}

async function handleClaimableStep(
  interaction,
  newConfig,
  message,
  checkAndSave
) {
  const claimEmbed = new EmbedBuilder()
    .setColor(0xaec6cf)
    .setTitle('¿Los tickets serán reclamables?')
    .setDescription('Reacciona con ✅ para "Sí" o ❌ para "No".')

  await message.edit({ embeds: [claimEmbed], components: [] }) // Ensure components are cleared
  await message.reactions.removeAll()
  await message.react('✅')
  await message.react('❌')

  const reactionFilter = (reaction, user) =>
    ['✅', '❌'].includes(reaction.emoji.name) &&
    user.id !== interaction.client.user.id &&
    user.id === interaction.user.id

  try {
    const collectedReactions = await message.awaitReactions({
      filter: reactionFilter,
      time: 60_000,
      max: 1
    })

    const reaction = collectedReactions.first()
    if (!reaction) throw new Error('No reaction received')

    newConfig.claimable.enabled = reaction.emoji.name === '✅'
    await interaction.followUp({
      content: newConfig.claimable.enabled
        ? '✅ Los tickets serán reclamables.'
        : '❌ Los tickets **no** serán reclamables.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clear reactions after selection

    if (newConfig.claimable.enabled) {
      await handleReassignableStep(
        interaction,
        newConfig,
        message, // Pass message
        checkAndSave
      )
    } else {
      await handleLogStep(
        interaction,
        newConfig,
        message, // Pass message
        checkAndSave
      )
    }
  } catch (error) {
    console.error('Error en paso reclamable:', error)
    await interaction.followUp({
      content: '⏳ Tiempo agotado para seleccionar reclamabilidad.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clean up reactions on timeout
    checkAndSave() // Try to save what's been configured so far
  }
}

async function handleReassignableStep(
  interaction,
  newConfig,
  message,
  checkAndSave
) {
  const reassignEmbed = new EmbedBuilder()
    .setColor(0xaec6cf)
    .setTitle('¿Los tickets serán reasignables?')
    .setDescription('Reacciona con ✅ para "Sí" o ❌ para "No".')

  await message.edit({ embeds: [reassignEmbed] })
  await message.reactions.removeAll()
  await message.react('✅')
  await message.react('❌')

  const reactionFilter = (reaction, user) =>
    ['✅', '❌'].includes(reaction.emoji.name) &&
    user.id !== interaction.client.user.id &&
    user.id === interaction.user.id

  try {
    const collectedReactions = await message.awaitReactions({
      filter: reactionFilter,
      time: 60_000,
      max: 1
    })

    const reaction = collectedReactions.first()
    if (!reaction) throw new Error('No reaction received')

    newConfig.reassignable.enabled = reaction.emoji.name === '✅'
    await interaction.followUp({
      content: newConfig.reassignable.enabled
        ? '✅ Los tickets serán reasignables.'
        : '❌ Los tickets **no** serán reasignables.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clear reactions after selection

    await handleLogStep(
      interaction,
      newConfig,
      message, // Pass message
      checkAndSave
    )
  } catch (error) {
    console.error('Error en paso reasignable:', error)
    await interaction.followUp({
      content: '⏳ Tiempo agotado para seleccionar reasignabilidad.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clean up reactions on timeout
    checkAndSave() // Try to save what's been configured so far
  }
}

async function handleLogStep(interaction, newConfig, message, checkAndSave) {
  const logEmbed = new EmbedBuilder()
    .setColor(0xaec6cf)
    .setTitle('¿Se harán logs de los tickets?')
    .setDescription('Reacciona con ✅ para "Sí" o ❌ para "No".')

  await message.edit({ embeds: [logEmbed] })
  await message.reactions.removeAll()
  await message.react('✅')
  await message.react('❌')

  const reactionFilter = (reaction, user) =>
    ['✅', '❌'].includes(reaction.emoji.name) &&
    user.id !== interaction.client.user.id &&
    user.id === interaction.user.id

  try {
    const collectedReactions = await message.awaitReactions({
      filter: reactionFilter,
      time: 60_000,
      max: 1
    })

    const reaction = collectedReactions.first()
    if (!reaction) throw new Error('No reaction received')

    newConfig.loggable.enabled = reaction.emoji.name === '✅'
    await interaction.followUp({
      content: newConfig.loggable.enabled
        ? '✅ Se registrarán logs de los tickets.'
        : '❌ No se registrarán logs de los tickets.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clear reactions after selection

    if (newConfig.loggable.enabled) {
      await handleLogChannelStep(
        interaction,
        newConfig,
        message, // Pass message
        checkAndSave
      )
    } else {
      await message.edit({ components: [] }) // Clear components if no log channel needed
      checkAndSave() // No log channel needed, try to save
    }
  } catch (error) {
    console.error('Error en paso de logs:', error)
    await interaction.followUp({
      content: '⏳ Tiempo agotado para seleccionar opción de logs.',
      ephemeral: true
    })
    await message.reactions.removeAll() // Clean up reactions on timeout
    checkAndSave() // Try to save what's been configured so far
  }
}

async function handleLogChannelStep(
  interaction,
  newConfig,
  message,
  checkAndSave
) {
  const logChannelEmbed = new EmbedBuilder()
    .setColor(0xaec6cf)
    .setTitle('Canal de Logs')
    .setDescription('Selecciona el canal donde se enviarán los logs.')

  const logChannelMenu = new ChannelSelectMenuBuilder()
    .setCustomId('ticket-log-channel')
    .setPlaceholder('Elige un canal...')
    .addChannelTypes(ChannelType.GuildText)

  const logChannelRow = new ActionRowBuilder().addComponents(logChannelMenu)

  await message.edit({ embeds: [logChannelEmbed], components: [logChannelRow] }) // Edit the same message

  const logChannelFilter = (i) =>
    i.customId === 'ticket-log-channel' && i.user.id === interaction.user.id

  try {
    const logChannelResponse = await message.awaitMessageComponent({
      // Use message
      filter: logChannelFilter,
      time: 60_000
    })

    const selectedChannelId = logChannelResponse.values[0]
    const selectedChannel =
      interaction.guild.channels.cache.get(selectedChannelId)

    if (!selectedChannel || selectedChannel.type !== ChannelType.GuildText) {
      return logChannelResponse.reply({
        content: '❌ Debes seleccionar un canal de texto válido.',
        ephemeral: true
      })
    }

    newConfig.loggable.channel = selectedChannelId
    await logChannelResponse.update({ components: [] }) // Clear components
    checkAndSave()
  } catch (error) {
    console.error('Error en selección de canal de logs:', error)
    await interaction.followUp({
      content:
        '⏳ No seleccionaste ningún canal a tiempo. No se configuró el canal de logs.',
      ephemeral: true
    })
    checkAndSave()
  }
}

async function initiateConfig(interaction) {
  try {
    let data = await TicketConfig.findOne({ Guild: interaction.guild.id })

    if (data) {
      const confirmationMsg = await interaction.reply({
        content:
          'Ya hay una configuración establecida para los tickets en este servidor.\n\n' +
          '✅ - Eliminar e iniciar nuevamente\n' +
          '✏️ - Solo quiero editar\n' +
          '❌ - Cancelar operación',
        fetchReply: true
      })

      await confirmationMsg.react('✅')
      await confirmationMsg.react('✏️')
      await confirmationMsg.react('❌')

      const filter = (reaction, user) =>
        ['✅', '✏️', '❌'].includes(reaction.emoji.name) &&
        user.id === interaction.user.id

      const collector = confirmationMsg.createReactionCollector({
        filter,
        time: 30000,
        max: 1
      })

      collector.on('collect', async (reaction) => {
        try {
          if (reaction.emoji.name === '✅') {
            await interaction.followUp({
              content: '🔄 Eliminando la configuración y reiniciando...',
              ephemeral: true
            })
            await TicketConfig.deleteOne({ Guild: interaction.guild.id })
            await confirmationMsg.delete()
            await createNewConfig(interaction)
          } else if (reaction.emoji.name === '✏️') {
            await interaction.followUp({
              content:
                'Por favor utiliza el comando `/ticket edit` para completar esta operación.',
              ephemeral: true
            })
            await confirmationMsg.delete()
          } else if (reaction.emoji.name === '❌') {
            await interaction.followUp({
              content: '❌ Operación cancelada.',
              ephemeral: true
            })
            await confirmationMsg.delete()
          }
        } catch (error) {
          console.error('Error al procesar reacción:', error)
        }
      })

      collector.on('end', async (_, reason) => {
        if (reason === 'time') {
          try {
            await interaction.followUp({
              content: '⏳ No respondiste a tiempo.',
              ephemeral: true
            })
            await confirmationMsg.delete()
          } catch (error) {
            console.error('Error al manejar tiempo agotado:', error)
          }
        }
      })
    } else {
      await interaction.reply({
        content:
          'No hay una configuración existente. Iniciando nueva configuración...',
        ephemeral: true
      })
      await createNewConfig(interaction)
    }
  } catch (error) {
    console.error('Error en initiateConfig:', error)
    await interaction.followUp({
      content: '❌ Ocurrió un error al iniciar la configuración.',
      ephemeral: true
    })
  }
}

module.exports = initiateConfig
