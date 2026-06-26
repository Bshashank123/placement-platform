# Placement Platform

A scalable resume parsing and placement platform for colleges, built with FastAPI (Backend) and Next.js (Frontend).

## Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **PostgreSQL**: v15 or higher (If running manually without Docker)
- **Docker & Docker Compose** (Optional, but recommended for easy setup)

---

## Method 1: Quick Start with Docker (Recommended)

The easiest way to get the entire stack (Database, Backend API, Frontend) running is via Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Bshashank123/placement-platform.git
   cd placement-platform
   ```

2. **Start the containers:**
   ```bash
   docker-compose up --build -d
   ```

3. **Initialize the database (Run migrations & seed script):**
   ```bash
   docker exec -it placement-backend alembic upgrade head
   docker exec -it placement-backend python scripts/seed.py
   ```

4. **Access the application:**
   - **Frontend:** http://localhost:3000
   - **Backend API Docs:** http://localhost:8000/docs
   
   *(Note: The seed script will create some default accounts. Check the backend logs or `seed.py` for demo credentials).*

---

## Method 2: Manual Local Setup

If you prefer to run the application locally without Docker, follow these steps.

### 1. Set up the PostgreSQL Database
Make sure PostgreSQL is running on your machine, then create the database:
```sql
CREATE DATABASE placement_platform;
```

### 2. Set up the Backend (FastAPI)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # Mac/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   Copy `.env.example` to `.env` and adjust the `DATABASE_URL` if your PostgreSQL username/password is different.
   ```bash
   cp .env.example .env
   ```

5. Run database migrations and seed default data:
   ```bash
   alembic upgrade head
   python scripts/seed.py
   ```

6. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will now be running at http://localhost:8000.

### 3. Set up the Frontend (Next.js)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install the Node modules:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   Copy `.env.example` to `.env.local` to configure the API URL.
   ```bash
   cp .env.example .env.local
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend UI will now be running at http://localhost:3000.

---

## Troubleshooting
- **Database Connection Errors:** Ensure your PostgreSQL server is running and the credentials in `backend/.env` match your local DB setup.
- **CORS Errors:** Make sure `FRONTEND_URL` in `backend/.env` matches exactly where your frontend is running (e.g., `http://localhost:3000` without a trailing slash).
- **Missing Files:** The repository ignores `.env` files and `node_modules` by design. Always make sure to duplicate the `.env.example` files and run `npm install`.
