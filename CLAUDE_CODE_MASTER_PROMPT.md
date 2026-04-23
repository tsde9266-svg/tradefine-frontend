# TRADEFIND — MASTER CLAUDE CODE PROMPT
# ============================================================
# This is the single prompt you give Claude Code to build the
# entire TradeFind app from scratch. Read every word before
# starting. This prompt IS the specification.
# ============================================================

---

## YOUR IDENTITY FOR THIS PROJECT

You are a senior full-stack engineer building TradeFind — a production-grade, UK-based mobile app that connects customers with local construction workers/tradespeople. Think Checkatrade meets Uber. This is a real product that real people will use. Build it like a professional, not a tutorial demo.

**Before writing a single line of code, read this entire prompt.**
**Never deviate from the architecture, stack, or design decisions below.**
**Every decision in here has been researched. Do not substitute alternatives unless explicitly told to.**

---

## PART 1 — PROJECT OVERVIEW

**App Name:** TradeFind
**Tagline:** Find a trusted tradesperson near you — instantly
**Platforms:** Android + iOS (single React Native codebase)
**No in-app payments.** All money/quotes handled outside the app. Customers call workers directly.

**Three user types:**
1. **Customer** — searches for, finds, calls, tracks and reviews tradespeople
2. **Worker (Tradesperson)** — registers, sets availability, gets found, manages profile/reviews
3. **Admin** — approves accounts, moderates reviews, monitors activity (web panel)

---

## PART 2 — DEFINITIVE TECH STACK

Do not use anything not listed here without asking first.

### Mobile App
```
Framework:        React Native + Expo SDK 51+
Navigation:       Expo Router v3 (file-based, like Next.js)
State:            Zustand (NOT Redux, NOT Context API)
Maps:             react-native-maps with Google Maps provider
Location:         expo-location (foreground + background)
Real-time:        socket.io-client v4
Push notifs:      expo-notifications + Firebase FCM
Images (remote):  expo-image (NOT React Native's built-in Image)
Image picker:     expo-image-picker
HTTP client:      axios with interceptors
Forms:            react-hook-form + zod validation
Storage (local):  expo-secure-store (tokens), @react-native-async-storage (prefs)
Slider:           @react-native-community/slider
Icons:            Custom PNG icons from assets/ (do NOT use vector icon libraries)
```

### Backend — TWO SEPARATE SERVICES

**Service 1: Main REST API**
```
Runtime:     Node.js 20 LTS
Framework:   Fastify v4 (NOT Express — Fastify is 2x faster)
Language:    TypeScript (strict mode)
ORM:         Prisma v5 with PostgreSQL
Auth:        JWT (access token 15min + refresh token 30 days) + bcrypt
Validation:  Zod schemas shared between API and mobile
File upload: Multipart → Cloudflare R2 (presigned URLs)
Email:       Resend.com SDK
Docs:        Swagger via @fastify/swagger
```

**Service 2: Location & Real-time Service**
```
Language:    Go 1.22+
Framework:   Gorilla WebSocket (NOT Socket.io server — Go side uses raw WS)
Geo-search:  Redis GEORADIUS / GEOSEARCH commands
Cache:       Redis 7 (in-memory, location data + sessions)
```

### Database & Infrastructure
```
Primary DB:    PostgreSQL 16 + PostGIS extension
Cache/Geo:     Redis 7 (Upstash for managed, or self-hosted)
File storage:  Cloudflare R2 (zero egress fees — NOT AWS S3)
CDN:           Cloudflare (free tier)
Push notifs:   Firebase Cloud Messaging (free)
Monitoring:    Sentry (free tier, errors) + UptimeRobot (free, uptime)
Containers:    Docker + Docker Compose (local dev)
CI/CD:         GitHub Actions
Mobile builds: Expo EAS Build
```

### Admin Panel (separate web app)
```
Framework:  React + Vite + TypeScript
Styling:    TailwindCSS
Tables:     TanStack Table v8
Charts:     Recharts
HTTP:       Axios (same interceptor pattern as mobile)
```

---

## PART 3 — DESIGN SYSTEM (MANDATORY — NEVER DEVIATE)

### Colour Tokens — copy these EXACTLY into constants/colors.ts
```typescript
export const colors = {
  // Brand
  primary:          '#F97316',  // orange — buttons, active states, CTAs
  primaryDark:      '#C2410C',  // pressed states, hover
  primaryLight:     '#FED7AA',  // tinted backgrounds, subtle highlights

  // Backgrounds
  background:       '#F9FAFB',  // screen background
  surface:          '#FFFFFF',  // cards, modals, bottom sheets
  surfaceElevated:  '#F3F4F6',  // elevated cards, input backgrounds

  // Text
  textPrimary:      '#111827',  // headings, primary content
  textSecondary:    '#6B7280',  // supporting text, captions
  textDisabled:     '#9CA3AF',  // disabled labels
  textInverse:      '#FFFFFF',  // text on dark/coloured backgrounds

  // Status
  success:          '#16A34A',  // available, confirmed, online
  successBg:        '#DCFCE7',  // available badge background
  error:            '#DC2626',  // errors, blocked accounts
  errorBg:          '#FEE2E2',  // error backgrounds
  warning:          '#D97706',  // pending approval, warnings
  warningBg:        '#FEF3C7',  // warning backgrounds

  // Specific
  star:             '#FBBF24',  // ratings, starred items
  available:        '#22C55E',  // worker available dot/badge
  unavailable:      '#9CA3AF',  // worker offline dot/badge
  mapPin:           '#F97316',  // map markers

  // Borders & dividers
  border:           '#E5E7EB',
  borderLight:      '#F3F4F6',

  // Overlay
  overlay:          'rgba(0,0,0,0.5)',
  overlayLight:     'rgba(0,0,0,0.25)',
} as const;
```

