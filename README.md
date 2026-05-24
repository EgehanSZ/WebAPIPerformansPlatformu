# Web API Performans Test Platformu

Kullanıcının bir API URL'si ve istek sayısı girerek o endpoint'in
performansını (yanıt süresi, başarı oranı, p95) ölçebildiği bulut tabanlı
analiz platformu.

**Mimari:** Vercel Serverless Functions (Node.js) + MongoDB Atlas + React (Vite + Tailwind).

---

## Mimari Özeti

```
Browser ──► React (Vite, Tailwind, Recharts)
              │
              ▼  (fetch /api/*)
         Vercel Edge / Node Serverless
              │
              ├── POST /api/test     → runPerformanceTest() → MongoDB.save()
              └── GET  /api/history  → MongoDB.find()
              │
              ▼
         MongoDB Atlas (Mongoose)
```

Backend tamamen **stateless serverless**'tır; MongoDB bağlantısı `lib/db.js`
içinde **cached** olarak tutulur (warm lambda örnekleri arasında yeniden kullanılır).

---

## Yerel Kurulum

### 1. Bağımlılıkları yükle

```bash
npm install
cd client && npm install && cd ..
```

### 2. `.env` dosyası oluştur

`.env.example` dosyasını `.env` olarak kopyala ve değerleri doldur:

```bash
cp .env.example .env
```

| Değişken | Açıklama |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string (Atlas > Connect > Drivers). |
| `MAX_REQUESTS_PER_TEST` | Tek bir testteki maks. istek sayısı (DoS koruması). |
| `REQUEST_TIMEOUT_MS` | Tek bir HTTP isteğinin timeout süresi. |
| `CONCURRENCY` | Eşzamanlı atılan istek sayısı. |

### 3. Vercel dev sunucusunu çalıştır

```bash
npm install -g vercel
vercel dev
```

Bu komut hem `api/*.js` serverless fonksiyonlarını **hem de** `client/`
içindeki React uygulamasını ayağa kaldırır.

Alternatif olarak frontend'i izole çalıştırmak istersen:
```bash
cd client && npm run dev   # http://localhost:5173 (proxy → :3000)
```
ayrı bir terminalde:
```bash
vercel dev                 # http://localhost:3000 (api + build)
```

---

## Vercel'e Deploy

1. Repoyu GitHub'a push'la.
2. [vercel.com](https://vercel.com) → **New Project** → repoyu seç.
3. **Environment Variables** kısmına `.env`'deki değerleri ekle.
4. Deploy. Vercel `vercel.json`'ı algılayıp:
   - `client/` içini build edip statik servisler,
   - `api/*.js` dosyalarını Node serverless function olarak çalıştırır.

---

## Klasör Yapısı

```
WebAPIPerformansPlatformu/
├── api/                              # Vercel Serverless Functions
│   ├── test.js                       # POST /api/test
│   └── history.js                    # GET  /api/history
├── lib/
│   ├── db.js                         # Cached MongoDB bağlantısı
│   ├── runPerformanceTest.js         # Asenkron HTTP istek + metrik mantığı
│   └── models/
│       └── TestRun.js                # Mongoose şeması
├── client/                           # React (Vite + Tailwind + Recharts)
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── TestForm.jsx
│       │   ├── Loader.jsx
│       │   ├── Dashboard.jsx
│       │   └── HistoryList.jsx
│       └── services/api.js
├── .env.example
├── package.json                      # Root: backend bağımlılıkları + ESM
└── vercel.json
```

---

## API

### `POST /api/test`

**Request:**
```json
{
  "url": "https://api.example.com/items",
  "requestCount": 50,
  "method": "GET"
}
```

**Response (201):**
```json
{
  "id": "67…",
  "url": "https://api.example.com/items",
  "requestCount": 50,
  "averageLatency": 124.3,
  "minLatency": 87.0,
  "maxLatency": 412.5,
  "p95Latency": 318.7,
  "successCount": 50,
  "errorCount": 0,
  "successRate": 100.0,
  "totalDurationMs": 1750,
  "samples": [ /* ilk 50 isteğin detayı */ ],
  "createdAt": "2026-05-24T12:34:56.000Z"
}
```

### `GET /api/history?limit=20`

```json
{
  "items": [ /* TestRun dokümanları, yeni → eski */ ],
  "count": 20
}
```

---

## Notlar

- Vercel Hobby planında serverless fonksiyonların maks. süresi sınırlıdır
  (varsayılan 10 sn). `vercel.json` içinde `maxDuration: 60` ile genişlettim
  ama Pro plan gerektirebilir. Çok yüksek `requestCount` + yavaş hedef =
  timeout. `MAX_REQUESTS_PER_TEST` env değişkeniyle sınırla.
- `validateUrl()` sadece http/https'e izin verir — `file://` veya iç
  metadata IP'leri gibi yüzeyleri sıkılaştırmak istersen `lib/runPerformanceTest`
  öncesi DNS/IP allowlist mantığı eklenebilir.
- Şu an her testin ilk 50 isteği `samples` olarak DB'ye yazılır. Daha
  yüksek sayılarda grafiklemek için ya sample sayısını artır ya da
  Mongo Time-Series koleksiyonu kullan.
