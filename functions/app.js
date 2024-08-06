console.log('Server starting...');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
/*const serverlessMysql = require('serverless-mysql');*/
const mysql = require('mysql2/promise');
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

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca : process.env.CA_CERT
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to execute queries with retries
async function executeQuery(sql, params, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const connection = await pool.getConnection();
      try {
        const [results] = await connection.query(sql, params);
        return results;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error(`Query execution error (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}

async function createTable(tableName, schema) {
  console.log(`Attempting to create table ${tableName}...`);
  try {
    await executeQuery(`CREATE TABLE IF NOT EXISTS ${tableName} ${schema}`);
    console.log(`Table ${tableName} created or already exists`);
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error);
    throw error;
  }
}

app.post('/submit-form-1', async (req, res) => {
  console.log('Received form submission request');
  console.log('Request body:', req.body);
  const { name, email, message } = req.body;
  
  try {
    await createTable('contact_mini', `(
      email VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      message TEXT NOT NULL
    )`);
    
    await executeQuery(
      'INSERT INTO contact_mini (email, name, message) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, message = ?',
      [email, name, message, name, message]
    );
    
    console.log('Data inserted successfully');
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
  }
});

app.post('/submit-contact-form', async (req, res) => {
  console.log('Received form submission request');
  console.log('Request body:', req.body);
  const { name, email, company, designation, city, country, message } = req.body;
  
  try {
    await createTable('Contact', `(
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      designation VARCHAR(255),
      city VARCHAR(255),
      country VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    await executeQuery(
      'INSERT INTO Contact (name, email, company, designation, city, country, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, company, designation, city, country, message]
    );
    
    console.log('Data inserted successfully');
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ success: false, message: 'An error occurred', error: error.message });
  }
});

app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
