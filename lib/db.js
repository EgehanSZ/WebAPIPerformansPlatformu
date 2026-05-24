// lib/db.js
// MongoDB Atlas bağlantı yöneticisi — cached connection pattern.
// Serverless ortamda sıcak (warm) lambda örnekleri arasında bağlantı yeniden kullanılır.

import mongoose from 'mongoose';

let cached = globalThis.__mongooseCache;
if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  // Her çağrıda MONGODB_URI'yi oku — modül yüklenirken değil.
  // Bu sayede eksik env, lambda başlamadan değil çağrı sırasında yakalanır.
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI ortam değişkeni tanımlı değil. ' +
        'Vercel Dashboard → Settings → Environment Variables kısmını kontrol et.'
    );
  }

  // Sıcak lambda örneğinde mevcut bağlantıyı döndür.
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Başarısız promise'i temizle — bir sonraki istek yeniden denesin.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
