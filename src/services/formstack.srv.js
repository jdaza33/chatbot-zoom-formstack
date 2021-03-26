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

const calculateForm = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      //Obtenemos el formulario
      let { data: form } = await axios.get(
        `${process.env.url_api_formstack}/v2/form/${id}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.formstack_access_token,
            'cache-control': 'no-cache',
          },
        }
      )

      let { name, fields } = form

      //Obtenemos solo los tipo radio y participacion
      let fieldsRadio = [...fields].filter((f) => f.type == 'radio')
      let fieldParticipacion = [...fields].find(
        (f) => f.name == 'participacion'
      )

      //Obtenemos los id de los resultados
      let { data: dataSubmissions } = await axios.get(
        `${process.env.url_api_formstack}/v2/form/${id}/submission?per_page=100`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.formstack_access_token,
            'cache-control': 'no-cache',
          },
        }
      )
      let { submissions } = dataSubmissions

      //Obtenemos todos los resultados
      let promisesSubmissions = []
      for (let s of submissions) {
        promisesSubmissions.push(
          axios
            .get(`${process.env.url_api_formstack}/v2/submission/${s.id}`, {
              useCredentails: true,
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + process.env.formstack_access_token,
                'cache-control': 'no-cache',
              },
            })
            .then(({ data }) => data)
        )
      }

      let allSubmissions = await Promise.all(promisesSubmissions)
      allSubmissions = [...allSubmissions.filter((s) => s)]

      //Construimos la data
      let result = {
        title: name,
        questions: [],
      }

      for (let fr of fieldsRadio) {
        let tmp = {
          id: fr.id,
          name: fr.label,
          data: [],
        }

        let tmpSubm = []

        for (let as of allSubmissions) {
          let { data: resData } = as
          let _fieldRadio = [...resData].find((rd) => rd.field == fr.id)
          let _fieldPart = fieldParticipacion
            ? [...resData].find((rd) => rd.field == fieldParticipacion.id)
            : null
          tmpSubm.push({
            value: _fieldRadio ? _fieldRadio.value : null,
            participacion: _fieldPart ? parseFloat(_fieldPart.value) : 0,
          })
        }

        for (let o of fr.options) {
          tmp.data.push({
            name: o.label,
            value: o.value,
            res: tmpSubm
              .filter((ts) => ts.value == o.value)
              .map((ts) => ts.participacion)
              .reduce((a, b) => a + b, 0),
          })
        }

        result.questions.push(tmp)
      }

      console.log(result)
      return resolve(result)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

module.exports = {
  getAllForms,
  getForm,
  submissionForm,
  calculateForm,
}
