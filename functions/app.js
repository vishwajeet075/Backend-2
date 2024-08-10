console.log('Server starting...');
const serverless = require('serverless-http');
/*const { MongoClient } = require('mongodb');*/
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
    console.log("Document Created and Inserted: ", result.ref);
    res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  }
});


/*const uri = process.env.mongo_url;
const client = new MongoClient(uri);

app.post('/submit-form-1', async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await client.connect();
    const database = client.db('Contact_details');
    const collection = database.collection('contact_mini');
    const doc = { name, email, message };
    const result = await collection.insertOne(doc);
    console.log('A document was inserted');
    res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
    await client.close();
  }
});*/



app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
