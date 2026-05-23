const express = require('express');
require('dotenv').config();
const cors = require('cors');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: [
    'https://assignment-frontend-parvez.vercel.app',
    'https://ideavault-frontend-three.vercel.app',
    'http://localhost:3000'
  ],
    credentials: true,
  })
);
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectDB() {
  try {
    await client.connect();
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    throw err;
  }
}

app.get('/', (req, res) => {
  res.send('IdeaVault Server is Running Smoothly!');
});

function base64Url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function createJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + 60 * 60 * 24 * 7,
  };
  const unsignedToken = `${base64Url(header)}.${base64Url(body)}`;
  const secret =
    process.env.JWT_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    'ideavault-development-secret';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(unsignedToken)
    .digest('base64url');
  return `${unsignedToken}.${signature}`;
}

app.post('/api/jwt', (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).send({ message: 'email is required' });

  const token = createJwt({ email, name });
  res.send({ token });
});

app.post('/api/ideas', async (req, res) => {
  try {
    await connectDB();
    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .insertOne(req.body);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/ideas', async (req, res) => {
  try {
    await connectDB();
    const { search, category } = req.query;
    const query = {};
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category && category !== 'All') query.category = category;

    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .find(query)
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/ideas/count', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ message: 'email query param required' });
    const count = await client
      .db('assignmentNine')
      .collection('dataall')
      .countDocuments({ userEmail: email });
    res.send({ count });
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/ideas/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await client.db('assignmentNine').collection('dataall').findOne(query);
    if (!result) return res.status(404).send({ message: 'Idea not found' });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.put('/api/ideas/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const { _id, ...update } = req.body;
    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .updateOne(query, { $set: update });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.delete('/api/ideas/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/my-ideas', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ message: 'email query param required' });
    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .find({ userEmail: email })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/my-interactions', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ message: 'email query param required' });
    const result = await client
      .db('assignmentNine')
      .collection('comments')
      .find({ email })
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const result = await client
      .db('assignmentNine')
      .collection('comments')
      .deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.put('/api/comments/:id', async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const { commentText } = req.body;
    const result = await client
      .db('assignmentNine')
      .collection('comments')
      .updateOne(query, { $set: { commentText } });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/comments/count', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.query;
    if (!email) return res.status(400).send({ message: 'email query param required' });
    const count = await client
      .db('assignmentNine')
      .collection('comments')
      .countDocuments({ email });
    res.send({ count });
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    await connectDB();
    const { ideaId } = req.query;
    const query = ideaId ? { ideaId } : {};
    const result = await client
      .db('assignmentNine')
      .collection('comments')
      .find(query)
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    await connectDB();
    const result = await client
      .db('assignmentNine')
      .collection('comments')
      .insertOne(req.body);
    res.status(201).send({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/api/trending-ideas', async (req, res) => {
  try {
    await connectDB();
    const result = await client
      .db('assignmentNine')
      .collection('dataall')
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .limit(6)
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error', error: error.message });
  }
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

module.exports = app;
