// lib/db.js
// MongoDB Atlas bağlantı yöneticisi.
//
// Serverless ortamda (Vercel) her fonksiyon çağrısı potansiyel olarak
// yeni bir Node.js sürecidir. Her invokeda yeni bir bağlantı açmak Atlas
// üzerindeki connection limitini hızla tüketir. Bu yüzden "cached connection"
// pattern'i kullanıyoruz: aynı sıcak (warm) lambda örneğinde bağlantıyı
// yeniden kullanırız.

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'MONGODB_URI ortam değişkeni tanımlı değil. .env veya Vercel proje ayarlarını kontrol edin.'
  );
}

// globalThis üzerinde cache tutuyoruz; çünkü her dosya yeniden
// import edildiğinde modül seviyesi değişkenler resetlenebilir.
let cached = globalThis.__mongooseCache;

if (!cached) {
  cached = globalThis.__mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        // bufferCommands kapalı: bağlantı yoksa hata fırlatsın ki
        // sessiz şekilde hata yutmayalım.
        bufferCommands: false,
        // Bağlantı kurma süresi için makul bir timeout.
        serverSelectionTimeoutMS: 10000,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Başarısız promise'i temizle ki bir sonraki istek yeniden denesin.
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}