### Spacing — copy into constants/spacing.ts
```typescript
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
} as const;
```

### Border Radius — copy into constants/radius.ts
```typescript
export const radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
} as const;
```

### Typography — copy into constants/typography.ts
```typescript
import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  h1:      { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2:      { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
  h3:      { fontSize: 18, fontWeight: '600' },
  h4:      { fontSize: 16, fontWeight: '600' },
  body:    { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyMd:  { fontSize: 15, fontWeight: '500' },
  small:   { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '500' },
  label:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
};
```

### Shadows — copy into constants/shadows.ts
```typescript
import { ViewStyle } from 'react-native';

export const shadows: Record<string, ViewStyle> = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
};
```

---

## PART 4 — COMPLETE FOLDER STRUCTURE

Build exactly this structure. Do not rename or reorganise.

```
tradefind/
│
├── app/                              ← Expo Router screens
│   ├── _layout.tsx                   ← Root layout: fonts, auth guard, safe area
│   ├── index.tsx                     ← Redirect to /auth/welcome or home based on auth
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx               ← Auth stack layout (no tab bar)
│   │   ├── welcome.tsx               ← Screen 1: Splash / role selection
│   │   ├── register.tsx              ← Screen 2: Sign Up / Log In tabs
│   │   └── location-permission.tsx   ← Screen 3: Location permission request
│   │
│   ├── (customer)/
│   │   ├── _layout.tsx               ← Customer bottom tab navigator
│   │   ├── index.tsx                 ← Screen 4: Home / Discovery
│   │   ├── map.tsx                   ← Screen 5: Full Map View
│   │   ├── search.tsx                ← Screen 8: Search Results
│   │   ├── saved.tsx                 ← Screen 10: Saved / Bookmarked Workers
│   │   ├── profile.tsx               ← Screen 11: Customer Profile & Settings
│   │   └── worker/
│   │       ├── [id].tsx              ← Screen 6: Worker Public Profile
│   │       ├── tracking.tsx          ← Screen 7: Live Worker Tracking Map
│   │       └── review.tsx            ← Screen 9: Leave Review for Worker
│   │
│   └── (worker)/
│       ├── _layout.tsx               ← Worker bottom tab navigator
│       ├── index.tsx                 ← Screen 12/13: Worker Dashboard + Toggle
│       ├── edit-profile.tsx          ← Screen 14: Edit Worker Profile
│       ├── reviews.tsx               ← Screen 15: My Reviews & Ratings
│       ├── review-customer.tsx       ← Screen 16: Review a Customer
│       ├── notifications.tsx         ← Screen 17: Notifications
│       └── preview.tsx               ← Screen 18: Preview Public Profile
│
├── components/
│   ├── ui/                           ← Dumb, reusable, no business logic
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Avatar.tsx
│   │   ├── StarRating.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── EmptyState.tsx
│   │   └── Toast.tsx
│   │
│   ├── worker/                       ← Worker-specific components
│   │   ├── WorkerCard.tsx            ← Horizontal scroll card (200px wide)
│   │   ├── WorkerCardLarge.tsx       ← Full-width list card
│   │   ├── AvailabilityToggle.tsx    ← The big Start/Stop toggle card
│   │   └── ReviewCard.tsx
│   │
│   ├── map/
│   │   ├── WorkerMapPin.tsx          ← Custom orange map marker
│   │   ├── TrackingPulse.tsx         ← Animated pulse for live location
│   │   └── MapBottomSheet.tsx        ← Sliding sheet over map
│   │
│   └── layout/
│       ├── ScreenHeader.tsx
│       ├── TabBar.tsx                ← Custom bottom tab bar
│       └── KeyboardView.tsx          ← KeyboardAvoidingView wrapper
│
├── stores/                           ← Zustand stores
│   ├── authStore.ts                  ← user, token, role, login/logout
│   ├── locationStore.ts              ← currentLocation, permission status
│   ├── workerStore.ts                ← nearbyWorkers, filters, selected worker
│   ├── trackingStore.ts              ← active tracking session, worker position
│   └── notificationStore.ts         ← notifications, unread count
│
├── services/                         ← All external communication
│   ├── api.ts                        ← Axios instance, interceptors, token refresh
│   ├── auth.ts                       ← login, register, refreshToken, logout
│   ├── workers.ts                    ← nearby, getById, updateProfile, toggleAvailability
│   ├── reviews.ts                    ← create, getByWorker, reply
│   ├── notifications.ts              ← getAll, markRead
│   ├── upload.ts                     ← getPresignedUrl, uploadToR2
│   └── socket.ts                     ← Socket.io singleton, connect/disconnect
│
├── hooks/
│   ├── useLocation.ts                ← Expo location with permission handling
│   ├── useNearbyWorkers.ts           ← Fetches + refreshes nearby workers
│   ├── useWorkerTracking.ts          ← Manages live tracking WebSocket session
│   ├── useAuth.ts                    ← Reads authStore, exposes helpers
│   └── useNotifications.ts          ← Push notification registration + handling
│
├── utils/
│   ├── formatters.ts                 ← formatDistance, formatDate, formatRating
│   ├── validators.ts                 ← Zod schemas (reused from backend)
│   └── storage.ts                    ← SecureStore wrappers for tokens
│
├── constants/
│   ├── colors.ts                     ← Full palette (see Part 3)
│   ├── typography.ts                 ← Type scale
│   ├── spacing.ts                    ← Spacing scale
│   ├── radius.ts                     ← Border radius scale
│   ├── shadows.ts                    ← Shadow presets
│   ├── trades.ts                     ← All trade categories
│   └── config.ts                     ← API_URL, SOCKET_URL, env vars
│
├── types/
│   ├── user.ts
│   ├── worker.ts
│   ├── review.ts
│   ├── notification.ts
│   └── api.ts                        ← API response wrapper types
│
└── assets/
    ├── icons/                        ← Custom PNG icons from Stitch
    ├── illustrations/                ← Onboarding + empty state illustrations
    ├── images/                       ← Placeholder images
    └── screens/                      ← Stitch design exports for reference
```

