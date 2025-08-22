const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js')

const updateTicketRoles = require('../../updateTicketRoles')

/**
 * Función auxiliar para crear embeds y menús de selección de roles.
 * @param {object} interaction La interacción de Discord.
 * @param {string} roleType El tipo de rol ('staff' o 'manager').
 * @param {string} action La acción a realizar ('add' o 'remove').
 * @param {string[]} roleIDs Los IDs de los roles correspondientes.
 * @param {object} allRoles La colección de todos los roles del servidor.
 * @returns {object} Un objeto con el embed y los componentes.
 */
function createRoleMenu(interaction, roleType, action, roleIDs, allRoles) {
  const isAdd = action === 'add'
  const titleAction = isAdd ? 'Agregar' : 'Eliminar'
  const color = isAdd ? 'Green' : 'Red'
  const roleName = roleType === 'staff' ? 'Staff' : 'Manager'
  const customIdPrefix = isAdd ? 'add' : 'remove'
  const customId = `${customIdPrefix}-${roleType}-role-menu`

  // Lógica de filtrado de roles
  const rolesToDisplay = isAdd
    ? allRoles.filter(
        (role) =>
          !roleIDs.includes(role.id) &&
          !role.managed &&
          role.id !== interaction.guild.id
      )
    : allRoles.filter((role) => roleIDs.includes(role.id))

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${titleAction} Rol de ${roleName}`)
    .setDescription(
      rolesToDisplay.size === 0
        ? `No hay roles de ${roleName} para ${isAdd ? 'agregar' : 'eliminar'}.`
        : `Elige el rol a ${
            isAdd ? 'agregar' : 'eliminar'
          } debajo. Puedes seleccionar múltiples roles a la vez.`
    )

  // Si no hay roles para mostrar, retornamos solo el embed
  if (rolesToDisplay.size === 0) {
    return {
      embed,
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('go-back-to-roles')
            .setLabel('Volver')
            .setStyle(ButtonStyle.Secondary)
        )
      ]
    }
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Seleccionar Rol')
    .setMinValues(1)
    .setMaxValues(rolesToDisplay.size > 25 ? 25 : rolesToDisplay.size)

  const rolesOptions = rolesToDisplay.map((role) =>
    new StringSelectMenuOptionBuilder().setLabel(role.name).setValue(role.id)
  )

  selectMenu.addOptions(rolesOptions)

  const backToRolesButton = new ButtonBuilder()
    .setCustomId('go-back-to-roles')
    .setLabel('Volver')
    .setStyle(ButtonStyle.Secondary)

  const selectRow = new ActionRowBuilder().addComponents(selectMenu)
  const buttonRow = new ActionRowBuilder().addComponents(backToRolesButton)

  return { embed, components: [selectRow, buttonRow] }
}

/**
 * Maneja las interacciones de los botones de roles.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleRoleButtons(interaction, ticketConfig) {
  const customId = interaction.customId
  const allRoles = interaction.guild.roles.cache

  if (!interaction.isButton()) return

  if (customId.startsWith('go-back-to-roles')) {
    await interaction.deferUpdate()
    await updateTicketRoles(interaction)
    return
  }

  // Defer Update fuera del switch para los casos de roles
  if (customId.endsWith('-role')) {
    await interaction.deferUpdate()
  }

  let result
  switch (customId) {
    case 'add-staff-role':
      result = createRoleMenu(
        interaction,
        'staff',
        'add',
        ticketConfig.staffs,
        allRoles
      )
      break
    case 'remove-staff-role':
      result = createRoleMenu(
        interaction,
        'staff',
        'remove',
        ticketConfig.staffs,
        allRoles
      )
      break
    case 'add-manager-role':
      result = createRoleMenu(
        interaction,
        'manager',
        'add',
        ticketConfig.managers,
        allRoles
      )
      break
    case 'remove-manager-role':
      result = createRoleMenu(
        interaction,
        'manager',
        'remove',
        ticketConfig.managers,
        allRoles
      )
      break
  }

  if (result) {
    await interaction.editReply({
      embeds: [result.embed],
      components: result.components
    })
  }
}

module.exports = handleRoleButtons
