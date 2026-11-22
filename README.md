# Green Kabbar

Green Kabbar helps customers get a scrap estimate and arrange a doorstep pickup. The project includes a React/Vite client and an Express/MongoDB API.

## Run locally

You need Node.js 20 or newer and a running MongoDB instance.

1. In PowerShell, configure and start the API:

   ```powershell
   cd server
   Copy-Item .env.example .env
   # Edit .env: set MONGO_URI to your private MongoDB Atlas connection URI.
   # Set JWT_SECRET to a unique random value of at least 32 characters.
   npm install
   npm run dev
   ```

   In Atlas, ensure your database user is active and your current IP is allowed in Network Access. Keep the URI only in `server/.env`; do not commit it or paste it into chat. If a URI password contains special characters, URL-encode them.

   To grant administrator access, first register and log in with the intended account, then set that user's `role` to `admin` in the `users` collection. For example, in `mongosh` connected to the app database, run `db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })`. New accounts are always created as customers. Log out and back in after changing the role.

2. In a second terminal, start the client:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

3. Open the Vite URL shown in the client terminal (usually `http://localhost:5173`).

## Deployment

The client and API can be deployed on separate origins. Configure these environment
variables in the hosting providers; do not commit real `.env` files:

- **API host:** set `MONGO_URI` and a unique `JWT_SECRET` of at least 32 characters.
  Set `CLIENT_URL` to the exact public client origin (for example,
  `https://your-client.example.com`, without a trailing slash). Set `PORT` only if
  your API host requires it. Configure `GEMINI_API_KEY` or `ML_URL` if you want
  real scrap identification.
- **Client host:** set `VITE_API_URL` to the API's public origin (for example,
  `https://your-api.example.com`, without a trailing slash), then build the client
  with `npm run build` from `client`. Vite embeds this value at build time.
- Allow the client origin in the API's CORS settings. The API origin must support
  both `/api` requests and Socket.IO connections at `/socket.io`.

For local development, leave `VITE_API_URL` unset so Vite uses the proxy in
`client/vite.config.js`; set `CLIENT_URL=http://localhost:5173` in `server/.env`.

## Scrap prediction and rates

- The project can use Google's Gemini 3.5 Flash-Lite image API. Create a Gemini API key in [Google AI Studio](https://aistudio.google.com/apikey), then add `GEMINI_API_KEY=your_key` to `server/.env`. Keep this key on the server; never put it in React code or commit it.
- The Gemini API currently lists free-tier input/output for this model, with account-specific quotas and availability that can change. Google states that free-tier content may be used to improve its products and may be reviewed by people. The estimate page discloses this and requires customer consent before sending a photo. See [Gemini pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite) and [Gemini terms](https://aistudio.google.com/docs/terms).
- Gemini is a general vision model, not a scrap-trained classifier. It returns a supported material type; the app maps that type to its local rate table. Model confidence is only an estimate, so verify material and quality before paying.
- Alternatively, set `ML_URL` to your own trained model endpoint. It takes precedence over Gemini and must accept multipart `image` input and return `{"type":"copper","confidence":0.93}`.
- With neither provider configured, the API returns a clearly labelled **demo placeholder** (`iron`, 50% confidence); it does not analyze the photo.
- Rates in `server/index.js` are illustrative PKR/kg values. Replace them with verified local market rates before accepting real orders.

## Pickup integrations

- New accounts must provide a contact phone number, a street address, and choose a pickup pin within the Sukkur service area. Pickup bookings require the same details. The map uses OpenStreetMap tiles and includes attribution.
- Pickup location updates are currently simulated by the API. Real GPS tracking requires a collector app/device to send authenticated location updates.
- Payments are not processed by the app yet. Confirm the final weight and payout at collection, or integrate a supported payment provider before enabling online payouts.