---

## PART 5 — DATA MODELS (TypeScript)

```typescript
// types/user.ts
export interface User {
  id: string;
  role: 'customer' | 'worker' | 'admin';
  name: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  createdAt: string;
}

// types/worker.ts
export interface Worker {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  trades: string[];           // ['Plumber', 'Gas Engineer']
  bio: string;
  pricingNotes: string;
  certifications: string[];   // ['Gas Safe Registered', 'City & Guilds']
  serviceAreaMiles: number;
  portfolioPhotos: string[];  // Cloudflare R2 URLs
  isAvailable: boolean;
  latitude: number | null;    // null when unavailable (NEVER store when offline)
  longitude: number | null;
  rating: number;             // 4.9 (average, calculated field)
  reviewCount: number;
  distance?: number;          // metres, returned from geo-search
  status: 'pending' | 'approved' | 'blocked';
  phone: string;              // shown to customers, used for direct call
}

// types/review.ts
export interface Review {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  toWorkerId: string;
  rating: number;             // 1–5 integer
  text: string;
  photos: string[];           // R2 URLs
  reply: string | null;       // worker's reply
  createdAt: string;
}

// types/notification.ts
export interface Notification {
  id: string;
  userId: string;
  type: 'new_review' | 'account_approved' | 'profile_saved' | 'call_received';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}
```

---

## PART 6 — ALL API ENDPOINTS

Build the Fastify API with these exact endpoints:

```
Auth
POST   /api/auth/register           { name, email, phone, password, role }
POST   /api/auth/login               { email, password }
POST   /api/auth/refresh             { refreshToken }
POST   /api/auth/logout              { refreshToken }
GET    /api/auth/me                  → current user

Workers
GET    /api/workers/nearby           ?lat&lng&radiusKm&trade&availableOnly
GET    /api/workers/:id              → full worker profile
PATCH  /api/workers/profile          → update own profile (worker only)
PATCH  /api/workers/availability     { available: bool, lat?, lng? }
GET    /api/workers/saved            → customer's saved workers
POST   /api/workers/:id/save         → save worker
DELETE /api/workers/:id/save         → unsave worker

Reviews
GET    /api/reviews/worker/:id       → reviews for a worker
GET    /api/reviews/customer/:id     → reviews for a customer  
POST   /api/reviews                  { toId, toType, rating, text, photos[] }
POST   /api/reviews/:id/reply        { reply } (worker only)
POST   /api/reviews/:id/report       { reason }

Notifications
GET    /api/notifications            → user's notifications
PATCH  /api/notifications/read-all   → mark all as read
PATCH  /api/notifications/:id/read   → mark one as read

Upload
POST   /api/upload/presign           { filename, contentType } → presigned R2 URL

Admin (all require admin JWT)
GET    /api/admin/stats              → dashboard numbers
GET    /api/admin/workers            ?status&search&page
PATCH  /api/admin/workers/:id        { status: 'approved'|'blocked' }
GET    /api/admin/reviews/flagged    → reported reviews
PATCH  /api/admin/reviews/:id        { action: 'approve'|'remove' }
GET    /api/admin/customers          ?search&page
```

---

## PART 7 — LOCATION ARCHITECTURE (READ CAREFULLY)

This is the most important technical section. Do not skip it.

### The Three Location Problems & Solutions

**Problem 1 — "Find workers near me" (geo-search)**
```
When: Customer opens app or searches
Solution: Redis GEORADIUS
Flow:
  Worker goes Available → API: GEOADD workers_available <lng> <lat> <workerId>
  Worker goes Offline   → API: ZREM workers_available <workerId>
  Customer searches     → API: GEORADIUS workers_available <lng> <lat> 10 km ASC
  Result: Worker IDs sorted by distance, returned in <50ms
```

**Problem 2 — "Track this specific worker coming to me" (live tracking)**
```
When: Customer is actively watching a worker approach
Solution: WebSocket via Socket.io
Flow:
  Customer opens tracking screen → socket.emit('track:start', { workerId })
  Server joins customer to room: `tracking:${workerId}`
  Worker's app (if available) emits location every 10 seconds:
    socket.emit('location:update', { lat, lng })
  Server broadcasts to room:
    socket.to(`tracking:${workerId}`).emit('worker:moved', { lat, lng })
  Customer goes back → socket.emit('track:stop', { workerId })
Key rule: Worker ONLY emits location if isAvailable === true in their Zustand store
Key rule: Stop ALL location emission immediately when worker taps "Go Offline"
```

