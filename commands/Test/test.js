const {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  ComponentType,
  MessageFlags,
  ActionRowBuilder
} = require('discord.js')

module.exports = {
  data: new SlashCommandBuilder().setName('test').setDescription('test'),

  async execute(interaction) {
    const button = new ButtonBuilder()
      .setCustomId('btn')
      .setLabel('Haz clic')
      .setStyle(ButtonStyle.Primary)

    // Crea una fila válida con 1 a 5 botones
    const actionRow = new ActionRowBuilder().addComponents(button)

    // Crea el container y agrega la fila
    const container = new ContainerBuilder().addActionRowComponents(actionRow)

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      ephemeral: true
    })
  }
}
