const express = require('express')
const app = express()
require('dotenv').config()
app.use(express.static('dist'))
const Person = require('./models/person')
const morgan = require('morgan')
const cors = require('cors')

morgan.token('reqBody', function getData (req) { return JSON.stringify(req.body) })

const ErrorHandler = (error, request, response, next) => {
  console.log(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  next(error)
}

app.use(cors())
app.use(express.json())
app.use(morgan('tiny', {
  skip: function (req) { return req.method === 'POST' }
}))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :reqBody', {
  skip: function (req) { return req.method !== 'POST' }
}))

app.get('/api/persons', (request, response, next) => {
  Person.find({}).then(persons =>
    response.json(persons)
  )
    .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
  let currentTime = new Date()

  Person.find({})
    .then(persons =>
      response.send(`<p>Phonebook has info for ${persons.length} people.</p> <p>${currentTime}</p>`)
    )
    .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndDelete(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))

})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => next(error))
})

app.use(ErrorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})