/**
 * Server
 */

require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const mongoose = require('mongoose')
const history = require('connect-history-api-fallback')
const routes = require('./routes')
const staticConf = { maxAge: '1y', etag: false }

const app = express()
const port = process.env.PORT || 3002

const publicPath = path.resolve(__dirname, './views/dist')

app.use(cors())
app.use(express.json())

app.use('/', routes)

app.use(express.static(publicPath, staticConf))
app.use(history())
app.use(express.static(publicPath, staticConf))

app.get('/form', function (req, res) {
  res.render(path.join(__dirname, 'index.html'))
})

//DATABASE
mongoose
  .connect(process.env.mongodb_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((res) => {
    console.log('Base de datos iniciada')
  })
  .catch((err) => {
    console.log(err)
  })

app.listen(port, () => console.log(`Server on port: ${port}!`))
