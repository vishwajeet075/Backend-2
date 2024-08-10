console.log('Server starting...');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const faunadb = require('faunadb');
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


const q = faunadb.query;
const client = new faunadb.Client({ secret: process.env.FAUNADB_SECRET });



app.post('/submit-form-1', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const result = await client.query(
      q.Create(
        q.Collection('contact_mini'),
        { data: { name, email, message } }
      )
    );
    res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});



app.post('/submit-contact-form',  async (req, res) => {
  const { name, email, company, designation, city, country, message } = req.body;

  try {
    const result1 = await client.query(
      q.Create(
        q.Collection('Contacts'),
        { data: { name, email, company, designation, city, country, message } }
      )
    );
    res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});



app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