**Problem 3 — Location history (audit/GDPR)**
```
When: Background logging for safety/disputes
Solution: PostgreSQL + PostGIS (separate table, not Redis)
Only store: workerId, timestamp, point geometry
Retention: 30 days max (GDPR compliance)
```

### Redis Key Design
```
workers_available  → ZSET containing all currently available workers
                     Score = GeoHash, Member = workerId

worker:session:{userId}   → Hash: { workerId, lastSeen }
                            TTL: 2 hours (auto-expire if worker doesn't update)
```

### Worker Location Update Frequency
```
Worker is available + app foreground:  every 30 seconds
Worker is available + app background:  every 60 seconds (battery saving)
Worker goes offline:                   immediately remove from Redis
```

---

## PART 8 — COMPONENT SPECIFICATIONS

Build each component exactly to this spec:

### Button.tsx
```typescript
// Props
interface ButtonProps {
  variant: 'primary' | 'outline' | 'ghost' | 'danger';
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;    // left icon
  iconRight?: React.ReactNode; // right icon
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg'; // default: 'md'
}

// Sizes: sm=10px padding, md=14px padding, lg=18px padding
// primary: bg=primary, text=white, radius=10
// outline: border=2px primary, text=primary, bg=transparent
// ghost:   no border, text=primary, bg=transparent
// danger:  bg=error, text=white
// loading: show ActivityIndicator, disable press, reduce opacity to 0.7
```

### Badge.tsx
```typescript
// All badges: borderRadius=full, paddingH=10, paddingV=4, fontSize=12, fontWeight=600
type BadgeType = 'available' | 'unavailable' | 'pending' | 'verified' | 'top-rated';

// available:   bg=successBg,  text=success,  label="Available Now"
// unavailable: bg=#F3F4F6,    text=disabled, label="Not Available"
// pending:     bg=warningBg,  text=warning,  label="Pending Approval"
// verified:    bg=primaryLight,text=primaryDark, label="✓ Verified"
// top-rated:   bg=#FEF9C3,   text=#CA8A04,  label="★ Top Rated"
```

### WorkerCard.tsx (horizontal, for "Available Now" scroll)
```typescript
// Fixed width: 200px, borderRadius=14, shadow=md
// Image: full width, height=120, resizeMode=cover (expo-image)
// Body padding: 12px
// Name: h4 style, textPrimary
// Trade: small style, textSecondary (first trade only, + "& more" if multiple)
// Row: StarRating (sm) + distance text
// Bottom: Badge component
// Press → navigate to /customer/worker/[id]
```

### WorkerCardLarge.tsx (full width, for lists)
```typescript
// Full width, borderRadius=14, shadow=sm, horizontal layout
// Left: Avatar (60px circle) with online/offline dot overlay
// Right: Name (h4), Trade (small), Rating row, Distance, Badge
// Far right: Quick "Call" button (ghost variant, phone icon)
// Press on card → navigate to profile
// Press on Call → Linking.openURL('tel:' + worker.phone)
```

### AvailabilityToggle.tsx
```typescript
// Full width card, borderRadius=16, padding=20
// OFF state:
//   Background: surfaceElevated (#F3F4F6)
//   Icon: grey toggle icon
//   Title: "You're currently invisible" (h3, textPrimary)
//   Subtitle: "Customers cannot find you right now" (small, textSecondary)
//   Button: "Go Available" (primary variant, full width)
//
// ON state:
//   Background: successBg (#DCFCE7)
//   Animated pulsing green dot (Animated.loop with Animated.sequence)
//   Title: "You're LIVE" (h3, success colour)
//   Subtitle: "X customers can see you nearby" (small, success)
//   Mini map preview showing worker's current pin (optional, nice to have)
//   Button: "Go Offline" (outline variant, full width)
//
// On toggle ON:
//   1. Check location permission → request if not granted
//   2. Get current location
//   3. PATCH /api/workers/availability { available: true, lat, lng }
//   4. Start socket.io location emission interval
//   5. Update Zustand store
//
// On toggle OFF:
//   1. IMMEDIATELY stop location emission (clearInterval)
//   2. PATCH /api/workers/availability { available: false }
//   3. socket.emit('worker:offline')
//   4. Update Zustand store
//   5. Clear location from Redis (handled server-side)
```

### StarRating.tsx
```typescript
// Props: value (0-5), interactive?: boolean, size?: 'sm'|'md'|'lg', onChange?: (n)=>void
// Filled star colour: star (#FBBF24)
// Empty star: border/stroke style in #E5E7EB
// sm: 14px stars, md: 20px stars, lg: 28px stars
// Interactive: tap to select, scale animation on press (Animated)
// Display-only: no touch feedback, just renders filled/empty state
// Support half-star display (e.g. 4.7 shows 4 full + 1 half star)
```

### SkeletonLoader.tsx
```typescript
// Animated shimmer effect using Animated.loop + interpolation
// Gradient: light grey (#F3F4F6) → lighter grey (#E5E7EB) → back
// Props: width, height, borderRadius, style?
// Use this on EVERY screen while data is loading
// Never show a spinner as the primary loading state — always use skeletons
```

