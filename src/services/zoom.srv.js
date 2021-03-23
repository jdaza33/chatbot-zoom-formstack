/**
 * Servicio de ZOOM
 */

//Modules
require('dotenv').config()
const axios = require('axios').default
const moment = require('moment')

//Models
const Util = require('../models/Util')
const User = require('../models/User')
const Sesion = require('../models/Sesion')

//Services
const { getCodeApp } = require('./utils.srv')
const { getAllForms, getForm, submissionForm } = require('./formstack.srv')
const { getAllJid, getAllJidByEmail } = require('./user.srv')

//Const
__headers__basic = {
  Authorization:
    'Basic ' +
    Buffer.from(
      process.env.zoom_client_id + ':' + process.env.zoom_client_secret
    ).toString('base64'),
}

const getTokenChatBot = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const requestToken = async () => {
        let { data } = await axios.post(
          `${process.env.url_api_zoom}/oauth/token?grant_type=client_credentials`,
          {},
          {
            headers: __headers__basic,
          }
        )

        console.log('tokenchatbot', data.access_token)

        // await Util.create({
        //   field: process.env.name_toke_chatbot,
        //   value: data.access_token,
        //   expire: true,
        //   expireAtMs: moment().add(50, 'minutes').valueOf(),
        // })

        await Util.findOneAndUpdate(
          { field: process.env.name_toke_chatbot },
          {
            value: data.access_token,
            expire: true,
            expireAtMs: moment().add(50, 'minutes').valueOf(),
          },
          { upsert: true }
        )

        return data.access_token
      }

      let date = moment().valueOf()
      let tokenchatbot = await Util.findOne({
        field: process.env.name_toke_chatbot,
      }).lean()

      /**
       * @todo
       */
      if (tokenchatbot) {
        if (tokenchatbot.expire) {
          if (date < parseInt(tokenchatbot.expireAtMs))
            return resolve(tokenchatbot.value)
          else return resolve(await requestToken())
        } else return resolve(tokenchatbot.value)
      } else return resolve(await requestToken())
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getTokenApp = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const requestToken = async (codeapp) => {
        let { data } = await axios.post(
          `${process.env.url_api_zoom}/oauth/token?grant_type=authorization_code&code=${codeapp}&redirect_uri=${process.env.url_auth_api}`,
          {},
          {
            headers: __headers__basic,
          }
        )
        console.log('requestToken', data)
        let { access_token, refresh_token, expires_in } = data
        await saveTokenApp(access_token, refresh_token, expires_in)
        return access_token
      }

      const refreshToken = async (id, refreshToken) => {
        let { data } = await axios.post(
          `${process.env.url_api_zoom}/oauth/token?grant_type=refresh_token&refresh_token=${refreshToken}`,
          {},
          {
            headers: __headers__basic,
          }
        )
        console.log('refreshToken', data)
        let { access_token, refresh_token } = data
        await Util.findByIdAndUpdate(id, {
          $set: {
            value: access_token,
            refreshToken: refresh_token,
            expireAtMs: moment().add(50, 'minutes').valueOf(),
          },
        })

        return data.access_token
      }

      let date = moment().valueOf()
      let tokenapp = await Util.findOne({
        field: process.env.name_toke_app,
      }).lean()

      console.log(tokenapp)

      if (tokenapp) {
        if (tokenapp.expire) {
          // if (true) {
          // if (false)
          if (date < parseInt(tokenapp.expireAtMs))
            return resolve(tokenapp.value)
          else
            return resolve(
              await refreshToken(tokenapp._id, tokenapp.refreshToken)
            )
        } else return resolve(tokenapp.value)
      } else {
        let codeapp = await getCodeApp()
        return resolve(await requestToken(codeapp))
      }
    } catch (error) {
      return reject(error)
    }
  })
}

