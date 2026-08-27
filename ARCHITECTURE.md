# Riwi Chat - Architecture

## 1. Overview

Riwi Chat is an internal messaging application.

The application has these main parts:

- User interface
- Next.js API
- Authentication
- PostgreSQL database
- Row Level Security
- AI Copilot
- Gemini
- pgvector

The main goal is to keep the application simple, secure, and easy to understand.

---

## 2. General Architecture

The application uses Next.js for the frontend and backend.

```text
User
  |
  v
Next.js Frontend
  |
  v
Next.js API
  |
  +-------------------+
  |                   |
  v                   v
Authentication     AI Provider
  |                   |
  v                   v
PostgreSQL          Gemini
  |
  v
RLS + pgvector
```

PostgreSQL is the main database.

Gemini is used for:

- embeddings
- AI answers

---

## 3. Project Structure

The main project structure is:

```text
app/src/
├── app/
│   ├── api/
│   ├── dashboard/
│   └── login/
│
├── application/
│   └── ports/
│
├── infrastructure/
│   ├── ai/
│   ├── auth/
│   └── database/
│
└── i18n/
```

### app

This folder contains:

- pages
- dashboard
- login
- API routes

### application

This folder contains contracts used by the application.

For example, the AI provider has an interface.

The application does not need to know all Gemini details.

### infrastructure

This folder contains technical implementations.

For example:

- PostgreSQL connection
- JWT authentication
- Gemini provider
- database transactions

### i18n

This folder contains the Spanish and English translations.

---

## 4. Database Architecture

Riwi Chat uses:

- PostgreSQL 16
- pgvector
- Row Level Security
- SQL functions
- procedures
- triggers
- views

The database stores:

- users
- channels
- channel members
- messages
- authentication information
- message embeddings

The SQL files are separated into:

```text
database/
├── migrations/
├── queries/
├── seeds/
└── tests/
```

---

## 5. Authentication Flow

The application uses JWT authentication.

The login flow is:

```text
User
  |
  v
POST /api/auth/login
  |
  v
Check email and password
  |
  v
Create Access Token
  |
  v
Create Refresh Token
```

The Access Token is used for API requests.

Example:

```text
Authorization: Bearer ACCESS_TOKEN
```

The Refresh Token is stored in an HttpOnly cookie.

This helps protect the token from JavaScript in the browser.

The application also supports:

- refresh token rotation
- logout
- token validation

---

## 6. Authorization and RLS

Riwi Chat uses PostgreSQL Row Level Security.

The API sends the authenticated user ID to the database transaction.

```text
Authenticated User
       |
       v
Next.js API
       |
       v
Database Transaction
       |
       v
Current User ID
       |
       v
PostgreSQL RLS
       |
       v
Authorized Data
```

RLS helps protect:

- private channels
- messages
- search results
- message history
- AI context

This is important because security is not only in the frontend.

The database also checks access.

---

## 7. Message Flow

When a user sends a message:

```text
User
  |
  v
Dashboard
  |
  v
POST message
  |
  v
Next.js API
  |
  v
Authentication
  |
  v
PostgreSQL
  |
  v
RLS
  |
  v
Message saved
```

The frontend uses an optimistic message state.

The user can see:

- Pending
- Sent
- Failed

This gives fast visual feedback.

---

## 8. Message History

The message history uses keyset pagination.

The cursor uses:

```text
created_at
id
```

Example:

```json
{
  "createdAt": "2026-08-27 12:28:47.945737+00",
  "id": "message-uuid"
}
```

This is better than using only OFFSET for a message history.

It works well when new messages are created.

---

## 9. Message Updates

The MVP uses polling.

The dashboard checks for new messages every few seconds.

```text
Browser
   |
   | every 3 seconds
   v
Messages API
   |
   v
PostgreSQL
```

This allows another browser to see new messages without a manual page reload.

For a bigger production application, this can change to:

- WebSockets
- Server-Sent Events

Polling was selected because it is simple and enough for this MVP.

---

## 10. Search

Users can search messages.

The flow is:

```text
Search text
    |
    v
Next.js API
    |
    v
Authentication
    |
    v
PostgreSQL
    |
    v
RLS
    |
    v
Authorized results
```

A user must not receive private messages from another user.

---

## 11. AI Copilot

Riwi Chat has an AI Copilot.

The Copilot uses RAG.

RAG means Retrieval-Augmented Generation.

The Copilot does not send all database messages to Gemini.

First, the application finds useful and authorized messages.

Then these messages are used as context.

---

## 12. RAG Flow

```text
User Question
      |
      v
Create Question Embedding
      |
      v
pgvector Search
      |
      v
PostgreSQL RLS
      |
      v
Authorized Messages
      |
      v
Gemini
      |
      v
Answer
      |
      v
Citations
```

This is important for security.

Gemini only receives the context selected by the application after database authorization.

---

## 13. Embeddings

Messages can have embeddings.

An embedding is a numeric representation of text.

Example:

```text
Message
   |
   v
Gemini Embedding Model
   |
   v
Vector
   |
   v
PostgreSQL pgvector
```

When the user asks a question, the application creates another embedding.

Then pgvector compares the question with the stored message embeddings.

This helps find messages with similar meaning.

---

## 14. AI Security

Retrieved messages are treated as data, not as system instructions.

The AI must not use retrieved messages to change its main rules.

The Copilot should:

- use only authorized context
- not reveal tokens
- not reveal passwords
- not reveal secrets
- not invent information
- say when there is not enough information

This also helps reduce prompt injection risks.

---

## 15. Copilot Citations

The Copilot can return citations.

A citation contains information such as:

```json
{
  "messageId": "...",
  "channelId": "...",
  "similarity": 0.69
}
```

This helps show which messages were used for the answer.

---

## 16. Internationalization

Riwi Chat supports:

- Spanish
- English

The frontend uses a translation object.

The user can select:

```text
ES
EN
```

Main interface texts change with the selected language.

---

## 17. Responsive Design

The application is responsive.

On a desktop, the dashboard can show:

```text
Conversations | Chat | AI Copilot
```

On smaller screens, the layout changes to fit the available space.

Tailwind CSS is used for responsive styles.

---

## 18. Docker Architecture

Docker Compose runs two main services:

```text
Docker Compose
│
├── rw_app
│     └── Next.js
│
└── rw_postgres
      └── PostgreSQL + pgvector
```

The application uses:

```text
postgres:5432
```

inside Docker.

From the host machine PostgreSQL is available at:

```text
localhost:5433
```

Next.js is available at:

```text
localhost:3000
```

---

## 19. Security Summary

Riwi Chat uses different security layers.

```text
User
 |
 v
JWT Authentication
 |
 v
Next.js API
 |
 v
Database Transaction
 |
 v
PostgreSQL RLS
 |
 v
Authorized Data
```

For AI:

```text
Question
 |
 v
Embedding
 |
 v
Vector Search
 |
 v
RLS
 |
 v
Authorized Context
 |
 v
Gemini
```

The main idea is simple:

**The application checks authorization before data is sent to the AI.**

---

## 20. Future Improvements

Possible future improvements are:

- WebSockets for real-time messages
- better automated tests
- more languages
- better monitoring
- production deployment
- better AI usage metrics
- more Copilot features

---

## Author

**Daniel Perez**

Software Developer

RIWI Employability Assessment
