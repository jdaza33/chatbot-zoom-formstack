/**
 * Controlador del chatbot
 */

require('dotenv').config()
//Services
const { saveCodeApp } = require('../services/utils.srv')
const { getUser } = require('../services/user.srv')
const {
  getTokenChatBot,
  saveTokenApp,
  getTokenApp,
  getAllUsers,
  startBot,
  startSesion,
  startQuestion,
  selectedQuestion,
  endBot,
  startMeeting,
} = require('../services/zoom.srv')

const main = (req, res, next) => {
  res.send('Welcome to the Unsplash Chatbot for Zoom!')
}

const authorize = async (req, res, next) => {
  try {
    console.log('authorize', req.query)
    let { code } = req.query
    if (code) await saveCodeApp(code)

    res.redirect(
      'https://zoom.us/launch/chat?jid=robot_' + process.env.zoom_bot_jid
    )
  } catch (error) {
    console.log(error)
    next(error)
  }
}

const deauthorize = async (req, res, next) => {
  try {
    if (req.headers.authorization === process.env.zoom_verification_token) {
      res.status(200)
      res.send()
      request(
        {
          url: 'https://api.zoom.us/oauth/data/compliance',
          method: 'POST',
          json: true,
          body: {
            client_id: req.body.payload.client_id,
            user_id: req.body.payload.user_id,
            account_id: req.body.payload.account_id,
            deauthorization_event_received: req.body.payload,
            compliance_completed: true,
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Basic ' +
              Buffer.from(
                process.env.zoom_client_id +
                  ':' +
                  process.env.zoom_client_secret
              ).toString('base64'),
            'cache-control': 'no-cache',
          },
        },
        (error, httpResponse, body) => {
          if (error) {
            console.log(error)
          } else {
            console.log(body)
          }
        }
      )
    } else {
      res.status(401)
      res.send('Unauthorized request to Unsplash Chatbot for Zoom.')
    }
  } catch (error) {
    next(error)
  }
}

const support = (req, res, next) => {
  res.send('Contact tommy.gaessler@zoom.us for support.')
}
const policy = (req, res, next) => {
  res.send('The Unsplash Chatbot for Zoom does not store any user data.')
}
const terms = (req, res, next) => {
  res.send(
    'By installing the Unsplash Chatbot for Zoom, you are accept and agree to these terms...'
  )
}
const documentation = (req, res, next) => {
  res.send(
    'Try typing "island" to see a photo of an island, or anything else you have in mind!'
  )
}
const zoomverify = (req, res, next) => {
  res.send(process.env.zoom_verification_code)
}

const submission_formstack = async (req, res, next) => {
  try {
    let { userId } = req.body
    let { email } = await getUser(userId)

    let lastFields = {}
    if (idFieldEmail) lastFields[`field_${idFieldEmail}`] = email
    for (let f of fields) {
      lastFields = { ...lastFields, ...JSON.parse(f) }
    }

    await sendSubmissionForm(formId, lastFields)

    res.status(200).json({ success: 1 })
  } catch (error) {
    next(error)
  }
}

const bot = async (req, res, next) => {
  try {
    console.log(req.body)
    let { payload, event } = req.body
    let { userId, cmd } = payload

    if (event == process.env.event_bot_notification) {
      let { email } = await getUser(userId)
      if (email == process.env.email_admin) {
        if (cmd.trim() == '#iniciar') await startBot(userId)

        if (/#p/.test(cmd.trim())) await startQuestion(cmd, userId)

        if (cmd.trim() == '#finalizar') await endBot(userId)
      }
    }

    if (event == process.env.event_bot_message_select) {
      let { original, selectedItems } = payload
      console.log(original, selectedItems)

      //Verificamos la solicitud
      if (/select_form_sesion/.test(selectedItems[0].value))
        await startSesion(selectedItems[0].value, userId)

      if (/select_form_meeting/.test(selectedItems[0].value))
        await startMeeting(selectedItems[0].value, userId)

      if (/select_question/.test(selectedItems[0].value)) {
        await selectedQuestion(selectedItems[0].value, userId)
      }
    }
  } catch (error) {
    next(error)
  }
}

module.exports = {
  main,
  authorize,
  deauthorize,
  support,
  policy,
  terms,
  documentation,
  zoomverify,
  submission_formstack,
  bot,
}
