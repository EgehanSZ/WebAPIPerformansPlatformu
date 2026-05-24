// api/history.js
// GET /api/history?limit=20
//
// En son çalıştırılan testleri (yeni → eski) listeler.
// Frontend'de "geçmiş testler" tablosunu beslemek için kullanılır.

import { connectDB } from '../lib/db.js';
import TestRun from '../lib/models/TestRun.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res
      .status(405)
      .json({ error: 'Method not allowed. GET kullanın.' });
  }

  try {
    // Sayfa boyutunu makul bir aralıkta tut (1..100).
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query?.limit, 10) || 20)
    );

    await connectDB();

    // Liste sayfasında detaylı sample'lara ihtiyaç yok — payload'ı küçük tut.
    const runs = await TestRun.find({}, { samples: 0 })
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
