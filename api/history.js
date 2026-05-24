// api/history.js
// GET /api/history?limit=20
//
// Sadece giriş yapmış kullanıcının (userId) testlerini döndürür.
// Kimlik doğrulaması Clerk JWT ile yapılır.

import { connectDB } from '../lib/db.js';
import TestRun from '../lib/models/TestRun.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ error: 'Method not allowed. GET kullanın.' });
  }

  // ---- Kimlik doğrulama ----
  let userId;
  try {
    userId = await requireAuth(req);
  } catch (err) {
    return res.status(err.status ?? 401).json({ error: err.message });
  }

  try {
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query?.limit, 10) || 20)
    );

    await connectDB();

    // userId filtresiyle sadece bu kullanıcının testlerini getir.
    const runs = await TestRun.find({ userId }, { samples: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({ items: runs, count: runs.length });
  } catch (err) {
    console.error('[/api/history] stack:', err.stack);
    return res.status(500).json({
      error: err.message || 'Geçmiş testler getirilirken sunucu hatası oluştu.',
    });
  }
}
