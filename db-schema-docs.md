# Database Schema Documentation

## Overview
The Meet Me Halfway application uses Supabase with PostgreSQL and Drizzle ORM for data storage. The database schema includes tables for user profiles, search history, points of interest, and locations.

## Schema Definitions

### 1. User Profiles (`db/schema/profiles-schema.ts`)

#### Profile Table
```typescript
export const membershipEnum = pgEnum("membership", ["free", "pro"])

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### Profile Types
```typescript
export type Profile = typeof profilesTable.$inferSelect
export type NewProfile = typeof profilesTable.$inferInsert
```

### 2. Search History (`db/schema/searches-schema.ts`)

#### Search Table
```typescript
export const searchesTable = pgTable("searches", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => profilesTable.userId),
  startLocation: jsonb("start_location").notNull(),
  endLocation: jsonb("end_location").notNull(),
  mainRoute: jsonb("main_route"),
  alternateRoute: jsonb("alternate_route"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### Search Types
```typescript
export type Search = typeof searchesTable.$inferSelect
export type NewSearch = typeof searchesTable.$inferInsert
```

### 3. Points of Interest (`db/schema/pois-schema.ts`)

#### POI Table
```typescript
export const poisTable = pgTable("pois", {
  id: text("id").primaryKey().notNull(),
  searchId: text("search_id").notNull().references(() => searchesTable.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address").notNull(),
  location: jsonb("location").notNull(),
  travelTimes: jsonb("travel_times").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### POI Types
```typescript
export type POI = typeof poisTable.$inferSelect
export type NewPOI = typeof poisTable.$inferInsert
```

### 4. Locations (`db/schema/locations-schema.ts`)

#### Location Table
```typescript
export const locationsTable = pgTable("locations", {
  id: text("id").primaryKey().notNull(),
  userId: text("user_id").notNull().references(() => profilesTable.userId),
  name: text("name").notNull(),
  address: text("address").notNull(),
  location: jsonb("location").notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})
```

#### Location Types
```typescript
export type Location = typeof locationsTable.$inferSelect
export type NewLocation = typeof locationsTable.$inferInsert
```

## Relationships

### 1. User Profile Relationships
- One-to-many with searches
- One-to-many with saved locations
- One-to-one with Stripe customer

### 2. Search Relationships
- Many-to-one with user profile
- One-to-many with POIs
- Optional relationship with alternate route

### 3. POI Relationships
- Many-to-one with search
- Contains location and travel time data

### 4. Location Relationships
- Many-to-one with user profile
- Contains geocoded location data

## Indexes

### 1. Profile Indexes
```sql
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
```

### 2. Search Indexes
```sql
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_created_at ON searches(created_at);
```

### 3. POI Indexes
```sql
CREATE INDEX idx_pois_search_id ON pois(search_id);
CREATE INDEX idx_pois_type ON pois(type);
```

### 4. Location Indexes
```sql
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_is_favorite ON locations(is_favorite);
```

## Data Types

### 1. JSON Fields
- `startLocation`: Geocoded start location
- `endLocation`: Geocoded end location
- `mainRoute`: OSRM route data
- `alternateRoute`: OSRM alternate route data
- `location`: Geocoded POI location
- `travelTimes`: ORS travel time matrix data

### 2. Enums
- `membership`: ["free", "pro"]

## Best Practices

### 1. Schema Design
- Use appropriate data types
- Implement proper relationships
- Add necessary indexes
- Include timestamps

### 2. Data Integrity
- Use foreign key constraints
- Implement cascading deletes
- Validate JSON data
- Handle null values

### 3. Performance
- Optimize indexes
- Use appropriate data types
- Implement pagination
- Cache frequently accessed data

## Migration Guidelines

### 1. Creating Migrations
```bash
npm run db:generate
```

### 2. Applying Migrations
```bash
npm run db:migrate
```

### 3. Migration Best Practices
- Test migrations locally
- Backup before applying
- Use transactions
- Document changes

## Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

This documentation provides a comprehensive guide to the database schema in the Meet Me Halfway application. 