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

const { getAllForms, calculateForm } = require('../services/formstack.srv')

/** BOT */
router.get('/', main)
router.get('/authorize', authorize)
router.post('/deauthorize', deauthorize)
router.post('/submission/formstack', submission_formstack)
router.post('/bot', bot)
router.get('/forms/all', async (req, res, next) => {
  try {
    let forms = await getAllForms()
    res.json({ forms, success: 1 })
  } catch (error) {
    res.json({ error, success: 0 })
  }
})

router.get('/calculate/form/:id', async (req, res, next) => {
  try {
    let result = await calculateForm(req.params.id)
    res.json({ result, success: 1 })
  } catch (error) {
    res.json({ error, success: 0 })
  }
})

module.exports = router
