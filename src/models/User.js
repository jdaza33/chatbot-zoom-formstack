/**
 *
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: String,
  lastname: String,
  userId: String,
  jid: String,
  email: String,
  admin: Boolean,
  accountId: String,
  token: String,
  refreshToken: String,
  expireTokenAtMs: Number,
})

module.exports = mongoose.model('Users', UserSchema)
