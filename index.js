const express = require('express')
const app = express()
require('dotenv').config()
app.use(express.static('dist'))
const Person = require('./models/person')
const morgan = require('morgan')
const cors = require('cors')

morgan.token('reqBody', function getData (req, res) { return JSON.stringify(req.body) })

const ErrorHandler = (error, request, response, next) => {
    console.log(error.message)
    if (error.name === "CastError") {
        return response.status(400).send({ error: 'malformatted id' })
    }
    next(error)
}

app.use(cors())
app.use(express.json())
app.use(morgan('tiny', {
  skip: function (req, res) { return req.method == "POST" }
}))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :reqBody', {
  skip: function (req, res) { return req.method != "POST" }
}))

let persons = [
    {
      "name": "Arto Hellas",
      "number": "040-2325768",
      "id": 1
    },
    {
      "name": "Ada Lovelace",
      "number": "39-44-5323523",
      "id": 2
    },
    {
      "name": "Dan Abramov",
      "number": "12-43-234345",
      "id": 3
    },
    {
      "name": "Mary Poppendieck",
      "number": "39-23-6423122",
      "id": 4
    }
  ]

app.get('/api/persons', (request, response, next) => {
    Person.find({}).then(persons =>
        response.json(persons)
    )
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
    let currentTime = new Date()
    response.send(`<p>Phonebook has info for ${persons.length} people.</p> <p>${currentTime}</p>`)
})

app.get('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    const person = persons.find(p => p.id === id)

    if (person) {
        response.json(person)
    } else {
        response.status(404).end()
    }
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
      .then(result => {
        response.status(204).end()
      })
      .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!(body.name && body.number)) {
        return response.status(400).json({
            error: "name or number missing"
        })
    }

    // if (persons.some(p => p.name === body.name)) {
    //     return response.status(400).json({
    //         error: "name must be unique"
    //     })
    // }

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