### EmptyState.tsx
```typescript
// Props: illustration (require('../assets/...')), title, subtitle, action?: {label, onPress}
// Centre aligned, max-width 300px
// Illustration: 200x180px
// Title: h3 style
// Subtitle: body style, textSecondary
// Optional CTA button below
```

---

## PART 9 — SCREEN-BY-SCREEN SPECIFICATIONS

### Screen 1 — Welcome (app/(auth)/welcome.tsx)
```
Layout: Full screen, SafeAreaView, no navigation header
Top 55%: Illustration (onboarding_1_find.png), contain resize
Bottom 45%: Branding + buttons
  - App logo: orange hard hat icon (ic_hard_hat.png) + "TradeFind" bold text
  - Tagline: "Find trusted tradespeople near you — instantly" (body, textSecondary)
  - Gap
  - Button: "I need a tradesperson" (primary, full width) → navigate to /auth/register?role=customer
  - Gap 12px
  - Button: "I'm a tradesperson" (outline, full width) → navigate to /auth/register?role=worker
  - Gap 20px
  - "Already have an account? Log In" (ghost/link style) → navigate to /auth/register?tab=login
```

### Screen 2 — Register/Login (app/(auth)/register.tsx)
```
Read ?role and ?tab from params
Tab toggle at top: "Sign Up" | "Log In" (custom tab, NOT native)

Sign Up tab:
  - Full Name input (ic_person icon)
  - Email input (ic_email icon, keyboard=email)
  - Phone input (ic_phone icon, keyboard=phone)
  - Password input (ic_lock icon, show/hide toggle)
  - Checkbox: "I agree to Terms & Privacy Policy" with link
  - "Create Account" button (primary, full width)
  - Divider: "or"
  - "Continue with Google" button (outline, Google icon SVG)
  - On success → navigate to /auth/location-permission

Log In tab:
  - Email input
  - Password input (show/hide)
  - "Forgot Password?" link (right aligned)
  - "Log In" button (primary, full width)
  - Divider + "Continue with Google"
  - On success → route based on role:
      customer → replace with /(customer)
      worker   → replace with /(worker)
      admin    → redirect to admin web panel URL

Validation (Zod):
  name: min 2 chars
  email: valid email
  phone: UK format (+44 or 07...)
  password: min 8 chars, 1 number, 1 uppercase
```

### Screen 3 — Location Permission (app/(auth)/location-permission.tsx)
```
Illustration: onboarding_2_live.png
Title: "Allow location access"
Body: "We use your location to show you tradespeople nearby. Your exact location is never stored or shared without your consent."
Primary button: "Allow Location" → call Location.requestForegroundPermissionsAsync()
  - Granted → save to locationStore → navigate to role-appropriate home
  - Denied → show subtle error, allow manual entry
Ghost button: "Enter my postcode instead" → text input appears for manual postcode
```

### Screen 4 — Customer Home (app/(customer)/index.tsx)
```
Header (not SafeArea — custom):
  Left: Location pin icon + "Birmingham, B11" text (tappable to change)
  Right: Notification bell with unread badge count

Search bar below header:
  Placeholder: "Search plumbers, electricians..."
  On submit → navigate to /customer/search?q=...
  On focus → navigate immediately to search screen

Filter chips horizontal scroll:
  All · Plumber · Electrician · Builder · Carpenter · Painter · Gas Engineer · Decorator
  Active chip: bg=primary, text=white
  Inactive: bg=surfaceElevated, text=textSecondary

Section: "Available Now Near You"
  Horizontal FlatList of WorkerCard components
  Fetch: GET /api/workers/nearby?availableOnly=true&radiusKm=5
  Loading: 3 horizontal WorkerCard skeletons

Section: "Highly Rated"
  Vertical FlatList of WorkerCardLarge components
  Fetch: GET /api/workers/nearby?sortBy=rating&radiusKm=10
  Loading: 3 vertical card skeletons

Pull to refresh: refetch both sections
Empty state: EmptyState component with empty_no_results.png
```

### Screen 5 — Map View (app/(customer)/map.tsx)
```
Full screen MapView (react-native-maps, Google provider)
Initial region: user's current location, delta 0.05

For each nearby worker:
  Custom WorkerMapPin marker at worker's coordinates
  Orange colour, shows worker's avatar thumbnail
  Tapping pin: brings up that worker's card in bottom sheet

Bottom sheet (BottomSheet component, snaps to 200px initially):
  "X tradespeople near you"
  Horizontal FlatList of WorkerCard
  Cards scroll independently from map

Top: Floating search bar (same as home but over map)
Bottom-right FAB: filter icon → opens filter modal

Update marker positions: refetch every 60 seconds while screen is focused
```

### Screen 6 — Worker Profile (app/(customer)/worker/[id].tsx)
```
Fetch GET /api/workers/:id on mount

Header photo: first portfolio photo or orange gradient fallback
  Height: 200px, full width
  Circular avatar (80px) overlaid at bottom-centre of photo
  Overlapping bottom of photo into card below

Info card:
  Name (h2), trades as pills, distance
  Rating row: StarRating (display, md) + count
  Availability Badge
  "X years experience" if bio mentions it

Tab bar: About | Reviews | Photos

About tab:
  Services list (from trades + bio)
  Certifications: each as pill with shield icon
  Service area: "Birmingham & surrounding X miles"
  Pricing notes: italic body text
  About/bio paragraph

Reviews tab:
  Average + breakdown bars
  FlatList of ReviewCard
  Load more button

Photos tab:
  2-column grid of portfolio photos
  Tap to full-screen lightbox

Sticky bottom bar (always visible):
  Left: "Call Now" button (primary, phone icon)
    → Linking.openURL('tel:' + worker.phone)
  Right: bookmark icon button (filled if saved, outline if not)
    → toggle save/unsave

"Track on Map" button (below tabs, only if worker.isAvailable):
  → navigate to /customer/worker/tracking?workerId=id
```

