// frontend/src/App.jsx
// Single-file demo UI showing: services, listings, provider ratings, bargaining modal, and reviews

import { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:4000/api';
const DEMO_CUSTOMER_ID = 'u-cust-1'; // from backend seed

function Chip({ children }) {
  return <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs mr-2">{children}</span>;
}

function Card({ title, children, footer }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border">
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      <div className="space-y-3">{children}</div>
      {footer && <div className="pt-4 mt-4 border-t">{footer}</div>}
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div>{children}</div>
        <div className="text-right mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border">Close</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [services, setServices] = useState([]);
  const [listings, setListings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [offers, setOffers] = useState([]);

  const [activeListing, setActiveListing] = useState(null);
  const [scope, setScope] = useState('Deep clean 2BHK incl. 2 bathrooms');
  const [price, setPrice] = useState(1200);
  const [messages, setMessages] = useState([]);
  const [booking, setBooking] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    fetch(`${API}/services`).then(r=>r.json()).then(setServices);
    fetch(`${API}/providers`).then(r=>r.json()).then(setProviders);
    fetch(`${API}/listings`).then(r=>r.json()).then(setListings);
    fetch(`${API}/offers`).then(r=>r.json()).then(setOffers);
  }, []);

  const serviceById = useMemo(() => Object.fromEntries(services.map(s=>[s.id, s])), [services]);
  const providerById = useMemo(() => Object.fromEntries(providers.map(p=>[p.id, p])), [providers]);

  async function createOffer(l) {
    const res = await fetch(`${API}/offers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: l.id, customerId: DEMO_CUSTOMER_ID, scope, price: Number(price) })
    });
    const offer = await res.json();
    setOffers(o => [offer, ...o]);
    setMessages(offer.messages);
    setActiveListing(l);
  }

  async function sendCounter(offerId, who, text, newPrice) {
    const res = await fetch(`${API}/offers/${offerId}/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ by: who, text, price: typeof newPrice==='number' ? Number(newPrice) : undefined })
    });
    const updated = await res.json();
    setOffers(os => os.map(o => o.id === updated.id ? updated : o));
    setMessages(updated.messages);
  }

  async function acceptOffer(offerId) {
    const res = await fetch(`${API}/offers/${offerId}/accept`, { method: 'POST' });
    const data = await res.json();
    setOffers(os => os.map(o => o.id === data.offer.id ? data.offer : o));
    setBooking(data.booking);
  }

  async function submitReview(providerId) {
    if (!booking) return alert('No booking yet');
    const res = await fetch(`${API}/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, customerId: DEMO_CUSTOMER_ID, providerId, rating: Number(rating), text: reviewText })
    });
    await res.json();
    alert('Thanks for your review!');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="px-6 py-4 bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Maid Service App</h1>
          <div className="text-sm opacity-70">All services • Ratings & Reviews • Bargain pricing</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card title="Explore Services">
            <div className="flex flex-wrap gap-2">
              {services.map(s => <Chip key={s.id}>{s.name}</Chip>)}
            </div>
          </Card>

          <Card title="Listings (Helpers Advertising)">
            <div className="grid md:grid-cols-2 gap-4">
              {listings.map(l => {
                const s = serviceById[l.serviceId];
                const p = providerById[l.providerId];
                return (
                  <div key={l.id} className="p-4 border rounded-2xl bg-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-base">{l.title}</div>
                        <div className="text-sm opacity-70">{s?.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">₹{l.basePrice}</div>
                        <div className="text-xs opacity-70">base</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm opacity-80">{l.details}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm">Provider: <span className="font-medium">{p?.fullName}</span>
                        <span className="ml-2">⭐ {p?.ratingAvg} ({p?.ratingCount})</span>
                      </div>
                      <button onClick={() => setActiveListing(l)} className="px-3 py-2 rounded-xl border">Bargain</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Your Latest Offer & Booking">
            {offers.length === 0 && <div className="text-sm opacity-70">No offers yet. Start a bargain on a listing.</div>}
            {offers[0] && (
              <div>
                <div className="text-sm">Offer ID: <code>{offers[0].id}</code></div>
                <div className="text-sm">Status: <b className="uppercase">{offers[0].status}</b></div>
                <div className="text-sm">Current Price: ₹{offers[0].price}</div>
                <div className="mt-2 max-h-40 overflow-auto border rounded-lg p-2 bg-slate-50">
                  {offers[0].messages.map((m,i)=> (
                    <div key={i} className="text-sm"><b>{m.by}:</b> {m.text}</div>
                  ))}
                </div>
                {offers[0].status === 'open' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => sendCounter(offers[0].id, 'customer', 'How about ₹1000?', 1000)} className="px-3 py-2 rounded-xl border">Counter ₹1000</button>
                    <button onClick={() => acceptOffer(offers[0].id)} className="px-3 py-2 rounded-xl border">Accept</button>
                  </div>
                )}
              </div>
            )}

            {booking && (
              <div className="mt-4 p-3 rounded-xl border bg-green-50">
                <div className="font-medium">Booking Confirmed</div>
                <div className="text-sm">Booking ID: <code>{booking.id}</code></div>
                <div className="text-sm">Price: ₹{booking.price}</div>
              </div>
            )}
          </Card>

          <Card title="Write a Review">
            <div className="space-y-2">
              <label className="block text-sm">Rating (1–5)</label>
              <input type="number" min="1" max="5" value={rating} onChange={e=>setRating(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
              <label className="block text-sm">Review</label>
              <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} className="w-full border rounded-xl px-3 py-2" rows={3} placeholder="Share service quality, punctuality, behaviour…" />
              <button onClick={() => submitReview(listings[0]?.providerId)} className="px-3 py-2 rounded-xl border">Submit Review</button>
            </div>
          </Card>
        </div>
      </main>

      <Modal open={!!activeListing} onClose={() => setActiveListing(null)}>
        {activeListing && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Bargain with Provider</h3>
            <div className="text-sm mb-4 opacity-80">Listing: {activeListing.title} • Base ₹{activeListing.basePrice}</div>
            <div className="grid gap-3">
              <div>
                <label className="block text-sm mb-1">Scope</label>
                <input value={scope} onChange={e=>setScope(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm mb-1">Your Offer (₹)</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => createOffer(activeListing)} className="px-4 py-2 rounded-xl border">Send Offer</button>
                <button onClick={() => setActiveListing(null)} className="px-4 py-2 rounded-xl border">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
