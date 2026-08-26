# Database Design

## 1. Final Prisma Schema Proposal
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  role         Role      @default(CUSTOMER)
  holds        Hold[]
  bookings     Booking[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

enum Role { CUSTOMER PARTNER ADMIN }

model Property {
  id          String       @id @default(uuid())
  ownerId     String       // Ties property to a Partner
  name        String
  city        String
  area        String
  address     String
  description String?
  spaces      VenueSpace[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model VenueSpace {
  id          String      @id @default(uuid())
  propertyId  String
  property    Property    @relation(fields: [propertyId], references: [id])
  name        String
  capacity    Int
  price       Decimal     @db.Decimal(10, 2)
  amenities   Json?
  inventories Inventory[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Inventory {
  id           String     @id @default(uuid())
  venueSpaceId String
  venueSpace   VenueSpace @relation(fields: [venueSpaceId], references: [id])
  date         DateTime   @db.Date
  session      Session
  status       InvStatus  @default(AVAILABLE)
  holds        Hold[]
  bookings     Booking[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([venueSpaceId, date, session])
  @@index([date, session, status])
}

enum Session { MORNING EVENING FULL_DAY }
enum InvStatus { AVAILABLE HOLD BOOKED BLOCKED }

model Hold {
  id          String           @id @default(uuid())
  inventoryId String
  inventory   Inventory        @relation(fields: [inventoryId], references: [id])
  customerId  String
  customer    User             @relation(fields: [customerId], references: [id])
  status      HoldStatus       @default(ACTIVE)
  expiresAt   DateTime
  paymentAttempts PaymentAttempt[]
  booking     Booking?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@index([status, expiresAt])
}

enum HoldStatus { ACTIVE EXPIRED CONVERTED CANCELLED }

model PaymentAttempt {
  id            String        @id @default(uuid())
  holdId        String
  hold          Hold          @relation(fields: [holdId], references: [id])
  transactionId String        @unique
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(PENDING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

enum PaymentStatus { PENDING SUCCESS FAILED }

model Booking {
  id               String        @id @default(uuid())
  inventoryId      String
  inventory        Inventory     @relation(fields: [inventoryId], references: [id])
  customerId       String
  customer         User          @relation(fields: [customerId], references: [id])
  holdId           String        @unique
  hold             Hold          @relation(fields: [holdId], references: [id])
  paymentAttemptId String        @unique // The successful attempt that converted the hold
  bookingReference String        @unique
  amount           Decimal       @db.Decimal(10, 2)
  status           BookingStatus @default(CONFIRMED)
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
}

enum BookingStatus { CONFIRMED CANCELLED }
```

## 2. Type Handling Decisions
- **Monetary Values**: Use `Decimal` (Prisma) and `DECIMAL(10, 2)` (MySQL) to prevent floating-point inaccuracies.
- **Date Handling**: `Inventory.date` uses `DateTime @db.Date`. Timezone strategy will assume Asia/Kolkata for business logic, but DB dates remain purely calendar dates without time.
- **Expiration Time**: Server-controlled `DateTime` generated in UTC (`NOW() + 10 mins`). Never trusted from the client.
