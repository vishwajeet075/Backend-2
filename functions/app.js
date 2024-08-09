console.log('Server starting...');
const serverless = require('serverless-http');
const MongoClient = require('mongodb').MongoClient;
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




const uri = process.env.mongo_url;

app.post('/submit-form-1', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const database = client.db('Contact_details');
    const collection = database.collection('contact_mini');

    const doc = { name, email, message };
    const result = await collection.insertOne(doc);
    console.log(`A document was inserted with the _id: ${result.insertedId}`);

    res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ success: false, message:   
 'An error occurred' });
  } finally {
    await client.close();
  }
});




app.use('/.netlify/functions/app', router);

module.exports = app;
module.exports.handler = serverless(app);
