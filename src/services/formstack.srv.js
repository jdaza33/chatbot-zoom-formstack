/**
 * Servicio de FormStack
 */

//Modules
require('dotenv').config()
const axios = require('axios').default

const getForm = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { data } = await axios.get(
        `${process.env.url_api_formstack}/v2/form/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.formstack_access_token,
            'cache-control': 'no-cache',
          },
        }
      )
      return resolve(({ id, name, fields } = data))
    } catch (error) {
      reject(error)
    }
  })
}

const getAllForms = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let { data } = await axios.get(
        `${process.env.url_api_formstack}/v2/form?per_page=100`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.formstack_access_token,
            'cache-control': 'no-cache',
          },
        }
      )

      let { forms } = data

      return resolve(
        forms.map((form) => {
          return { id: form.id, name: form.name }
        })
      )
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const submissionForm = (formId, fields) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { data } = await axios.post(
        `${process.env.url_api_formstack}/v2/form/${formId}/submission`,
        {
          ...fields,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.formstack_access_token,
            'cache-control': 'no-cache',
          },
        }
      )
      console.log(data)
      return resolve(data)
    } catch (error) {
      return reject(error)
    }
  })
}

module.exports = {
  getAllForms,
  getForm,
  submissionForm,
}
