import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();

  const db = client.db('expense-tracker');
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('users');
}

export async function getExpensesCollection() {
  const { db } = await connectToDatabase();
  return db.collection('expenses');
}
