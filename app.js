const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()

app.use(express.json())

let db = null

const serverInit = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server running at http://localhost:3000/'),
    )
  } catch (e) {
    console.log(`DB Error: ${e}`)
    process.exit(1)
  }
}

serverInit()

const hasPriorAndStatus = query => {
  return query.priority !== undefined && query.status !== undefined
}

const hasPriority = query => {
  return query.priority !== undefined
}

const hasStatus = query => {
  return query.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorAndStatus(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' 
      AND priority = '${priority}'`
      break
    case hasPriority(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority = '${priority}'`
      break
    case hasStatus(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}'`
      break
    default:
      getQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
      break
  }

  data = await db.all(getQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `SELECT * FROM todo WHERE id='${todoId}'`
  const result = await db.get(query)
  response.send(result)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const query = `INSERT INTO todo (id,todo,priority,status) VALUES('${id}','${todo}','${priority}','${status}')`
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {id} = request.params
  let update = ''
  const reqBody = request.body
  switch (true) {
    case reqBody.status !== undefined:
      update = 'Status'
      break
    case reqBody.priority !== undefined:
      update = 'Priority'
      break
    case reqBody.todo !== undefined:
      update = 'Todo'
      break
  }
  const prevquery = `SELECT * FROM todo WHERE id = '${id}'`
  const prevTodo = await db.get(prevquery)

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
  } = request.body

  const updateQuery = `UPDATE todo SET todo='${todo}',priority='${priority}',
     status = '${status}' WHERE id = '${id}'`
  await db.run(updateQuery)
  response.send(`'${update}' Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {id} = request.params
  const query = `DELETE FROM todo WHERE id = '${id}'`
  await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
