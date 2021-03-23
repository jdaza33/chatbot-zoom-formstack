/**
 * Servicio de usuarios
 */

require('dotenv').config()

//Models
const User = require('../models/User')

const getUser = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user = await User.findOne({
        userId,
      }).lean()
      resolve(user)
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

const getAllJid = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = await User.find({}).lean()
      return resolve(users)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getAllJidByEmail = (emails) => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = await User.find({ email: { $in: emails } }).lean()
      return resolve(users)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

module.exports = {
  getUser,
  getAllJid,
  getAllJidByEmail
}
