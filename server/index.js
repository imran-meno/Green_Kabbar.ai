import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import http from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Server } from 'socket.io';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '.env') });

const { MONGO_URI, JWT_SECRET, GEMINI_API_KEY } = process.env;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

if (!MONGO_URI) throw new Error('MONGO_URI is required.');
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace_with_')) {
  throw new Error('JWT_SECRET must be set to a unique secret of at least 32 characters.');
}

const app = express();
const server = http.createServer(app);
const clientUrl = new URL(process.env.CLIENT_URL || 'http://localhost:5173').origin;
const io = new Server(server, { cors: { origin: clientUrl } });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter(_req, file, done) {
    if (!file.mimetype.startsWith('image/')) {
      done(Object.assign(new Error('Please upload an image.'), { status: 415 }));
      return;
    }
    done(null, true);
  },
});

app.use(cors({ origin: clientUrl }));
app.use(express.json({ limit: '32kb' }));

try {
  await mongoose.connect(MONGO_URI);
} catch (error) {
  console.error('Could not connect to MongoDB. Check MONGO_URI and confirm the database is running.');
  console.error(`${error.name}: ${error.code || 'connection failed'}`);
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
});
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  weightKg: { type: Number, required: true, min: 0.1 },
  ratePerKg: { type: Number, required: true },
  total: { type: Number, required: true },
  pickupDays: { type: Number, required: true, min: 1, max: 7 },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  status: { type: String, enum: ['scheduled', 'on_the_way', 'arrived'], default: 'scheduled' },
  collector: { name: String, phone: String },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
// Illustrative PKR/kg rates only; replace them with verified local market prices.
const RATES = { iron: 120, copper: 1800, aluminium: 550, plastic: 90, paper: 35, cardboard: 30, glass: 15, ewaste: 300 };
const COLLECTORS = [
  { name: 'Ali Raza', phone: '0300-1111111' },
  { name: 'Bilal Ahmed', phone: '0311-2222222' },
  { name: 'Usman Khan', phone: '0322-3333333' },
];

const isSupportedType = (type) => Object.prototype.hasOwnProperty.call(RATES, type);
const isValidPhone = (phone) => {
  if (typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};
const isSukkurLocation = (location) => {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= 27.5 && lat <= 27.9
    && lng >= 68.65 && lng <= 69.05;
};
const scrapTypes = Object.keys(RATES);
const createToken = (user) => jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Please log in.' });
    req.userId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ error: 'Please log in again.' });
  }
}

function publicUser(user) {
  const location = Number.isFinite(user.location?.lat) && Number.isFinite(user.location?.lng)
    ? { lat: user.location.lat, lng: user.location.lng }
    : null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    location,
    role: user.role || 'customer',
  };
}

const requireAdmin = asyncRoute(async (req, res, next) => {
  const user = await User.findById(req.userId).select('role');
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
});

app.post('/api/auth/register', asyncRoute(async (req, res) => {
  const { name, email, password, phone, address, location } = req.body || {};
  if (typeof name !== 'string' || !name.trim()
    || typeof email !== 'string' || !email.trim()
    || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number with 7 to 15 digits.' });
  }
  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'A street address is required.' });
  }
  if (!isSukkurLocation(location)) {
    return res.status(400).json({ error: 'Choose a pickup location within Sukkur on the map.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.findOne({ email: normalizedEmail })) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      address: address.trim(),
      location: { lat: Number(location.lat), lng: Number(location.lng) },
      password: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email already registered.' });
    throw error;
  }
}));

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const user = email && await User.findOne({ email });
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  res.json({ token: createToken(user), user: publicUser(user) });
}));

app.get('/api/auth/me', requireAuth, asyncRoute(async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'Please log in again.' });
  res.json({ user: publicUser(user) });
}));

app.get('/api/rates', (_req, res) => res.json(RATES));

app.get('/api/scrap/predictor-status', (_req, res) => {
  const provider = process.env.ML_URL ? 'custom' : GEMINI_API_KEY ? 'gemini' : 'demo';
  res.json({
    provider,
    model: provider === 'gemini' ? GEMINI_MODEL : undefined,
    requiresConsent: provider !== 'demo',
  });
});

