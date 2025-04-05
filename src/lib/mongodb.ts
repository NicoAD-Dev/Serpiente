import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017";
const client = new MongoClient(uri);

export async function connectDB() {
  try {
    await client.connect();
    return client.db("snakeGame");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

export async function getHighScores() {
  try {
    const db = await connectDB();
    return await db
      .collection("scores")
      .find({})
      .sort({ score: -1 })
      .limit(5)
      .toArray();
  } catch (error) {
    console.error("Error getting high scores:", error);
    return [];
  }
}

export async function saveScore(scoreData: {
  score: number;
  duration: number;
  date: string;
}) {
  try {
    const db = await connectDB();
    await db.collection("scores").insertOne({
      ...scoreData,
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Error saving score:", error);
  }
}