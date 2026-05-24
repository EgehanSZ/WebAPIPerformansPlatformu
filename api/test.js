// api/test.js
// POST /api/test
//
// Body: { url: string, requestCount: number, method?: 'GET'|'HEAD' }
//
// 1) Clerk token doğrulaması (401 → yetkisiz)
// 2) Girdi doğrulaması (URL formatı, sayı sınırı)
// 3) Performans testini çalıştırır
// 4) Sonucu userId ile birlikte MongoDB'ye kaydeder
// 5) Frontend'e döner

import { connectDB } from '../lib/db.js';
import TestRun from '../lib/models/TestRun.js';
import { runPerformanceTest } from '../lib/runPerformanceTest.js';
import { requireAuth } from '../lib/auth.js';

const MAX_REQUESTS =
  Number(process.env.MAX_REQUESTS_PER_TEST) || 200;

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ error: 'Method not allowed. POST kullanın.' });
  }

  // ---- Kimlik doğrulama ----
  let userId;
  try {
    userId = await requireAuth(req);
  } catch (err) {
    return res.status(err.status ?? 401).json({ error: err.message });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    const { url, requestCount, method = 'GET' } = body;

    // ---- Girdi doğrulama ----
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

    // ---- Kaydet (userId dahil) ----
    await connectDB();
    const saved = await TestRun.create({ userId, ...result });

    return res.status(201).json({
      id: saved._id,
      ...result,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error('[/api/test] hata:', err);
    console.error('[/api/test] stack:', err.stack);
    return res.status(500).json({
      error: err.message || 'Test çalıştırılırken sunucu hatası oluştu.',
    });
  }
}
