const fs = require('node:fs')
const path = require('path')

const deployEvents = (client) => {
  const eventsFolder = path.resolve(__dirname, '../events')
  const eventFolders = fs.readdirSync(eventsFolder)

  for (const folder of eventFolders) {
    const eventFiles = fs
      .readdirSync(path.join(eventsFolder, folder))
      .filter((file) => file.endsWith('.js'))
    for (const file of eventFiles) {
      const event = require(path.join(eventsFolder, folder, file))
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
      } else {
        client.on(event.name, (...args) => event.execute(...args))
      }
    }
  }
}

module.exports = {
  deployEvents
}
