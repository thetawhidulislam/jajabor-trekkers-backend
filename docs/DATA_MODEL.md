# Jajabor Trekkers Data Model

This document defines the canonical backend data model for the travel and expedition platform. The following models are required by the application and must all exist in Prisma.

## Enums

- Role: `USER`, `ADMIN`
- DestinationStatus: `DRAFT`, `PUBLISHED`, `ARCHIVED`
- TripStatus: `PLANNED`, `ACTIVE`, `COMPLETED`, `CANCELLED`
- TripMemberRole: `LEADER`, `MEMBER`
- ItineraryItemType: `CHECK_IN`, `STAY`, `ACTIVITY`, `TRANSPORT`, `MEAL`, `FREE_TIME`
- PackingItemStatus: `PENDING`, `PACKED`
- ExpenseCategory: `TRANSPORT`, `FOOD`, `LODGING`, `ACTIVITIES`, `GEAR`, `ENTRY_FEES`, `SHOPPING`, `OTHER`
- ExpenseShareType: `EQUAL`, `PERCENTAGE`, `CUSTOM`
- SettlementStatus: `PENDING`, `SETTLED`, `CANCELLED`

## Models

### User
Represents the primary app account. A user can publish destinations, create trips, join trip members, create expenses, and leave reviews.

Fields:
- id: unique user id
- name: display name
- email: unique email address
- image: avatar or profile image URL
- bio: short profile description
- role: app role (`USER` or `ADMIN`)
- createdAt, updatedAt
- relations: destinations, trips, tripMemberships, itineraryItems, packingItems, createdExpenses, paidExpenses, settlementPayer, settlementReceiver, reviews, expenseSplits

### Destination
Represents a travel destination available in the marketplace.

Fields:
- id, name, slug, country, region, description, coverImage
- status: `DRAFT`, `PUBLISHED`, or `ARCHIVED`
- featured
- createdBy
- createdAt, updatedAt
- relations: creator, images, trips, reviews

### DestinationImage
Stores image assets for a destination.

Fields:
- id, destinationId, url, caption, isPrimary
- createdAt
- relation: destination

### Trip
Represents a trip or expedition organized around a destination.

Fields:
- id, name, slug, destinationId, startDate, endDate, status
- budget, currency, description, coverImage
- createdBy
- createdAt, updatedAt
- relations: destination, organizer, members, itineraryItems, packingItems, expenses, settlements, reviews

### TripMember
Represents membership of a user in a trip.

Fields:
- id, tripId, userId, role, joinedAt
- createdAt, updatedAt
- relation: trip, user

### ItineraryItem
Represents a planned item in a trip itinerary.

Fields:
- id, tripId, title, description, type, startTime, endTime, location, notes, createdBy
- createdAt, updatedAt
- relations: trip, creator

### PackingItem
Represents an item that should be packed for a trip.

Fields:
- id, tripId, name, quantity, status, packedById, notes
- createdAt, updatedAt
- relations: trip, packedBy

### Expense
Represents a trip expense.

Fields:
- id, tripId, createdById, paidById, title, category, amount, currency, description
- createdAt, updatedAt
- relations: trip, creator, payer, splits

### ExpenseSplit
Tracks each user’s share of an expense.

Fields:
- id, expenseId, userId, amount, shareType, notes
- createdAt, updatedAt
- relations: expense, user

### Settlement
Represents a reimbursement or debt settlement between users in a trip.

Fields:
- id, tripId, payerId, receiverId, amount, currency, status, note
- createdAt, updatedAt
- relations: trip, payer, receiver

### Review
Represents a user review for a destination or trip.

Fields:
- id, userId, tripId, destinationId, rating, comment
- createdAt, updatedAt
- relations: user, trip, destination

## Notes
- The application is designed around a modular monolith with Prisma as the database layer.
- The Better Auth tables are generated separately by the Better Auth CLI and are not manually modeled in this document.
- Every model above must be present in the Prisma schema for the backend to match the required domain model.