const saveTokenApp = (token, refreshToken, expireAt) => {
  return new Promise(async (resolve, reject) => {
    try {
      //   await Util.findOneAndUpdate(
      //     { field: process.env.name_toke_app },
      //     {
      //       field: process.env.name_toke_app,
      //       value: token,
      //       refreshToken,
      //       expire: true,
      //       expireAtMs: expireAt * 1000,
      //     },
      //     { upsert: true }
      //   )
      await Util.create({
        field: process.env.name_toke_app,
        value: token,
        refreshToken,
        expire: true,
        expireAtMs: moment().add(50, 'minutes'),
      })
      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getAllUsers = (code = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tokenapp = null
      let tokenRefresh = null

      if (!code) tokenapp = await getTokenApp()
      else {
        let { data: dataTokenUser } = await axios.post(
          `${process.env.url_api_zoom}/oauth/token?grant_type=authorization_code&code=${code}&redirect_uri=${process.env.url_auth_api}`,
          {},
          {
            headers: __headers__basic,
          }
        )
        console.log('dataTokenUser', dataTokenUser)
        tokenapp = dataTokenUser.access_token
        tokenRefresh = dataTokenUser.refresh_token
      }

      console.log('tokenapp', tokenapp)

      let { data } = await axios.get(
        `${process.env.url_api_zoom}/v2/users?page_size=300`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + tokenapp,
            'cache-control': 'no-cache',
          },
        }
      )

      console.log(data)

      for (let user of data.users) {
        await getUser(user.id, tokenapp, tokenRefresh)
      }
      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getUser = (userId, tokenapp, refreshToken = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // let tokenapp = await getTokenApp()

      let { data } = await axios.get(
        `${process.env.url_api_zoom}/v2/users/${userId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + tokenapp,
            'cache-control': 'no-cache',
          },
        }
      )

      let { id, first_name, last_name, email, jid, account_id } = data
      await User.findOneAndUpdate(
        { email },
        {
          userId: id,
          name: first_name,
          lastname: last_name,
          email,
          jid,
          token: tokenapp,
          refreshToken,
          accountId: account_id,
        },
        { upsert: true }
      )

      return resolve(data)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getAllMeetings = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tokenapp = await getTokenApp()

      console.log('tokenapp', tokenapp)

      let { data } = await axios.get(
        `${process.env.url_api_zoom}/v2/users/${userId}/meetings?page_size=300`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + tokenapp,
            'cache-control': 'no-cache',
          },
        }
      )

      return resolve(data)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const getUsersMeeting = (meetingId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tokenapp = await getTokenApp()

      console.log('tokenapp', tokenapp)

      await axios.patch(
        `${process.env.url_api_zoom}/v2/meetings/${meetingId}`,
        {
          settings: {
            approval_type: 0,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + tokenapp,
            'cache-control': 'no-cache',
          },
        }
      )

      let { data } = await axios.get(
        `${process.env.url_api_zoom}/v2/meetings/${meetingId}/registrants?page_size=300`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + tokenapp,
            'cache-control': 'no-cache',
          },
        }
      )

      return resolve(data)
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const startBot = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tokenchatbot = await getTokenChatBot()
      let { name, jid, accountId } = await User.findOne({ userId }).lean()

      let forms = await getAllForms()

      sendMessage(
        {
          head: { text: `Hola ${name}` },
          body: [
            {
              type: 'message',
              text: `Por favor selecciona el formulario que deseas iniciar`,
            },
            {
              type: 'select',
              text: 'Formularios',
              select_items: forms.map((f) => {
                return {
                  text: f.name,
                  value: `select_form_sesion|${f.id}`,
                }
              }),
            },
          ],
        },
        jid,
        accountId,
        tokenchatbot
      )

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const startSesion = (value, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [, formId] = value.split('|')

      let tokenchatbot = await getTokenChatBot()
      let { jid, accountId } = await User.findOne({ userId }).lean()
      let { name: formName, fields: formFields } = await getForm(formId)

      await Sesion.updateMany({}, { $set: { active: false } })
      await Sesion.create({
        formId,
        formName,
        active: true,
        fields: formFields,
      })

      let { meetings } = await getAllMeetings(userId)

      sendMessage(
        {
          head: { text: `Indicanos la reunión de la votación` },
          body: [
            {
              type: 'message',
              text: `Por favor seleccione la reunión`,
            },
            {
              type: 'select',
              text: 'Reuniones',
              select_items: meetings.map((m) => {
                return {
                  text: m.topic,
                  value: `select_form_meeting|${m.id}`,
                }
              }),
            },
          ],
        },
        jid,
        accountId,
        tokenchatbot
      )

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const startMeeting = (value, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [, meetingId] = value.split('|')

      let tokenchatbot = await getTokenChatBot()
      let { jid, accountId } = await User.findOne({ userId }).lean()

      let { registrants } = await getUsersMeeting(meetingId)

      // for (let user of registrants) {
      //   await getUser(user.id)
      // }

      let { fields: formFields } = await Sesion.findOneAndUpdate(
        { active: true },
        { $set: { userIds: registrants.map((r) => r.email), meetingId } }
      )

      let body = []

      formFields
        .filter((f) => f.hidden == '0')
        .forEach((f, i) =>
          body.push({ type: 'message', text: `#p${i + 1} --> ${f.label}` })
        )

      sendMessage(
        {
          head: { text: `Sesión creada con éxito.` },
          body: [
            {
              type: 'message',
              text: `Para enviar una pregunta a los usuarios, escriba #p seguido del numero de orden. Ejemplo: #p1 ó #p3`,
            },
            ...body,
          ],
        },
        jid,
        accountId,
        tokenchatbot
      )

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const startQuestion = (cmd, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [, , nro] = cmd.split('')

      if (nro) {
        let tokenchatbot = await getTokenChatBot()
        // let { jid, accountId } = await User.findOne({ userId }).lean()

        let sesion = await Sesion.findOne({ active: true })

        let users = await getAllJidByEmail(sesion.userIds)

        let field = sesion.fields[parseInt(nro) - 1]

        if (field)
          for (let user of users) {
            sendMessage(
              {
                head: { text: `Pregunta Nro. ${nro}` },
                body: [
                  {
                    type: 'message',
                    text: `Por favor contesta la siguiente pregunta`,
                  },
                  {
                    type: 'select',
                    text: field.label,
                    select_items: field.options.map((f) => {
                      let __value = {}
                      __value[`field_${field.id}`] = f.value
                      return {
                        text: f.label,
                        value: `select_question|${sesion._id}|${JSON.stringify({
                          ...__value,
                        })}`,
                      }
                    }),
                  },
                ],
              },
              user.jid,
              user.accountId,
              tokenchatbot
            )
          }
      } else {
      }

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const selectedQuestion = (value, userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let [, _id, answer] = value.split('|')

      //   let tokenchatbot = await getTokenChatBot()
      let { jid, accountId, _id: idUser } = await User.findOne({
        userId,
      }).lean()

      //   let sesion = await Sesion.findOne({ active: true })

      let sesionUser = await Sesion.findOne({
        $and: [{ 'user.userId': idUser }, { _id }],
      }).lean()

      if (sesionUser) {
        await Sesion.updateOne(
          { _id, 'user.userId': idUser },
          {
            $push: { 'user.$.fields': answer },
          }
        )
      } else {
        await Sesion.findByIdAndUpdate(_id, {
          $push: { user: { userId: idUser, fields: [] } },
        })
        await Sesion.updateOne(
          { _id, 'user.userId': idUser },
          {
            $push: { 'user.$.fields': answer },
          }
        )
      }

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const endBot = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let tokenchatbot = await getTokenChatBot()
      let { name, jid, accountId } = await User.findOne({ userId }).lean()

      let {
        formId,
        formName,
        user: users,
        fields: formFields,
      } = await Sesion.findOne({
        active: true,
      })

      if (formId) {
        let idEmailForm = formFields.find((f) => f.type == 'email')
        idEmailForm = idEmailForm ? idEmailForm.id : null

        for (let user of users) {
          let {
            name: userName,
            jid: userJid,
            accountId: userAccountId,
            email: userEmail,
          } = await User.findOne({
            _id: user.userId,
          }).lean()
          let _fields = {}
          if (idEmailForm) _fields[`field_${idEmailForm}`] = userEmail
          for (let f of user.fields) _fields = { ..._fields, ...JSON.parse(f) }
          await submissionForm(formId, _fields)
          sendMessage(
            {
              head: { text: `Hola ${userName}` },
              body: [
                {
                  type: 'message',
                  text: `Tus respuestas fueron recibidas con éxito. ¡Gracias!`,
                },
              ],
            },
            userJid,
            userAccountId,
            tokenchatbot
          )
        }

        sendMessage(
          {
            head: { text: `Hasta luego ${name}` },
            body: [
              {
                type: 'message',
                text: `Formulario "${formName}" enviado con éxito. `,
              },
            ],
          },
          jid,
          accountId,
          tokenchatbot
        )
      }

      return resolve()
    } catch (error) {
      console.log(error)
      return reject(error)
    }
  })
}

const sendMessage = ({ head, body }, to_jid, account_id, token) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(token)
      let content = {
        head,
        body: [
          {
            type: 'section',
            sections: [...body],
            // footer: 'Para salir del formulario escriba -s ó salir | ',
            ts: Date.now(),
          },
        ],
      }
      let { data } = await axios.post(
        `${process.env.url_api_zoom}/v2/im/chat/messages`,
        {
          robot_jid: process.env.zoom_bot_jid,
          to_jid,
          account_id,
          content,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
            'cache-control': 'no-cache',
          },
        }
      )
      return resolve()
    } catch (error) {
      console.log(error)
      reject(error)
    }
  })
}

module.exports = {
  getTokenChatBot,
  saveTokenApp,
  getTokenApp,
  getAllUsers,
  getUser,
  startBot,
  startSesion,
  startQuestion,
  selectedQuestion,
  endBot,
  startMeeting,
}