### Screen 7 — Live Tracking (app/(customer)/worker/tracking.tsx)
```
Full screen MapView
User location: standard blue dot
Worker location: WorkerMapPin with TrackingPulse (animated orange rings)

WebSocket:
  On mount: socket.emit('track:start', { workerId })
  Listen: socket.on('worker:moved', ({ lat, lng }) => update marker)
  On unmount: socket.emit('track:stop', { workerId })
  
Animate map camera to keep both pins visible (fitToCoordinates)

Bottom card (fixed, 140px height):
  Worker avatar + name + trade
  "En route to you" status text with pulsing dot
  Distance + ETA (estimated from distance, assume 30km/h average)
  "Call [Name]" button (primary)

If worker goes offline mid-tracking:
  Show alert: "James has gone offline"
  Show "Go Back" button
```

### Screen 8 — Search Results (app/(customer)/search.tsx)
```
Persistent search bar at top (auto-focused if navigated from home)
Current query shown, clearable X button

Filter row below: Distance · Rating · Available Now toggle
Sort row: Nearest | Highest Rated | Available Now

Result count: "18 plumbers near Birmingham"

FlatList of WorkerCardLarge
Each card has quick "Call" button

Empty state: empty_no_results.png
Loading: 5 skeleton cards
```

### Screen 9 — Leave Review (app/(customer)/worker/review.tsx)
```
Header: "How was your experience with [Worker Name]?"
Worker info row: avatar + name + trade (non-interactive)

Interactive StarRating (lg size, centred)
Current selection shown large below stars: "Excellent" / "Good" / "Average" etc.

Text area: multiline, min 3 lines, max 500 chars
Char counter bottom-right of text area

Photo upload: "+" tile in horizontal scroll
  expo-image-picker → upload to R2 → show thumbnails

Submit button: "Post Review" (primary, full width)
  POST /api/reviews { toId, toType: 'worker', rating, text, photos }
  On success: navigate back to worker profile, show success toast
  
Note: "Reviews cannot be edited after posting"
```

### Screen 10 — Saved Workers (app/(customer)/saved.tsx)
```
Header: "Saved Tradespeople"

FlatList of WorkerCardLarge
Each card: bookmark icon (filled orange) on right → tap to unsave
Quick "Call" button on each card

Store saved worker IDs in Zustand + AsyncStorage (persists between sessions)
Fetch full worker data on mount: GET /api/workers/saved

Empty state: empty_no_saved.png with "Save workers you trust for quick access"
```

### Screen 11 — Customer Profile (app/(customer)/profile.tsx)
```
Avatar (80px, circular) — tap to change via expo-image-picker
Name (h2)
Email + phone (small, textSecondary)

Stats row (3 equal boxes):
  [Jobs Done] [Reviews Given] [Saved Workers]

Settings list (Pressable rows with chevron):
  Edit Profile
  My Reviews
  Notification Preferences
  Privacy & Location Settings
  Help & Support
  Terms & Privacy
  Log Out (red text, no chevron, confirmation dialog)

Location sharing toggle row (with subtitle)
```

### Screen 12/13 — Worker Dashboard (app/(worker)/index.tsx)
```
Header: "Good morning, [Name] 👋" (dynamic greeting by time of day)

AvailabilityToggle component (full width)

Stats row (today):
  Profile Views | Calls Received | New Reviews
  Fetch: GET /api/workers/stats/today

Recent activity FlatList (last 5 items):
  Icon + description + time ago
  Types: "Sarah viewed your profile · 2h ago"
         "Tom left you a ⭐⭐⭐⭐⭐ review · 1d ago"
         "Your profile was saved by 3 people · 2d ago"

Quick action buttons row:
  [Edit Profile] [View Reviews] [Share Profile]
  Share profile → Share.share({ url: 'https://tradefind.app/w/[id]' })
```

### Screen 14 — Edit Profile (app/(worker)/edit-profile.tsx)
```
ScrollView with sticky "Save" button at bottom

Sections (each with section header):

Profile Photo:
  Circular avatar (100px, centred)
  "Change Photo" link below → expo-image-picker → upload to R2

Basic Info:
  Name input
  Phone input (shown to customers)
  Email (read-only, change via support)

About:
  Bio text area (max 300 chars, counter)
  Pricing Notes text area (max 200 chars)

Trades (multi-select chip grid):
  Import list from constants/trades.ts
  Selected: bg=primary, text=white
  Min 1 trade required

Service Area:
  Text: "You cover X miles from your location"
  Slider: 1–50 miles (step 1)
  As you drag: update text above

Certifications (tag input):
  Type certification name + press Enter/Add to add tag
  Each tag: text + × remove button
  Common ones shown as quick-add chips: Gas Safe · NICEIC · CSCS · City & Guilds

Portfolio Photos:
  Grid: existing photos + "Add Photo" tile (max 8 photos)
  Tap existing → option to remove
  Tap Add → expo-image-picker (multi-select) → upload all to R2

Save button (sticky bottom):
  PATCH /api/workers/profile with all changed fields
  Show success toast, navigate back
```

