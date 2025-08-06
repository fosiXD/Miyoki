const { ActivityType, Events } = require('discord.js')

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: 'Testing...',
          type: ActivityType.Playing,
          state: 'Probando cositas',
          timestamps: {
            start: Date.now()
          },
          assets: {
            large_image: 'logobuilderestatico_1',
            large_text: 'This is a large text',
            small_image: 'minecraft_logo_icon_168974',
            small_text: 'This is a small text'
          }
        }
      ]
    })

    console.log(`Ready! Logged in as ${client.user.tag}`)
  }
}
