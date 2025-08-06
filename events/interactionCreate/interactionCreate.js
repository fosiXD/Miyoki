const { Events, PermissionsBitField } = require('discord.js')

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    if (interaction.isCommand() || interaction.isContextMenuCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) {
        return
      }

      if (command.admin) {
        if (
          !interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        ) {
          return interaction.reply({
            content: 'No tienes permisos para ejecutar este comando.',
            ephemeral: true
          })
        }
      }

      try {
        await command.execute(interaction, interaction.client)
      } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: 'There was an error while executing this command!',
            ephemeral: true
          })
        } else {
          await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
          })
        }
      }
    }
  }
}
