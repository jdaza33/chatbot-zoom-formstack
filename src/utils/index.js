/**
 * Utils
 */

require('dotenv').config()

const checkCommand = (cmd) => {
  let [i = null, option = null] = cmd.split('')
  let [, id] = cmd.split(' ')
  let res = { success: 0, message: '', isCommand: false }

  if (i == '-') {
    res.isCommand = true
    if (option == 'i') {
      if (id && /^[0-9]*$/.test(id)) res.success = 1
      else res.message = 'ID invalido, intente de nuevo.'
    } else if (option == 's') res.success = 1
    else res.message = 'Opción invalido, consulte la documentación.'
  }

  return { ...res, i, option, id }
}
