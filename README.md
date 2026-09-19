# Twendex Passenger

Mobile-first PWA frontend for booking Entebbe–Namboole/Kampala public-transport trips. It is frontend-only: typed sample data is ready to be swapped for PHP/MySQL endpoints.

## Run
`npm install` then `npm run dev`. Use `npm run build` for a production bundle.

## Route map
`/` search · `/trips` results · `/trips/:tripId` detail · `/book/:tripId/seats` seat hold · `/checkout` payment details · `/payment/:bookingId` payment state · `/tickets/:bookingId` ticket · `/my-trips` bookings · `/safety/:bookingId` support tools.

## Future API
Sample trips, seats, drivers and bookings currently live in `src/main.tsx`; the `src/storage.ts` ticket repository demonstrates the offline boundary. The backend should offer search/detail, seat hold/create/refresh/release (with `409` conflicts), booking, payment initiation/status, ticket retrieval, booking list, plus share/SOS/incident actions. Tickets must include a server-generated `ticketSignature` QR payload—the frontend never signs it. IndexedDB persists tickets and the PWA worker caches app assets.
