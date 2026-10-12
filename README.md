# SVO HelpDesk Mini — Multi-Business Ticketing Application

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack React Query |
| **Backend** | Python 3.12, FastAPI, Uvicorn |
| **Database** | PostgreSQL 16 |
| **ORM & Migrations** | SQLAlchemy 2.0 + Alembic |
| **Auth & Security** | PyJWT + `argon2-cffi` |
| **Real-time** | FastAPI Native WebSocket |

---

## 🚀 Getting Started from Scratch

You can run this project in **2 ways**: using **Docker Compose ** or **Manually (Local Development)**.

### Option 1: Run with Docker Compose

Make sure **Docker Desktop** is running, then execute the following commands from the project *root* directory:

```bash
# 1. Copy the example environment file (optional, docker-compose already includes fallback defaults)
cp .env.example .env

# 2. Build and start the database, backend (auto-migrates + seeds data), and frontend
docker compose up --build
```

Once all three containers are running:
- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

*(The `backend` container automatically runs `alembic upgrade head` and `python seed.py` on startup).*

---

### Option 2: Run Manually (Local Development)

#### 1. Start the PostgreSQL Database
```bash
cp .env.example .env
docker compose up -d db
```

#### 2. Setup & Run Backend (FastAPI)
Open a terminal in the `backend/` folder:

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux / Git Bash:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy backend environment configuration
cp .env.example .env

# Run Alembic database migrations
alembic upgrade head

# Run seed script (creates 2 businesses & 8 demo accounts)
python seed.py

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

#### 3. Setup & Run Frontend (Next.js)
Open a new terminal in the `frontend/` folder:

```bash
cd frontend

# Copy frontend environment configuration
cp .env.example .env.local

# Install dependencies and start development server
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

`.env.example` files are provided in the *root*, `backend/.env.example`, and `frontend/.env.example`.

| Variable | Location | Example / Default Value | Description |
|---|---|---|---|
| `POSTGRES_USER` | Root `.env` | `helpdesk` | PostgreSQL database username |
| `POSTGRES_PASSWORD` | Root `.env` | `change-me` | PostgreSQL database password |
| `POSTGRES_DB` | Root `.env` | `helpdesk` | PostgreSQL database name |
| `DATABASE_URL` | `backend/.env` | `postgresql+psycopg://helpdesk:change-me@127.0.0.1:5432/helpdesk` | SQLAlchemy connection string to PostgreSQL |
| `SECRET_KEY` | `backend/.env` | `change-me-in-production-secret-key-32chars` | Secret key for signing JWT tokens (HS256) |
| `ACCESS_TOKEN_MINUTES` | `backend/.env` | `15` | Access token lifetime in minutes |
| `REFRESH_TOKEN_DAYS` | `backend/.env` | `7` | Refresh token lifetime in days |
| `CORS_ORIGINS` | `backend/.env` | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated list of allowed frontend CORS origins |
| `NEXT_PUBLIC_API_BASE_URL` | `frontend/.env.local` | `http://localhost:8000` | Base URL for backend REST API & WebSocket |

---

## 👥 Demo Accounts (`seed.py`)

Running `python seed.py` (or starting Docker Compose) seeds **2 businesses** with the following **8 demo accounts**.

🔑 **Password for all demo accounts:** `Password123!`

| Business | Role | Email | Main Permissions |
|---|---|---|---|
| **Acme Store** | `admin` | `admin@acme-demo.com` | Manage Acme users, view all Acme tickets, assign agents, update status |
| **Acme Store** | `agent` | `agent@acme-demo.com` | View all Acme tickets, take tickets (*self-assign*), reply in chat, update status |
| **Acme Store** | `customer` | `customer1@acme-demo.com` | Create new tickets, view & chat only in their own tickets |
| **Acme Store** | `customer` | `customer2@acme-demo.com` | Create new tickets, view & chat only in their own tickets |
| **Globex Travel** | `admin` | `admin@globex-demo.com` | Manage Globex users, view all Globex tickets, assign agents, update status |
| **Globex Travel** | `agent` | `agent@globex-demo.com` | View all Globex tickets, take tickets, reply in chat, update status |
| **Globex Travel** | `customer` | `customer1@globex-demo.com` | Create new tickets, view & chat only in their own tickets |
| **Globex Travel** | `customer` | `customer2@globex-demo.com` | Create new tickets, view & chat only in their own tickets |

