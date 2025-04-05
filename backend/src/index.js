import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017";

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    return client.db("snakeGame");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

app.get('/api/scores', async (req, res) => {
  try {
    const db = await connectDB();
    const scores = await db
      .collection("scores")
      .find({})
      .sort({ score: -1 })
      .limit(5)
      .toArray();
    res.json(scores);
  } catch (error) {
    console.error("Error getting high scores:", error);
    res.status(500).json({ error: "Error retrieving scores" });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const db = await connectDB();
    const scoreData = {
      ...req.body,
      createdAt: new Date()
    };
    await db.collection("scores").insertOne(scoreData);
    res.status(201).json({ message: "Score saved successfully" });
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "Error saving score" });
  }
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});