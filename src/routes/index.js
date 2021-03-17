/**
 * Manejo de rutas
 */

// Modules
const express = require('express')
const router = express.Router()

// Controllers

const {
  main,
  authorize,
  deauthorize,
  submission_formstack,
  bot,
} = require('../controllers/bot.ctrl')

/** BOT */
router.get('/', main)
router.get('/authorize', authorize)
router.post('/deauthorize', deauthorize)
router.post('/submission/formstack', submission_formstack)
router.post('/bot', bot)

module.exports = router
