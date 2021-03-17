/**
 *
 */

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserSchema = new Schema({
  userId: mongoose.ObjectId,
  fields: Array,
})

const SesionSchema = new Schema({
  formId: String,
  user: [UserSchema],
  formName: String,
  // idFieldEmail: String,
  fields: Array,
  register: Array,
  active: {
    type: Boolean,
    default: false,
  },
})

module.exports = mongoose.model('Sesions', SesionSchema)
