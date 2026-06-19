import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "brandops";

if (!uri) {
  throw new Error("MONGODB_URI is not set");
}

declare global {
  var _brandopsMongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._brandopsMongoClientPromise) {
    const client = new MongoClient(uri);
    global._brandopsMongoClientPromise = client.connect();
  }
  clientPromise = global._brandopsMongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getMongoClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}