---

## 🧪 Running Automated Tests (`pytest`)

Automated tests verify multi-tenant isolation (Business B receives `404` when accessing Business A's tickets), customer-to-customer isolation, global email uniqueness (`409`), role guards (`401`/`403`), and password security:

```bash
cd backend
pytest -q
```

---

## 🗄️ API Endpoints

### API Endpoint Summary
| Method | Path | Role | Description |
|---|---|---|---|
| `POST` | `/auth/register-business` | Public | Register a new business + *Business Admin* account (returns tokens) |
| `POST` | `/auth/login` | Public | Log in with email & password (returns `access_token` + `refresh_token`) |
| `POST` | `/auth/refresh` | Public | Issue a new `access_token` using a valid `refresh_token` |
| `GET` | `/auth/me` | All | Get the logged-in user's profile and business info |
| `GET` | `/users` | Admin | List all users in the same business |
| `POST` | `/users` | Admin | Create a new `agent` or `customer` account in the same business |
| `GET` | `/tickets` | All | List tickets by role (supports `?status=` filter), sorted by latest activity |
| `POST` | `/tickets` | Customer | Create a new support ticket along with the initial message |
| `GET` | `/tickets/{id}` | By Access | Ticket details (returns `404` if owned by another business/customer) |
| `PATCH` | `/tickets/{id}` | By Access | Update ticket status or assignee (broadcasts changes via WebSocket) |
| `GET` | `/tickets/{id}/messages` | By Access | Retrieve chat message history for the ticket |
| `WS` | `/ws/tickets/{id}?token=…` | By Access | Real-time connection for chat messages, status updates, and typing indicator |

---

## 📝 Notes: Technical Decisions, Trade-Offs & Future Plans

### 1. Technical Decisions & Trade-Offs
- **Standardizing All Requests & Mutations with TanStack React Query (`useQuery` & `useMutation`):**
  Initially, `/login` and `/register` used manual `async/await` with separate `useState` hooks for `loading` and `error`, while ticket and admin pages used `useMutation`. Since TanStack Query was already installed, all `GET` requests were standardized to `useQuery` and all `POST`/`PATCH` actions (including auth forms) were unified to `useMutation` to removing redundant manual states and keeping cache invalidation consistent across the app.
- **Returning `404 Not Found` (Instead of `403 Forbidden`) for Multi-Tenant Isolation:**
  All ticket lookups (REST and WebSocket handshake) pass through `get_ticket_for_user()`. Accessing a ticket belonging to another business or another customer returns `404 Not Found` rather than `403` to prevent *ID probing / tenant enumeration*.
- **Denormalizing `business_id` on the `tickets` Table:**
  Storing `business_id` directly on `tickets` with a composite index `(business_id, status)` allows fast tenant-level filtering without joining the `users` table on every list query.
- **Ticket List Updates via `refetchInterval` vs Global WebSocket:**
  The `/tickets` list uses TanStack Query's silent background polling (`refetchInterval: 5000`) to keep the codebase simple without maintaining a second global WebSocket connection outside the chat room.
- **In-Memory `ConnectionManager` & `localStorage` Tokens:**
  WebSocket rooms are held in FastAPI process memory (fast and zero-config for a single instance, with a trade-off that horizontal scaling would require Redis Pub/Sub). JWTs are stored in `localStorage` so the access token can be passed in the WebSocket query string (`/ws/tickets/{id}?token=...`), as browser `WebSocket` APIs do not support custom `Authorization` headers.

### 2. Unfinished Bonus Features & Future Roadmap
From the specification's bonus list, **Full-Stack Docker Compose**, **Backend Pytest Suite**, and **Real-Time Typing Indicator** are completed. Remaining bonus items for future iterations:
- **Read Receipts & Unread Message Badges:** Track message read status and display unread counts on the ticket list.
- **Image Attachments in Chat:** Support uploading and previewing image files inside the live chat room.
- **Ticket Pagination & Search:** Add keyword search and pagination on the ticket list for large datasets.
- **Event-Driven Real-Time Ticket List Notifications:** Push instant updates to the ticket list page when new tickets or messages arrive.
- **Login Rate Limiting:** Throttle repeated login attempts per IP to protect against brute-force attacks.
- **Cloud Deployment:** Deploy the frontend to Vercel and the backend + PostgreSQL database to Render/Railway.
