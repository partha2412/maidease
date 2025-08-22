# Maid Service App – Full Stack (MERN)

A modern full-stack web application where customers can hire domestic helpers, rate and review them, and **bargain prices in real-time**.  
Inspired by MeeHelp, but with **live negotiation** and flexible pricing.

---

## Features
- **All service types:** Cleaning, Cooking, Babysitting, Elderly Care, Patient Care, and more.
- **Customer ↔ Helper Bargaining:** Negotiate scope and price before confirming a booking.
- **Ratings & Reviews:** Customers leave feedback, automatically updating helper ratings.
- **React + Tailwind Frontend:** Clean and responsive UI with modal bargaining interface.
- **Node.js + Express Backend:** REST API with in-memory store (easy to swap with MongoDB).
- **Booking Workflow:** Offers → Counter-offers → Accept → Confirmed booking.
- **JWT-ready Auth flow:** Demo token generation for register/login endpoints.

---

## Project Structure

maid-service-app/
├─ backend/ # Node.js + Express API
│ ├─ package.json
│ └─ server.js
└─ frontend/ # React + Tailwind (Vite)
├─ package.json
└─ src/
└─ App.jsx

---

## Backend Setup (Node.js + Express)
```bash
cd backend
npm install
npm run start      # or npm run dev (with nodemon)

Frontend Setup (React + Tailwind)

cd frontend
npm install
npm run dev        # starts Vite dev server at http://localhost:5173