### Screen 15 — My Reviews (app/(worker)/reviews.tsx)
```
Summary card:
  Large rating number (h1, left)
  StarRating display (md) + "(X reviews)"
  Rating breakdown bars:
    5★ ████████████████░░ 72%
    4★ ██████░░░░░░░░░░░░ 18%
    ...

Filter tabs: All | 5★ | 4★ | Recent

FlatList of ReviewCard
Each ReviewCard:
  Customer avatar + name + stars + date
  Review text (expandable if > 3 lines)
  If no reply: "Reply" button below
    → inline text input appears
    → POST /api/reviews/:id/reply
  If replied: "Your reply: ..." in subtle box
```

### Screen 16 — Review Customer (app/(worker)/review-customer.tsx)
```
Similar layout to Screen 9
Header: "How was [Customer Name] as a customer?"
Same star selector + text + submit flow
POST /api/reviews { toId: customerId, toType: 'customer', rating, text }
Note: "This helps build a trustworthy community for everyone"
```

### Screen 17 — Notifications (app/(worker)/notifications.tsx)
```
Header: "Notifications" + "Mark all read" text button (right)

FlatList of notification rows:
  Left: coloured icon based on type
    new_review: star icon (amber)
    account_approved: checkmark (green)
    profile_saved: bookmark (primary)
    call_received: phone (primary)
  Middle: title (bodyMd) + body (small, textSecondary) + time ago
  Left border: 3px primary colour if unread, transparent if read
  Background: surface if unread, transparent if read

Empty state: "No notifications yet — you will be notified of reviews, saves and calls"

Fetch: GET /api/notifications
Mark all read: PATCH /api/notifications/read-all
```

### Screen 18 — Profile Preview (app/(worker)/preview.tsx)
```
Renders the exact same component as Screen 6 (Worker Public Profile)
Passes current worker's own data as props

Orange banner at top (non-dismissable):
  "👁 PREVIEW MODE — This is exactly what customers see"

Floating "Edit Profile" button (bottom-right FAB)
```

---

## PART 10 — CONSTANTS: TRADE CATEGORIES

```typescript
// constants/trades.ts
export const TRADES = [
  'Plumber',
  'Gas Engineer',
  'Electrician',
  'Builder / General Contractor',
  'Carpenter / Joiner',
  'Painter & Decorator',
  'Plasterer',
  'Roofer',
  'Tiler (Floor & Wall)',
  'Landscaper / Gardener',
  'Locksmith',
  'HVAC / Heating Engineer',
  'Handyman',
  'Demolition',
  'Groundworker',
  'Scaffolder',
  'Glazier (Windows & Doors)',
  'Flooring Specialist',
  'Kitchen Fitter',
  'Bathroom Fitter',
  'Damp Proofing Specialist',
  'Surveyor',
  'Architect',
  'Structural Engineer',
] as const;

export type Trade = typeof TRADES[number];
```

---

## PART 11 — CRITICAL IMPLEMENTATION RULES

Read every rule. Never violate them.

**Design Rules:**
1. Never hardcode a colour value — always use `colors.*` from constants
2. Never hardcode a spacing value — always use `spacing.*`
3. Every `Image` for remote URLs uses `expo-image`, not React Native's `Image`
4. Local asset images (icons, illustrations) use React Native's `Image`
5. Every screen wraps content in `SafeAreaView` from `react-native-safe-area-context`
6. Every screen with inputs wraps in `KeyboardView` component (KeyboardAvoidingView)
7. Never use inline styles for layout — use StyleSheet.create()

**State Rules:**
8. All server state lives in Zustand stores — never in component state except for form inputs
9. Auth tokens stored in `expo-secure-store` (encrypted) — never AsyncStorage
10. User preferences (notification settings, etc.) stored in AsyncStorage

**API Rules:**
11. All API calls go through `services/api.ts` Axios instance — never raw fetch()
12. The Axios interceptor automatically attaches JWT token to every request
13. On 401 response: interceptor tries to refresh token once, then logs out
14. Never show raw API error messages to users — map to friendly messages

**Location Rules:**
15. Worker NEVER sends location updates when `isAvailable === false` in the Zustand store
16. Location updates stop IMMEDIATELY on toggle-off (clearInterval before the API call)
17. Always request foreground permission before accessing location
18. Background location requires explicit user consent and explanation

**UX Rules:**
19. Every data-fetching screen has THREE states: loading (skeleton), data, error
20. Loading state: always use SkeletonLoader, never ActivityIndicator as primary loader
21. Error state: always show friendly message + retry button — never show raw error
22. Empty state: always use EmptyState component with correct illustration
23. Every destructive action (delete, block, unsave) requires a confirmation dialog
24. Show toast notifications for all successful mutations (save, update, submit)

**Performance Rules:**
25. FlatList keyExtractor must always use the item's database `id`
26. Use `removeClippedSubviews={true}` on long FlatLists
27. Wrap expensive components in `React.memo()` — especially map pins and cards
28. Use `useCallback` for all FlatList `renderItem` and `keyExtractor`

**Security Rules:**
29. Never log auth tokens or personal data to console in production
30. Validate all form inputs client-side with Zod before sending to API
31. Never store raw passwords anywhere — handled by bcrypt on backend only

