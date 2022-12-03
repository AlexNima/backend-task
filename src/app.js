const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const { sequelize } = require('./model')
const app = express()
const router = require('./routes/api')

app.use(helmet())
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
app.use('/', router)

module.exports = app
