// backend/server.js
// Minimal demo backend for Maid Service App
// Features: services, providers, listings, bargaining offers, bookings, ratings & reviews

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuid } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- In-memory demo DB (replace with MongoDB/Postgres in prod) ---
const db = {
  users: [
    // Seed two demo users: a customer and a helper
    { id: 'u-cust-1', role: 'customer', name: 'Rahul Customer', phone: '9000000001' },
    { id: 'u-help-1', role: 'helper', name: 'Asha Helper',   phone: '9000000002' }
  ],
  services: [
    { id: 'svc-clean', name: 'House Cleaning', categories: ['Home'] },
    { id: 'svc-cook',  name: 'Cooking',         categories: ['Home'] },
    { id: 'svc-baby',  name: 'Babysitting',     categories: ['Care'] },
    { id: 'svc-elder', name: 'Elderly Care',    categories: ['Care'] },
    { id: 'svc-patient', name: 'Patient Care',  categories: ['Care'] }
  ],
  providers: [
    {
      id: 'p-1', userId: 'u-help-1', fullName: 'Asha Devi',
      skills: ['House Cleaning', 'Cooking'],
      locations: ['Bengaluru', 'Whitefield'],
      baseRate: 350, // per hour baseline
      ratingAvg: 4.7, ratingCount: 12
    }
  ],
  listings: [
    // what helpers advertise (service + base offer)
    { id: 'l-1', providerId: 'p-1', serviceId: 'svc-clean', title: 'Deep Cleaning (2BHK)', basePrice: 1500, details: 'All rooms, bathrooms, kitchen. Supplies included.' }
  ],
  offers: [
    // Bargaining/negotiation threads (status: open | accepted | declined)
    // { id, listingId, customerId, providerId, scope, price, status, messages: [{by, text, at}] }
  ],
  bookings: [
    // Confirmed jobs after accepted offer
    // { id, listingId, offerId, customerId, providerId, date, price, status }
  ],
  reviews: [
    // { id, bookingId, customerId, providerId, rating (1-5), text }
  ]
};

// --- Utilities ---
function getProvider(providerId) { return db.providers.find(p => p.id === providerId); }
function getListing(listingId) { return db.listings.find(l => l.id === listingId); }
function recalcProviderRating(providerId) {
  const revs = db.reviews.filter(r => r.providerId === providerId);
  if (!revs.length) return;
  const avg = revs.reduce((s, r) => s + r.rating, 0) / revs.length;
  const prov = getProvider(providerId);
  if (prov) { prov.ratingAvg = Number(avg.toFixed(2)); prov.ratingCount = revs.length; }
}

// --- Auth (super-simple demo; replace with JWT) ---
app.post('/api/auth/register', (req, res) => {
  const { name, phone, role } = req.body;
  if (!name || !phone || !role) return res.status(400).json({ error: 'name, phone, role required' });
  const user = { id: uuid(), name, phone, role };
  db.users.push(user);
  res.json({ user, token: 'demo-token-' + user.id });
});

app.post('/api/auth/login', (req, res) => {
  const { phone } = req.body;
  const user = db.users.find(u => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user, token: 'demo-token-' + user.id });
});

// --- Services ---
app.get('/api/services', (req, res) => res.json(db.services));

// --- Providers & Listings ---
app.get('/api/providers', (req, res) => res.json(db.providers));
app.get('/api/listings', (req, res) => res.json(db.listings));

// Create a listing (helper only)
app.post('/api/listings', (req, res) => {
  const { providerId, serviceId, title, basePrice, details } = req.body;
  if (!providerId || !serviceId || !title || !basePrice) return res.status(400).json({ error: 'Missing fields' });
  const listing = { id: uuid(), providerId, serviceId, title, basePrice, details: details || '' };
  db.listings.push(listing);
  res.json(listing);
});

// --- Bargaining / Offers ---
// Create an offer (customer proposes scope & price to provider for a listing)
app.post('/api/offers', (req, res) => {
  const { listingId, customerId, scope, price } = req.body;
  const listing = getListing(listingId);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (!customerId || !scope || typeof price !== 'number') return res.status(400).json({ error: 'Missing scope/price/customerId' });
  const offer = {
    id: uuid(), listingId, customerId, providerId: listing.providerId,
    scope, price, status: 'open', messages: [ { by: 'customer', text: `Proposed: ₹${price} — ${scope}`, at: Date.now() } ]
  };
  db.offers.push(offer);
  res.json(offer);
});

// Counter on an offer (either party)
app.post('/api/offers/:id/message', (req, res) => {
  const offer = db.offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'open') return res.status(400).json({ error: 'Offer closed' });
  const { by, text, price } = req.body;
  if (!by || !text) return res.status(400).json({ error: 'by, text required' });
  offer.messages.push({ by, text, at: Date.now() });
  if (typeof price === 'number') offer.price = price; // optional counter-price
  res.json(offer);
});

// Accept or decline
app.post('/api/offers/:id/accept', (req, res) => {
  const offer = db.offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'open') return res.status(400).json({ error: 'Offer closed' });
  offer.status = 'accepted';
  const booking = {
    id: uuid(), listingId: offer.listingId, offerId: offer.id,
    customerId: offer.customerId, providerId: offer.providerId,
    date: new Date().toISOString(), price: offer.price, status: 'confirmed'
  };
  db.bookings.push(booking);
  res.json({ offer, booking });
});

app.post('/api/offers/:id/decline', (req, res) => {
  const offer = db.offers.find(o => o.id === req.params.id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  offer.status = 'declined';
  res.json(offer);
});

app.get('/api/offers', (req, res) => res.json(db.offers));

// --- Bookings ---
app.get('/api/bookings', (req, res) => res.json(db.bookings));

// --- Reviews ---
app.post('/api/reviews', (req, res) => {
  const { bookingId, customerId, providerId, rating, text } = req.body;
  if (!bookingId || !customerId || !providerId || !rating) return res.status(400).json({ error: 'Missing fields' });
  if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating 1-5' });
  const review = { id: uuid(), bookingId, customerId, providerId, rating, text: text || '' };
  db.reviews.push(review);
  recalcProviderRating(providerId);
  res.json(review);
});

app.get('/api/reviews/:providerId', (req, res) => {
  res.json(db.reviews.filter(r => r.providerId === req.params.providerId));
});

// --- Start server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
