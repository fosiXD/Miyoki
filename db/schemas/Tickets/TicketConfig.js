const { Schema, model } = require('mongoose')

const ticketConfigSchema = new Schema({
  Guild: { type: String, required: true },

  panelChannel: { type: String, default: null },

  staffs: { type: [String], default: [] },
  managers: { type: [String], default: [] },

  claimable: {
    enabled: { type: Boolean, default: false }
  },

  reassignable: {
    enabled: { type: Boolean, default: false }
  },

  loggable: {
    enabled: { type: Boolean, default: false },
    channel: { type: String, default: null }
  },

  survey: {
    enabled: { type: Boolean, default: false },
    announceChannel: { type: String, default: null },
    channel: { type: String, enum: ['Ticket', 'DM'], default: 'DM' },
    isMandatory: { type: Boolean, default: false }, // If channel is "DM" then it can't be Mandatory
    expires: {
      enabled: { type: Boolean, default: false }, // If "isMandatory" is enabled, it can't expire
      time: { type: Number, default: null } // If channel is "Ticket" then it must either expire or get evaluated prior to it being completed.
    }
  },

  openingChannel: {
    name: { type: String, default: 'ticket-{user}' },
    parent: { type: String, default: null }
  },

  openingReason: {
    enabled: { type: Boolean, default: false }
  },

  idle: {
    reminder: { type: Number, default: null },
    close: { type: Number, default: null }
  },

  embeds: {
    panel: { type: Object, default: {} },
    opening: { type: Object, default: {} },
    claimed: { type: Object, default: {} },
    reassigned: { type: Object, default: {} },
    reason: {
      message: { type: Object, default: {} },
      attachment: { type: Object, default: {} }
    },
    closing: { type: Object, default: {} },
    log: { type: Object, default: {} }
  }
})

module.exports = model('TicketConfig', ticketConfigSchema)
