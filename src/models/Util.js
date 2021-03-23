/**
 *
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UtilSchema = new Schema({
  field: String,
  value: String,
  refreshToken: String,
  userId: String,
  expire: Boolean,
  expireAtMs: Number,
})

module.exports = mongoose.model('Utils', UtilSchema)
