require('dotenv').config()

const getEnvVariables = () => {
  return {
    TOKEN: process.env.TOKEN,
    MONGO_URI: process.env.MONGO_URI,
    CLIENT_ID: process.env.CLIENT_ID
  }
}

module.exports = {
  getEnvVariables
}
