const { Collection, GatewayIntentBits, Partials } = require('discord.js')
const { getEnvVariables } = require('./environment/getEnvVariables')
const { deployEvents } = require('./handlers/deploy-events')
const { deploySlashCommands } = require('./handlers/deploy-commands')
const { connection } = require('./db/connection')

const Discord = require('discord.js')
const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.GuildMember,
    Partials.User,
    Partials.Reaction
  ]
})

module.exports = client

client.commands = new Collection()

deployEvents(client)
deploySlashCommands(client)
connection()

require('dotenv').config()
client.login(getEnvVariables().TOKEN)