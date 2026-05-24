// api/test.js
// POST /api/test
//
// Body: { url: string, requestCount: number, method?: 'GET'|'HEAD' }
//
// 1) Girdi doğrulaması (URL formatı, sayı sınırı)
// 2) Performans testini çalıştırır
// 3) Sonucu MongoDB'ye kaydeder
// 4) Frontend'e döner

import { connectDB } from '../lib/db.js';
import TestRun from '../lib/models/TestRun.js';
import { runPerformanceTest } from '../lib/runPerformanceTest.js';

const MAX_REQUESTS =
  Number(process.env.MAX_REQUESTS_PER_TEST) || 200;

// Sadece http/https şemalarına izin ver — SSRF riskine karşı temel koruma.
function validateUrl(input) {
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return { ok: false, reason: 'Geçersiz URL formatı.' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: 'Sadece http ve https desteklenir.' };
  }
  return { ok: true, parsed };
}

export default async function handler(req, res) {
  // CORS (Vercel preview ve farklı origin'lerden test için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ error: 'Method not allowed. POST kullanın.' });
  }

  try {
    // Vercel Node fonksiyonlarında req.body genelde otomatik parse edilir.
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const { url, requestCount, method = 'GET' } = body;

    // ---- Doğrulama ----
    const urlCheck = validateUrl(url);
    if (!urlCheck.ok) {
      return res.status(400).json({ error: urlCheck.reason });
    }

    const count = Number(requestCount);
    if (!Number.isInteger(count) || count < 1) {
      return res
        .status(400)
        .json({ error: 'requestCount en az 1 olan bir tam sayı olmalıdır.' });
    }
    if (count > MAX_REQUESTS) {
      return res.status(400).json({
        error: `İstek sayısı ${MAX_REQUESTS} üst sınırını aşıyor.`,
      });
    }
    if (!['GET', 'HEAD'].includes(method)) {
      return res
        .status(400)
        .json({ error: 'method sadece GET veya HEAD olabilir.' });
    }

    // ---- Test ----
    const result = await runPerformanceTest({
      url: urlCheck.parsed.toString(),
      requestCount: count,
      method,
    });

    // ---- Kaydet ----
    await connectDB();
    const saved = await TestRun.create(result);

    return res.status(201).json({
      id: saved._id,
      ...result,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error('[/api/test] hata:', err);
    return res.status(500).json({
      error: 'Test çalıştırılırken sunucu hatası oluştu.',
      detail: err.message,
    });
  }
}