app.post('/api/scrap/predict', requireAuth, upload.single('image'), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload an image to continue.' });
  if ((process.env.ML_URL || GEMINI_API_KEY) && req.body.consent !== 'true') {
    return res.status(400).json({ error: 'Consent is required before sending this image to an AI provider.' });
  }

  let type = 'iron';
  let confidence = 0.5;
  let source = 'demo';

  if (process.env.ML_URL) {
    const form = new FormData();
    form.append('image', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    const response = await fetch(process.env.ML_URL, { method: 'POST', body: form });
    if (!response.ok) return res.status(502).json({ error: 'The scrap identification service is unavailable.' });

    const prediction = await response.json();
    type = typeof prediction?.type === 'string' ? prediction.type.toLowerCase() : '';
    confidence = Number(prediction.confidence);
    source = 'model';

    if (!isSupportedType(type) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return res.status(502).json({ error: 'The scrap identification service returned an invalid result.' });
    }
  } else if (GEMINI_API_KEY) {
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Identify the dominant scrap material in this image. Choose exactly one type from ${scrapTypes.join(', ')}, or "other" if no supported material is clearly visible. Ignore the background. Do not estimate price or weight. Return a conservative confidence estimate from 0 to 1.`,
              },
              {
                inlineData: {
                  mimeType: req.file.mimetype,
                  data: req.file.buffer.toString('base64'),
                },
              },
            ],
          }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 100,
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'OBJECT',
              properties: {
                type: { type: 'STRING', enum: [...scrapTypes, 'other'] },
                confidence: { type: 'NUMBER' },
              },
              required: ['type', 'confidence'],
            },
          },
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (error) {
      const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError';
      return res.status(timedOut ? 504 : 502).json({
        error: timedOut ? 'The scrap prediction service timed out. Try again.' : 'The scrap prediction service is unavailable.',
      });
    }

    if (response.status === 429) {
      return res.status(429).json({ error: 'The free AI quota or rate limit was reached. Try again later.' });
    }
    if (!response.ok) {
      console.error('Gemini prediction request failed with status', response.status);
      return res.status(502).json({ error: 'Gemini could not process this image. Check the API key and model access.' });
    }

    let result;
    try {
      const payload = await response.json();
      const output = payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || '')
        .join('')
        .trim();
      result = JSON.parse(output);
    } catch {
      return res.status(502).json({ error: 'The prediction service returned an invalid result.' });
    }

    type = typeof result.type === 'string' ? result.type.toLowerCase() : '';
    confidence = Number(result.confidence);
    source = 'gemini';

    if (type === 'other' || !isSupportedType(type) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return res.status(422).json({ error: 'Could not identify a supported scrap type. Try one clear photo of a single material.' });
    }
  }

  res.json({ type, confidence, ratePerKg: RATES[type], source });
}));

app.post('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const { type, weightKg, phone, address, location } = req.body || {};
  const weight = Number(weightKg);
  if (!isSupportedType(type) || !Number.isFinite(weight) || weight < 0.1) {
    return res.status(400).json({ error: 'Choose a supported scrap type and enter a weight of at least 0.1 kg.' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number with 7 to 15 digits.' });
  }
  if (typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({ error: 'A street address is required.' });
  }
  if (!isSukkurLocation(location)) {
    return res.status(400).json({ error: 'Choose a pickup location within Sukkur on the map.' });
  }

  const pickupDays = weight > 100 ? 5 : weight > 30 ? 3 : 2;
  const collector = COLLECTORS[Math.floor(Math.random() * COLLECTORS.length)];
  const order = await Order.create({
    user: req.userId,
    type,
    weightKg: weight,
    ratePerKg: RATES[type],
    total: Math.round(weight * RATES[type]),
    pickupDays,
    phone: phone.trim(),
    address: address.trim(),
    location: { lat: Number(location.lat), lng: Number(location.lng) },
    collector,
  });
  res.status(201).json(order);
}));

app.get('/api/orders', requireAuth, asyncRoute(async (req, res) => {
  const orders = await Order.find({ user: req.userId }).sort('-createdAt');
  res.json(orders);
}));

app.get('/api/orders/:id', requireAuth, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Pickup not found.' });
  const order = await Order.findOne({ _id: req.params.id, user: req.userId });
  if (!order) return res.status(404).json({ error: 'Pickup not found.' });
  res.json(order);
}));

app.get('/api/admin/dashboard', requireAuth, requireAdmin, asyncRoute(async (_req, res) => {
  const [orders, users] = await Promise.all([
    Order.find().sort('-createdAt').populate('user', 'name email phone'),
    User.find().select('name email phone address createdAt role').sort('-createdAt'),
  ]);
  res.json({ orders, users: users.filter((user) => user.role !== 'admin') });
}));

app.patch('/api/admin/orders/:id', requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const { status } = req.body || {};
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Pickup not found.' });
  }
  if (!['scheduled', 'on_the_way', 'arrived'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid pickup status.' });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true },
  ).populate('user', 'name email phone');
  if (!order) return res.status(404).json({ error: 'Pickup not found.' });
  res.json(order);
}));

io.on('connection', (socket) => {
  let trackingTimer;

  socket.on('track', async ({ id, token } = {}) => {
    try {
      if (typeof id !== 'string' || typeof token !== 'string' || !mongoose.isValidObjectId(id)) return;
      const { id: userId } = jwt.verify(token, JWT_SECRET);
      const order = await Order.findOne({ _id: id, user: userId });
      if (!order || !socket.connected) return;

      clearInterval(trackingTimer);
      let progress = 0;
      trackingTimer = setInterval(() => {
        progress = Math.min(1, progress + 0.04);
        socket.emit('pos', {
          progress,
          eta: Math.ceil((1 - progress) * 25),
          collector: order.collector,
          status: progress >= 1 ? 'arrived' : 'on_the_way',
          simulated: true,
        });
        if (progress >= 1) {
          clearInterval(trackingTimer);
          Order.updateOne({ _id: id }, { status: 'arrived' }).exec().catch((error) => console.error('Could not update pickup status:', error));
        }
      }, 2000);
    } catch {
      socket.emit('tracking_error', { error: 'Pickup updates are unavailable. Please refresh and try again.' });
    }
  });

  socket.on('disconnect', () => clearInterval(trackingTimer));
});

app.use((error, _req, res, _next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image must be 8 MB or smaller.' });
  }
  if (error.status === 415) return res.status(415).json({ error: error.message });
  console.error('Request failed:', error);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = Number(process.env.PORT) || 5000;
server.listen(port, () => console.log(`Green Kabbar API listening on port ${port}`));
