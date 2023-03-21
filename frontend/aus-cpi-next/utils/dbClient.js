const { Client } = require('pg');

const connectionString = `postgresql://${process.env.DB_PASS}:${process.env.DB_USER}@${process.env.DB_HOST}:5432/auscpidb`
 
const client = new Client({
  connectionString,
})

client.connect()

export default client;