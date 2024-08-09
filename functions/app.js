console.log('Server starting...');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');

const util = require('util'); 

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






const mysql = require('serverless-mysql')({
  config: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS contact_mini (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

const insertQuery = `
  INSERT INTO contact_mini (email, name, message)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE name = VALUES(name), message = VALUES(message)
`;

exports.handler = async (event, context) => {
  let connection = null;
  
  try {
    console.log('Received form submission request');
    console.log('Request body:', event.body);
    const { name, email, message } = JSON.parse(event.body);

    connection = await mysql.connect();
    console.log('Connected to the database');

    // Check if table exists and create if needed
    await connection.query(createTableQuery);

    console.log('Inserting data into table...');
    await connection.query(insertQuery, [email, name, message]);
    console.log('Data inserted successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Form submitted successfully' })
    };
  } catch (error) {
    console.error('Error submitting form:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'An error occurred' })
    };
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
};


/*async function createTable_contact() {
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
  }
}

app.post('/submit-contact-form',  async (req, res) => {
  console.log('Received form submission request');
  console.log('Request body:', req.body);
  const { name, email, company, designation, city, country, message } = req.body;

  try {
    console.log('Ensuring table exists...');
    await createTable_contact(); // Ensure table exists

    console.log('Inserting data into table...');
    await mysql.query(
      'INSERT INTO Contact (name, email, company, designation, city, country, message) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, company, designation, city, country, message]
    );

    console.log('Data inserted successfully');
    await mysql.end();
    res.json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});*/

app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
