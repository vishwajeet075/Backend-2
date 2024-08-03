console.log('Server starting...');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const serverlessMysql = require('serverless-mysql');
const fs=require('fs');
const router = express.Router();

const corsOptions = {
  origin: ['https://api.greenovate.in'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};


const app = express();
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

console.log('Initializing MySQL connection...');
const mysql = serverlessMysql({
  config: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
   
      ca: fs.readFileSync(__dirname, 'ca.pem').toString(),
    },
    connectTimeout: 10000,
    acquireTimeout: 10000
  },
  onConnect: () => {
    console.log('Connected to MySQL');
  },
  pool: {
    min: 0,
    max: 5
  }
});

async function ensureConnection() {
  try {
    await mysql.connect();
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

async function createTable() {
  console.log('Attempting to create table...');
  try {
    await mysql.query(`
      CREATE TABLE IF NOT EXISTS contact_mini (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL
      )
    `);
    console.log('Table created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

async function createTable_contact() {
  console.log('Attempting to create table...');
  try {
    await mysql.query(`
      CREATE TABLE IF NOT EXISTS Contact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        designation VARCHAR(255),
        city VARCHAR(255),
        country VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table created or already exists');
  } catch (error) {
    console.error('Error creating table:', error);
    throw error;
  }
}

app.post('/submit-form-1', async (req, res) => {
  console.log('Received form submission request');
  console.log('Request body:', req.body);
  const { name, email, message } = req.body;
  try {
    await ensureConnection();
    console.log('Ensuring table exists...');
    await createTable();
    console.log('Inserting data into table...');
    await mysql.query(
      'INSERT INTO contact_mini (email, name, message) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, message = ?',
      [email, name, message, name, message]
    );
    console.log('Data inserted successfully');
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Detailed error:', error.stack);
    res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
  } finally {
    await mysql.end();
  }
});

app.post('/submit-contact-form', async (req, res) => {
  console.log('Received form submission request');
  console.log('Request body:', req.body);
  const { name, email, company, designation, city, country, message } = req.body;
  try {
    await ensureConnection();
    console.log('Ensuring table exists...');
    await createTable_contact();
    console.log('Inserting data into table...');
    await mysql.query(
      'INSERT INTO Contact (name, email, company, designation, city, country, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, company, designation, city, country, message]
    );
    console.log('Data inserted successfully');
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Detailed error:', error.stack);
    res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
  } finally {
    await mysql.end();
  }
});

app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
