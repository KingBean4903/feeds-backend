# High-Scale Social Graph Service

A distributed backend service that models the follow graph of a social media platform while demonstrating how large-scale systems handle follow storms from celebrity accounts.

The project explores two ingestion strategies:

* **Single Follow Pipeline** for normal users
* **Batch Follow Pipeline** for celebrity follow surges

The goal is to showcase distributed systems concepts including event-driven architecture, batching, Kafka partitioning, Redis projections, idempotent consumers, and scalable social graph management.

---

# Motivation

Most users receive a handful of follows per day.

Celebrity accounts are different.

When a creator like Cristiano Ronaldo joins a platform, millions of users may subscribe within minutes. Processing every follow independently results in:

* Millions of HTTP requests
* Millions of Kafka messages
* Millions of database writes
* Millions of Redis updates

This project demonstrates how those workloads can be handled efficiently using adaptive ingestion.

---

# Features

* GraphQL API
* Single follow processing
* Celebrity batch follow processing
* Kafka event-driven architecture
* PostgreSQL as the source of truth
* Redis relationship projections
* Redis Lua scripts for atomic batch updates
* Idempotent consumers
* User tier detection (Regular / Influencer / Celebrity)
* Redis-backed social graph
* Feed-ready relationship model

---

# Architecture

```text
                    GraphQL API
                         │
                         ▼
                 Follow Service
                         │
                Check User Tier
                     (Redis)
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
      Regular User             Celebrity User
             │                       │
             ▼                       ▼
      Kafka Event            In-Memory Buffer
             │                       │
             │             Flush (Size / Time)
             │                       │
             └───────────────┬───────┘
                             ▼
                          Kafka
                             ▼
                  Relationship Consumer
                             ▼
              PostgreSQL Bulk Persistence
                             ▼
              Redis Lua Relationship Projection
```

---

# Single Follow Pipeline

Regular users are processed immediately.

```text
GraphQL

↓

FollowCreated

↓

Kafka

↓

Relationship Consumer

↓

PostgreSQL

↓

Redis Projection
```

Each follow request becomes a single Kafka event.

This provides low latency while keeping the implementation straightforward.

---

# Celebrity Batch Pipeline

Large accounts use a different ingestion strategy.

```text
GraphQL

↓

Tier Lookup

↓

Celebrity

↓

Buffer

↓

Kafka FollowBatchCreated

↓

Relationship Consumer

↓

Bulk PostgreSQL Insert

↓

Redis Lua Batch Projection
```

Instead of producing thousands of Kafka messages, the service groups follow requests into batches before publishing.

Benefits include:

* Reduced Kafka traffic
* Larger database batches
* Fewer Redis operations
* Better throughput during follow storms

---

# User Tiers

Accounts are classified into different processing tiers.

| Tier       | Strategy                            |
| ---------- | ----------------------------------- |
| Regular    | Immediate processing                |
| Influencer | Immediate processing (configurable) |
| Celebrity  | Batch processing                    |

The tier is stored in Redis for fast routing.

---

# Relationship Projection

PostgreSQL remains the source of truth.

Redis maintains materialized projections for fast reads.

Examples include:

```text
followers:user:123

following:user:456

followers_count:user:123

following_count:user:456

user:tier:user:123
```

Redis updates are performed atomically using Lua scripts.

---

# Kafka Topics

Current topics:

```text
follow.created

follow.batch.created
```

Both topics are consumed by the relationship service.

---

# Technology Stack

* Node.js
* TypeScript
* NestJS
* GraphQL
* Kafka
* PostgreSQL
* Prisma
* Redis
* Redis Lua

---

# Design Decisions

## PostgreSQL as Source of Truth

Relationships are persisted in PostgreSQL.

Redis is treated as a projection layer and can be rebuilt if necessary.

---

## Event-Driven Processing

HTTP requests never update Redis directly.

All projections are updated asynchronously through Kafka consumers.

