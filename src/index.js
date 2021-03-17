/**
 * Server
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const routes = require('./routes')

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/', routes)

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
