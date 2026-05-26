// lib/auth.js
// Vercel serverless fonksiyonları için Clerk JWT doğrulama yardımcısı.
//
// Her handler tek satırla:
//   const userId = await requireAuth(req);
// çağırarak kimlik doğrulamasını tamamlar; yetkisizse otomatik 401 fırlatılır.

// @clerk/backend v3'te verifyToken standalone fonksiyon olarak export edilir,
// createClerkClient().verifyToken() yöntemi artık mevcut değil.
import { verifyToken } from '@clerk/backend';

/**
 * İstek başlığındaki Bearer token'ı doğrular.
 * Başarılıysa Clerk userId'yi (sub claim) döner.
 * Başarısızsa status 401 olan bir Error fırlatır.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<string>} userId
 */
export async function requireAuth(req) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error(
      'CLERK_SECRET_KEY ortam değişkeni tanımlı değil. ' +
        'Vercel Dashboard → Settings → Environment Variables kısmını kontrol et.'
    );
  }

  // Hem küçük hem büyük harf başlık adlarını destekle.
  const authHeader =
    req.headers?.authorization ?? req.headers?.Authorization ?? '';

  if (!authHeader.startsWith('Bearer ')) {
    const err = new Error('Yetkilendirme başlığı eksik. Lütfen giriş yapın.');
    err.status = 401;
    throw err;
  }

  const token = authHeader.slice(7);

  try {
    // Standalone verifyToken — @clerk/backend v3 API.
    const payload = await verifyToken(token, {
      secretKey,
      authorizedParties: [
        'https://www.apiperformance.cloud',
        'https://apiperformance.cloud',
      ],
    });
    // Clerk JWT'sindeki `sub` alanı kullanıcı ID'sidir (user_xxx formatı).
    return payload.sub;
  } catch (verifyErr) {
    console.error('[requireAuth] verifyToken failed:', verifyErr?.message || verifyErr);
    const err = new Error('Geçersiz veya süresi dolmuş oturum. Yeniden giriş yapın.');
    err.status = 401;
    throw err;
  }
}