This decouples writes from cache maintenance and enables retries.

---

## Batch Processing for Celebrities

The system adapts to user popularity.

Regular users generate individual events.

Celebrity accounts generate batched events that significantly reduce downstream load.

---

## Atomic Redis Updates

Relationship projections are updated using Lua scripts to ensure multiple Redis operations execute atomically.

---

# Current Scope

* User follow API
* Batch follow API
* Kafka producers
* Kafka consumers
* PostgreSQL persistence
* Redis projections
* Redis Lua batch processing
* User tier routing

---

# Future Work

The next phase extends the project into a complete social feed platform.

## Post Creation

```text
Create Post

↓

Kafka

↓

Fanout Service
```

---

## Fanout on Write

Posts from regular users will be pushed into followers' timelines immediately.

```text
Post

↓

Fanout

↓

Redis Timelines
```

---

## Fanout on Read

Celebrity posts will not be written into every follower timeline.

Instead, they will be merged dynamically during feed assembly.

```text
Timeline

+

Celebrity Posts

↓

Feed Assembly

↓

GraphQL Feed
```

This avoids millions of Redis writes for highly followed accounts.

---

## Feed Generation

Future work includes:

* Timeline materialization
* Hybrid fanout (write + read)
* Cursor pagination
* Ranking
* Feed assembly
* Redis sorted-set timelines
* Feed caching
* Post ranking strategies

---

# Learning Goals

This project focuses on backend scalability rather than UI development.

Key concepts demonstrated include:

* Event-driven architecture
* Adaptive request processing
* Batch ingestion
* Kafka partitioning
* Bulk database writes
* Redis projections
* Atomic Lua scripting
* Idempotent consumers
* High-scale social graph design
* Foundations for large-scale feed generation


# Running the Project

## Prerequisites

- Node.js 24+
- pnpm
- Docker & Docker Compose

The project depends on the following infrastructure:

- PostgreSQL
- Redis
- Apache Kafka

---

## Start Infrastructure

Start all required services.

```bash
docker compose -f docker-compose.dev.yaml up --build  
```

This starts:

- PostgreSQL
- Redis
- Kafka

---

## Install Dependencies

```bash
pnpm install
```

---

## Generate Prisma Client

```bash
pnpm prisma generate
```

---

## Run Database Migrations

Development

```bash
pnpm prisma migrate dev
```

Production

```bash
pnpm prisma migrate deploy
```

---

## Start the API

```bash
pnpm start:dev
```

The GraphQL endpoint is available at:

```text
http://localhost:9500/graphql
```

---

# GraphQL API

## Follow User

Creates a follow relationship.

### Mutation

```graphql
mutation FollowUser($followInput: FollowInput!) {
  followUser(followInput: $followInput) {
    followerId
    followingId
    createdAt
  }
}
```

### Variables

```json
{
  "followInput": {
    "followerId": "user_25",
    "followingId": "user_1001"
  }
}
```

---

## cURL Example

```bash
curl http://localhost:9500/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query":"mutation FollowUser($followInput: FollowInput!) { followUser(followInput:$followInput){ followerId followingId createdAt } }",
    "variables":{
      "followInput":{
        "followerId":"user_25",
        "followingId":"user_1001"
      }
    }
}'
```

---

# Request Flow

## Regular User

```text
Client
    │
    ▼
GraphQL
    │
    ▼
Kafka (FollowCreated)
    │
    ▼
Relationship Consumer
    │
    ▼
PostgreSQL
    │
    ▼
Redis Projection
```

---

## Celebrity User

```text
Client
    │
    ▼
GraphQL
    │
    ▼
Redis Tier Lookup
    │
    ▼
Celebrity Buffer
    │
    ▼
Kafka (FollowBatchCreated)
    │
    ▼
Relationship Consumer
    │
    ▼
Bulk PostgreSQL Insert
    │
    ▼
Redis Lua Projection
```

