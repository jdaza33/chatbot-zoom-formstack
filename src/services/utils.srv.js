/**
 * Servicio de Utils
 */

require('dotenv').config()

//Models
const Util = require('../models/Util')

const saveCodeApp = (code) => {
  return new Promise(async (resolve, reject) => {
    try {
      //Verificamos si existe el codeApp
      let codeapp = await Util.findOne({
        field: process.env.name_code_app,
      }).lean()

      if (codeapp)
        await Util.findByIdAndUpdate(codeapp._id, { $set: { value: code } })
      else
        await Util.create({
          field: process.env.name_code_app,
          value: code,
          expire: false,
        })
      return resolve()
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

const getCodeApp = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let codeapp = await Util.findOne({
        field: process.env.name_code_app,
      }).lean()
      resolve(codeapp.value)
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

module.exports = {
  saveCodeApp,
  getCodeApp,
}
