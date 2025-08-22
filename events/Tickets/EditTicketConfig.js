const { Events } = require('discord.js')
const TicketConfig = require('../../db/schemas/Tickets/TicketConfig')
// Importa las funciones que manejarán cada submenú
const updateTicketPreferences = require('../../utils/config/updateTicketPreferences')
const updateTicketRoles = require('../../utils/config/updateTicketRoles')

const toggleOption = require('../../utils/config/actions/toggleOption')
const { mainMenu } = require('../../commands/Tickets/subcommands/editConfig')

/*
 * ----------------------------------------------------------------------
 * ---------------------------- IDLE IMPORTS ----------------------------
 * ----------------------------------------------------------------------
 */
const editIdle = require('../../utils/config/actions/idle/editIdle')
const handleIdleButtons = require('../../utils/config/actions/idle/handleIdleButtons')

/*
 * ----------------------------------------------------------------------
 * --------------------------- SURVEY IMPORTS ---------------------------
 * ----------------------------------------------------------------------
 */
const editSurveys = require('../../utils/config/actions/survey/editSurveys')
const handleSurveyButtons = require('../../utils/config/actions/survey/handleSurveyButtons')
const handleSurveyExpireButtons = require('../../utils/config/actions/survey/handleSurveyExpireButtons')
const handleSurveySelectMenus = require('../../utils/config/actions/survey/handleSurveySelectMenus')

/*
 * ----------------------------------------------------------------------
 * ---------------------------- ROLE IMPORTS ----------------------------
 * ----------------------------------------------------------------------
 */
const editStaffRoles = require('../../utils/config/actions/roles/editStaffRoles')
const editManagerRoles = require('../../utils/config/actions/roles/editManagerRoles')
const handleRoleButtons = require('../../utils/config/actions/roles/handleRoleButtons')
const handleRoleSelectMenus = require('../../utils/config/actions/roles/handleRoleSelectMenus')

async function editTicketConfigEvent(interaction) {
  if (!interaction.guild) return
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return

  // Se obtiene la configuración una única vez
  const ticketConfig = await TicketConfig.findOne({
    Guild: interaction.guild.id
  })
  if (!ticketConfig) {
    return interaction.followUp({
      content: 'No se encontró la configuración de tickets para este servidor.',
      ephemeral: true
    })
  }

  const selectedValue = interaction.isStringSelectMenu()
    ? interaction.values[0]
    : null

  // --- Primer Nivel de Enrutamiento (menú principal) ---
  if (interaction.isStringSelectMenu()) {
    try {
      await interaction.deferUpdate()
    } catch (error) {
      console.error(
        'Error al diferir la interacción de menú de selección en editTicketConfigEvent:',
        error
      )
      return
    }
    switch (interaction.customId) {
      case 'ticket-config-menu':
        switch (selectedValue) {
          case 'ticket-preferences':
            await updateTicketPreferences(interaction, ticketConfig)
            break
          case 'roles':
            await updateTicketRoles(interaction)
            break
        }
        break
      case 'ticket-config-preferences':
        switch (selectedValue) {
          case 'toggle-claimable':
            await toggleOption(
              interaction,
              ticketConfig,
              'Reclamable',
              'claimable.enabled'
            )
            break

          case 'toggle-reassignable':
            await toggleOption(
              interaction,
              ticketConfig,
              'Reasignable',
              'reassignable.enabled'
            )
            break

          case 'toggle-logs':
            await toggleOption(
              interaction,
              ticketConfig,
              'Logs',
              'loggable.enabled'
            )
            break

          case 'toggle-openingReason':
            await toggleOption(
              interaction,
              ticketConfig,
              'Motivo de Apertura',
              'openingReason.enabled'
            )
            break

          case 'edit-surveys':
            editSurveys(interaction, ticketConfig)
            break

          case 'edit-idle':
            await editIdle(interaction, ticketConfig)
            break
        }
        break
      case 'ticket-config-roles':
        switch (selectedValue) {
          case 'staff-roles':
            await editStaffRoles(interaction, ticketConfig)
            break
          case 'manager-roles':
            await editManagerRoles(interaction, ticketConfig)
            break
        }
        break
      case 'survey-select-channel':
      case 'survey-announce-channel-select':
        await handleSurveySelectMenus(interaction, ticketConfig)
        break
      case 'add-staff-role-menu':
        await handleRoleSelectMenus(interaction, ticketConfig)
        break
      case 'remove-staff-role-menu':
        await handleRoleSelectMenus(interaction, ticketConfig)
        break
      case 'add-manager-role-menu':
        await handleRoleSelectMenus(interaction, ticketConfig)
        break
      case 'remove-manager-role-menu':
        await handleRoleSelectMenus(interaction, ticketConfig)
        break
    }
  }

  // --- Enrutamiento de Botones ---
  if (interaction.isButton()) {
    const customId = interaction.customId

    switch (true) {
      case customId.startsWith('idle-'):
      case customId.startsWith('survey-expire-'):
      case customId.startsWith('survey-'):
      case customId.startsWith('go-back-to-'):
        try {
          await interaction.deferUpdate()
        } catch (error) {
          console.error(
            'Error al diferir la interacción de botón en editTicketConfigEvent:',
            error
          )
          return
        }
    }

    if (customId === 'go-back-to-menu') {
      await mainMenu(interaction)
    } else if (customId.startsWith('idle-')) {
      await handleIdleButtons(interaction, ticketConfig)
    } else if (customId.startsWith('survey-expire-')) {
      await handleSurveyExpireButtons(interaction, ticketConfig)
    } else if (customId.startsWith('survey-')) {
      await handleSurveyButtons(interaction, ticketConfig)
    } else if (
      customId === 'add-staff-role' ||
      customId === 'remove-staff-role' ||
      customId === 'add-manager-role' ||
      customId === 'remove-manager-role'
    ) {
      await handleRoleButtons(interaction, ticketConfig)
    } else if (customId === 'go-back-to-preferences') {
      await updateTicketPreferences(interaction, ticketConfig)
    } else if (customId === 'go-back-to-surveys') {
      await editSurveys(interaction, ticketConfig)
    } else if (customId === 'go-back-to-roles') {
      await updateTicketRoles(interaction)
    }
  }
}

module.exports = {
  name: Events.InteractionCreate,
  execute: editTicketConfigEvent
}
