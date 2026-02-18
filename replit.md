# CulturePass

## Overview
CulturePass is a mobile app for discovering and booking cultural events for Kerala/Malayalee communities in Australia. Built with Expo (React Native) + Express backend with PostgreSQL database.

## Recent Changes
- 2026-02-18: Full backend infrastructure with PostgreSQL database, Drizzle ORM, REST API, session auth, and all screens connected to live data
- 2026-02-17: Initial MVP build with event discovery, calendar, community directory, business listings, artist profiles, perks, and user profile

## Architecture
- **Frontend**: Expo Router (file-based routing) with React Native
- **Backend**: Express server on port 5000
- **Database**: PostgreSQL with Drizzle ORM (`shared/schema.ts` for schema, `server/storage.ts` for queries)
- **Auth**: Session-based auth with connect-pg-simple for PostgreSQL session storage
- **Data Fetching**: React Query (`@tanstack/react-query`) with default queryFn in `lib/query-client.ts`
- **Fonts**: Poppins (Google Fonts)
- **Colors**: Warm coral/terracotta primary (#E2725B), deep teal secondary (#1A535C), gold accent (#D4A017)

## Database Schema (shared/schema.ts)
- users, events, organisations, businesses, artists, perks, orders, memberships
- CPID system for unique entity identification (e.g., CP-EVT-001, CP-ORG-001)

## API Routes (server/routes.ts)
- Auth: POST /api/auth/register, /api/auth/login, /api/auth/logout; GET /api/auth/me
- Events: GET /api/events, /api/events/featured, /api/events/trending, /api/events/dates, /api/events/by-date/:date, /api/events/:id; POST/PUT/DELETE /api/events/:id
- Organisations: GET /api/organisations, /api/organisations/:id; POST/PUT
- Businesses: GET /api/businesses, /api/businesses/:id; POST/PUT
- Artists: GET /api/artists, /api/artists/featured, /api/artists/:id; POST/PUT
- Perks: GET /api/perks, /api/perks/:id; POST
- Orders: GET/POST /api/orders
- Memberships: GET/POST /api/memberships
- Users: POST /api/users/save-event; PUT /api/users/profile
- CPID lookup: GET /api/cpid/:cpid

## Tab Structure
- Discover (index) - Featured/trending events, search, categories
- Calendar - Month view with event dates
- Community - Organisations, businesses, artists tabs
- Perks - Member discount codes
- Profile - Saved events, settings

## Detail Screens
- /event/[id] - Full event details with booking
- /community/[id] - Organisation detail
- /artist/[id] - Artist profile
- /business/[id] - Business detail
- /allevents - All events list with category filter

## Key Libraries
- @expo-google-fonts/poppins for typography
- expo-image for optimized images
- expo-linear-gradient for gradients
- expo-haptics for touch feedback
- @react-native-async-storage/async-storage for local persistence
- @tanstack/react-query for server state
- drizzle-orm + drizzle-kit for database
- connect-pg-simple for session storage

## Notes
- Saved events still use local AsyncStorage (not yet migrated to API endpoint)
- Query keys use array format: ['/api/resource', id] which joins to /api/resource/id via default queryFn
