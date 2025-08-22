const editStaffRoles = require('./editStaffRoles')
const editManagerRoles = require('./editManagerRoles')

/**
 * Maneja las interacciones de los menús de selección de roles.
 * @param {object} interaction La interacción de Discord.
 * @param {object} ticketConfig El objeto de configuración de tickets.
 */
async function handleRoleSelectMenus(interaction, ticketConfig) {
  const selectedValues = interaction.values // Los menús de selección pueden tener múltiples valores

  switch (interaction.customId) {
    case 'add-staff-role-menu':
      // Agrega cada rol seleccionado al array de staff
      selectedValues.forEach((roleId) => {
        if (!ticketConfig.staffs.includes(roleId)) {
          ticketConfig.staffs.push(roleId)
        }
      })
      break
    case 'remove-staff-role-menu':
      // Remueve cada rol seleccionado del array de staff
      selectedValues.forEach((roleIdToRemove) => {
        const staffRoleIndex = ticketConfig.staffs.findIndex(
          (roleId) => roleId === roleIdToRemove
        )
        if (staffRoleIndex !== -1) {
          ticketConfig.staffs.splice(staffRoleIndex, 1)
        }
      })
      break
    case 'add-manager-role-menu':
      // Agrega cada rol seleccionado al array de managers
      selectedValues.forEach((roleId) => {
        if (!ticketConfig.managers.includes(roleId)) {
          ticketConfig.managers.push(roleId)
        }
      })
      break
    case 'remove-manager-role-menu':
      // Remueve cada rol seleccionado del array de managers
      selectedValues.forEach((roleIdToRemove) => {
        const managerRoleIndex = ticketConfig.managers.findIndex(
          (roleId) => roleId === roleIdToRemove
        )
        if (managerRoleIndex !== -1) {
          ticketConfig.managers.splice(managerRoleIndex, 1)
        }
      })
      break
  }

  await ticketConfig.save()
  // Actualiza la respuesta dependiendo del menú que se usó
  if (interaction.customId.includes('staff-role')) {
    await editStaffRoles(interaction, ticketConfig)
  } else if (interaction.customId.includes('manager-role')) {
    await editManagerRoles(interaction, ticketConfig)
  }
}

module.exports = handleRoleSelectMenus
