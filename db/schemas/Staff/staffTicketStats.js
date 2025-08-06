const { Schema, model } = require('mongoose')

const staffTicketStats = new Schema({
  Guild: { type: String, required: true },
  StaffID: { type: String, required: true },
  Stats: {
    TicketNum: { type: Number, default: 0 },
    SurveyStats: {
      OneStar: { type: Number, default: 0 },
      TwoStar: { type: Number, default: 0 },
      ThreeStar: { type: Number, default: 0 },
      FourStar: { type: Number, default: 0 },
      FiveStar: { type: Number, default: 0 }
    },
    SurveyDetails: {
      OneStar: [
        {
          TicketID: { type: String, required: true },
          SurveyDate: { type: Date, default: Date.now },
          Comment: { type: String, default: null }
        }
      ],
      TwoStar: [
        {
          TicketID: { type: String, required: true },
          SurveyDate: { type: Date, default: Date.now },
          Comment: { type: String, default: null }
        }
      ],
      ThreeStar: [
        {
          TicketID: { type: String, required: true },
          SurveyDate: { type: Date, default: Date.now },
          Comment: { type: String, default: null }
        }
      ],
      FourStar: [
        {
          TicketID: { type: String, required: true },
          SurveyDate: { type: Date, default: Date.now },
          Comment: { type: String, default: null }
        }
      ],
      FiveStar: [
        {
          TicketID: { type: String, required: true },
          SurveyDate: { type: Date, default: Date.now },
          Comment: { type: String, default: null }
        }
      ]
    }
  }
})

module.exports = new model('StaffTicketStats', staffTicketStats)
