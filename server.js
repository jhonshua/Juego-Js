const express = require('express')

const app = express()
const PORT = Number(process.env.PORT) || 5174
const HOST = process.env.HOST || '127.0.0.1'

app.use(express.static(__dirname))

app.listen(PORT, HOST, () => {
  console.log(`Pecas listo en http://${HOST}:${PORT}`)
})
