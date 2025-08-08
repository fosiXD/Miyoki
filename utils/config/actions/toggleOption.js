const { EmbedBuilder } = require('discord.js')
const updateTicketPreferences = require('../updateTicketPreferences')

async function toggleOption(interaction, ticketConfig, moduleName, path) {
  const pathParts = path.split('.')
  let currentObject = ticketConfig
  for (let i = 0; i < pathParts.length - 1; i++) {
    currentObject = currentObject[pathParts[i]]
  }
  const finalKey = pathParts[pathParts.length - 1]

  // Invierte el estado actual
  currentObject[finalKey] = !currentObject[finalKey]
  await ticketConfig.save()

  // Reconstruye y envía el embed de confirmación
  const newStatus = currentObject[finalKey] ? 'habilitado' : 'deshabilitado'
  const embed = new EmbedBuilder()
    .setColor(currentObject[finalKey] ? 'Green' : 'Red')
    .setTitle('Preferencia Actualizada ✅')
    .setDescription(
      `El módulo de **${moduleName}** ahora está **${newStatus}**.`
    )

  // Muestra el submenú de preferencias actualizado
  await updateTicketPreferences(interaction, ticketConfig)

  await interaction.followUp({ embeds: [embed], ephemeral: true })
}

module.exports = toggleOption