---

## PART 12 — BUILD ORDER (FASTEST PATH TO WORKING APP)

Follow this exact order. Do not jump ahead. Each step produces testable, working code.

```
Phase 1 — Foundation (no visible UI yet, just plumbing)
  1. Project init: npx create-expo-app tradefind --template expo-template-blank-typescript
  2. Install all dependencies (full list at end of this prompt)
  3. Create all constants files (colors, spacing, typography, radius, shadows, trades, config)
  4. Create all type definition files
  5. Create services/api.ts with Axios instance and interceptors
  6. Create stores/authStore.ts with Zustand
  7. Create utils/storage.ts (SecureStore wrappers)

Phase 2 — UI Components
  8. components/ui/Button.tsx
  9. components/ui/Input.tsx
  10. components/ui/Card.tsx
  11. components/ui/Badge.tsx
  12. components/ui/Avatar.tsx
  13. components/ui/StarRating.tsx
  14. components/ui/SkeletonLoader.tsx
  15. components/ui/EmptyState.tsx
  16. components/ui/Toast.tsx

Phase 3 — Auth Flow (first working screens)
  17. app/(auth)/welcome.tsx
  18. services/auth.ts
  19. app/(auth)/register.tsx — Sign Up tab first, Login tab second
  20. app/(auth)/location-permission.tsx
  21. app/_layout.tsx — root layout with auth guard routing

Phase 4 — Customer Core (most important user journey)
  22. stores/locationStore.ts + hooks/useLocation.ts
  23. stores/workerStore.ts
  24. services/workers.ts
  25. components/worker/WorkerCard.tsx
  26. components/worker/WorkerCardLarge.tsx
  27. app/(customer)/_layout.tsx — bottom tab bar
  28. app/(customer)/index.tsx — Home screen
  29. app/(customer)/worker/[id].tsx — Worker profile
  30. app/(customer)/map.tsx — Map view

Phase 5 — Worker Core (second most important)
  31. services/socket.ts
  32. stores/trackingStore.ts
  33. components/worker/AvailabilityToggle.tsx
  34. app/(worker)/_layout.tsx
  35. app/(worker)/index.tsx — Dashboard
  36. app/(worker)/edit-profile.tsx

Phase 6 — Remaining Screens
  37. app/(customer)/search.tsx
  38. app/(customer)/worker/tracking.tsx
  39. app/(customer)/worker/review.tsx
  40. app/(customer)/saved.tsx
  41. app/(customer)/profile.tsx
  42. app/(worker)/reviews.tsx
  43. app/(worker)/review-customer.tsx
  44. app/(worker)/notifications.tsx
  45. app/(worker)/preview.tsx

Phase 7 — Polish
  46. hooks/useNotifications.ts — push notification setup
  47. Error boundary component
  48. App icon + splash screen configuration in app.json
  49. Deep link configuration for Expo Router
  50. EAS build configuration (eas.json)
```

---

## PART 13 — PACKAGE INSTALLATION

Run this exact command after `npx create-expo-app`:

```bash
npx expo install \
  expo-router \
  expo-location \
  expo-image \
  expo-image-picker \
  expo-notifications \
  expo-secure-store \
  @react-native-async-storage/async-storage \
  react-native-maps \
  react-native-safe-area-context \
  react-native-screens \
  react-native-gesture-handler \
  react-native-reanimated \
  @react-native-community/slider

npm install \
  zustand \
  axios \
  socket.io-client \
  react-hook-form \
  zod \
  @hookform/resolvers \
  date-fns
```

app.json plugins to add:
```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-location",
      "expo-image-picker",
      ["expo-notifications", {
        "icon": "./assets/icons/notification-icon.png",
        "color": "#F97316"
      }],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "TradeFind uses your location to show nearby tradespeople.",
          "locationWhenInUsePermission": "TradeFind uses your location to show nearby tradespeople.",
          "locationAlwaysPermission": "TradeFind uses your background location to share your availability with customers."
        }
      ]
    ]
  }
}
```

---

## PART 14 — HOW TO WORK WITH STITCH SCREEN DESIGNS

When building each screen, reference the Stitch export:

```
Tell Claude Code:
"Build Screen [N] — [NAME] at app/[path].tsx
Reference design: assets/screens/Screen_[NN]_[Name].png
Match the layout, colours, component placement and spacing exactly.
Use components from components/ — create them if they don't exist yet.
Use ONLY colours from constants/colors.ts and spacing from constants/spacing.ts."
```

The Stitch designs are the visual truth. The specs in this prompt are the behavioural truth. When they conflict (unlikely), ask which takes precedence.

---

## START COMMAND FOR CLAUDE CODE

**When you are ready to begin, tell Claude Code this:**

```
Read this entire CONTEXT.md file before writing any code. Confirm you have
read and understood it by listing the 7 sections of Part 1 (they are:
project overview, tech stack, design system, folder structure, data models,
API endpoints, location architecture).

Then begin Phase 1 of the build order in Part 12. Create all files listed
in Phase 1 steps 1–7. Do not proceed to Phase 2 until all Phase 1 files
are complete, linting clean, and you have confirmed each one with me.
```

---

*TradeFind — Master Claude Code Prompt — Version 1.0 — April 2026*
*Built with: React Native + Expo + Node.js/Fastify + Go + Redis + PostgreSQL + Cloudflare R2*
