const { SlashCommandBuilder, ChannelType } = require('discord.js')
const initiateConfig = require('./subcommands/initiateConfig')
const startTickets = require('./subcommands/start')
const editConfig = require('./subcommands/editConfig')

module.exports = {
  admin: true,
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Comandos del sistema de tickets')
    .addSubcommand((sub) =>
      sub
        .setName('initiate-config')
        .setDescription('Inicia la configuración del sistema de tickets.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit-config')
        .setDescription('Edita la configuración del sistema de tickets.')
    )
    .addSubcommand((sub) =>
      sub
        .setName('start')
        .setDescription('Inicia el sistema de tickets.')
        .addChannelOption((c) =>
          c
            .setName('canal')
            .setDescription('Canal donde se enviará el panel de tickets')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case 'initiate-config':
        initiateConfig(interaction)
        break

      case 'edit-config':
        editConfig(interaction)
        break

      case 'start':
        startTickets(interaction)
        break
    }
  }
}
