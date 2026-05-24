// lib/models/TestRun.js
// Tek bir performans testinin sonucunu temsil eden Mongoose modeli.
// Her test bir "TestRun" dökümanı olarak saklanır.

import mongoose from 'mongoose';

const { Schema } = mongoose;

// Tek bir istek için detay — opsiyonel olarak ilk N tanesini saklarız.
// (Yüzlerce isteğin hepsini saklamak veritabanını gereksiz şişirir;
// aggregate metrikler asıl değer.)
const RequestSampleSchema = new Schema(
  {
    index: { type: Number, required: true },
    status: { type: Number, default: 0 }, // 0 = network error / timeout
    latencyMs: { type: Number, required: true },
    ok: { type: Boolean, required: true },
    error: { type: String, default: null },
  },
  { _id: false }
);

const TestRunSchema = new Schema(
  {
    // Clerk kullanıcı ID'si (user_xxx formatı).
    // Eski belgelerle geriye dönük uyumluluk için required değil,
    // ancak tüm yeni testlere mutlaka yazılır.
    userId: {
      type: String,
      index: true,
    },

    url: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    method: {
      type: String,
      enum: ['GET', 'HEAD'],
      default: 'GET',
    },
    requestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    concurrency: {
      type: Number,
      default: 10,
    },

    // Aggregate metrikler (ms cinsinden)
    averageLatency: { type: Number, required: true },
    minLatency: { type: Number, required: true },
    maxLatency: { type: Number, required: true },
    p95Latency: { type: Number, required: true },

    // Başarı / hata sayıları
    successCount: { type: Number, required: true },
    errorCount: { type: Number, required: true },
    successRate: { type: Number, required: true }, // 0–100 arası yüzde

    // Toplam test süresi (ilk istek başladığında — son istek bittiğinde)
    totalDurationMs: { type: Number, required: true },

    // İlk birkaç istek örneği (debug için).
    // requestCount büyük olsa bile en fazla 50 sample saklarız.
    samples: { type: [RequestSampleSchema], default: [] },
  },
  {
    timestamps: true, // createdAt + updatedAt
    versionKey: false,
  }
);

// Kullanıcıya özel listeleme için compound index: userId + createdAt.
TestRunSchema.index({ userId: 1, createdAt: -1 });

// Aynı model tekrar tekrar register edilmesin (hot reload / serverless warm).
export default mongoose.models.TestRun ||
  mongoose.model('TestRun', TestRunSchema);
