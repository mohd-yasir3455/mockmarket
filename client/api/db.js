import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI;

// Connection caching across lambdas
if (!global._mongo) global._mongo = { conn: null, promise: null };

export async function connectToDatabase() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI not set');
  }

  if (global._mongo.conn) return global._mongo.conn;

  if (!global._mongo.promise) {
    global._mongo.promise = mongoose.connect(MONGO_URI, {
      // useNewUrlParser / useUnifiedTopology not needed in Mongoose 7+
    }).then((m) => {
      return m.connection;
    });
  }

  global._mongo.conn = await global._mongo.promise;
  return global._mongo.conn;
}
