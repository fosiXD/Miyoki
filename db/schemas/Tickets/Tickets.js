const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
  Guild: { type: String, required: true },
  Staff: { type: [String], default: [] },
  ClaimedBy: { type: String, default: null },
  User: { type: String, default: '' },
  ChannelID: { type: String, default: null },
  Status: {
    type: String,
    enum: ['Pending', 'Active', 'Idle', 'Completed'],
    default: 'Pending'
  },
  OpenedAt: { type: Date, default: Date.now() },
  ClosedAt: { type: Date, default: null },
  ClosedReason: { type: String, default: null },
  ClosedBy: { type: String, default: null },
  Rated: { type: Boolean, default: false }
})

module.exports = new mongoose.model('Tickets', ticketSchema)
