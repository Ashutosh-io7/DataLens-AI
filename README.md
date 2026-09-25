# DataLens AI

> **Autonomous Conversational Data Analytics & Machine Learning Platform**  
> Talk to your data like a senior analyst. Zero hallucination, deterministic pandas execution, explainable ML with XGBoost & SHAP, interactive visualizations, and multi-user workspaces.

---

## Highlights & Capabilities

- **Zero-Hallucination Analytics:** The LLM (Gemini) generates query execution plans, but **all mathematical calculations are executed deterministically by Pandas** in Python. No fabricated numbers.
- **AST Security Sandbox:** Strict Abstract Syntax Tree (AST) allowlist ensures that only approved pandas methods can execute. Dangerous operations (`os`, `eval`, `exec`, file writing, memory inspection) are blocked before runtime, backed by hard timeout deadlines.
- **Explainable Machine Learning:** Automated feature importance and SHAP TreeExplainer charts alongside classical statistical tests (distributions, correlations, regressions).
- **Interactive Data Grid & Schema Explorer:** Live column search, sorting, pagination, missing value profiling, and data quality scoring for uploaded CSV and Excel files.
- **Visualizations (Charts):** Auto-adaptive Recharts (Bar, Horizontal Bar, Line, Histogram, Scatter, Pie) with instant type filtering, dataset filtering, search, and one-click bookmarking.
- **Saved Insights Library:** Persistent local and server bookmarking of critical findings with rich text formatting and one-click clipboard copying.
- **User Authentication:** Multi-user workspaces backed by PostgreSQL, Bcrypt password hashing, and JWT bearer tokens.
- **Automated Test Suite:** 42 comprehensive unit, integration, and security tests run via `pytest`.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite Frontend                    │
│   (AppShell, Interactive Data Grid, Recharts, Auth Context) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│   (/api/auth, /api/datasets, /api/datasets/{id}/query)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
  ┌─────────────────────────┐    ┌─────────────────────────┐
  │   LangChain + Gemini    │    │   PostgreSQL Database   │
  │  Structured Plan Output │    │ (Users, Datasets, Conv) │
  └────────────┬────────────┘    └─────────────────────────┘
               │
               ▼
  ┌────────────────────────────────────────────────────────┐
  │              AST Security Allowlist Sandbox            │
  │     (Blocks imports, dunders, evals, filesystem I/O)   │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │         Deterministic Execution & ML Engine            │
  │    (Pandas Aggregation, XGBoost, SHAP Explanations)    │
  └────────────────────────────┬───────────────────────────┘
                               │
                               ▼
  ┌────────────────────────────────────────────────────────┐
  │       Structured JSON Payload with Recharts Data       │
  └────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v7 |
| **Backend** | FastAPI, Python 3.10+, Uvicorn, Pydantic v2 |
| **Data & ML** | Pandas, NumPy, Scikit-learn, XGBoost, SHAP, OpenPyXL |
| **Database & ORM** | PostgreSQL, SQLAlchemy, Psycopg2 |
| **AI / LLM** | Google Gemini API (`gemini-3.6-flash`), LangChain Structured Output |
| **Security & Auth** | Bcrypt (12 rounds), Python-Jose (JWT), AST Sandbox |
| **Testing** | Pytest, FastAPI TestClient |

---

## Project Structure

```text
DataLens-AI/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, Database engine, Security (JWT/Bcrypt)
│   │   ├── models/         # SQLAlchemy models (User, Dataset, Conversation)
│   │   ├── routes/         # FastAPI endpoints (auth, datasets, query, charts)
│   │   └── services/       # Code executor, Sandbox, ML, Analytics, LLM planner
│   ├── tests/              # 42 Automated pytest test cases
│   ├── requirements.txt    # Python backend dependencies
│   ├── .env.example        # Backend environment template
│   └── main.py             # FastAPI entrypoint
├── src/
│   ├── components/         # AppShell, AppSidebar, DatasetWorkspace, AnalysisChart
│   ├── context/            # AuthContext (JWT session state)
│   ├── pages/              # LandingPage, LoginPage, SignupPage
│   ├── utils/              # Insights storage, helpers
│   └── api.js              # Centralized API client & endpoint map
├── public/                 # Static assets
├── vercel.json             # SPA routing rewrite configuration for Vercel
├── package.json            # Node.js frontend dependencies
└── README.md
```

---

## Local Setup & Installation

### Prerequisites
Make sure you have installed on your machine:
- **Node.js** (v18.0 or higher) & `npm`
- **Python** (v3.10 to v3.14) & `pip`
- **PostgreSQL** running locally (or a remote PostgreSQL database)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ashutosh-io7/DataLens-AI.git
cd DataLens-AI
```

---

### Step 2: Backend Setup

1. **Navigate to the backend folder and create a virtual environment:**
   ```powershell
   cd backend
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

3. **Install backend dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/datalens_ai
   GEMINI_API_KEY=your_gemini_api_key_here
   SECRET_KEY=your_generated_random_secret_key_here
   ```

5. **Start the FastAPI backend server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The API will be live at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

---

### Step 3: Frontend Setup

1. **Open a new terminal window at the project root (`DataLens-AI`):**
   ```bash
   npm install
   ```

2. **Configure frontend environment variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```

3. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## Running the Automated Test Suite

DataLens AI includes 42 automated tests covering the security sandbox, JWT cryptography, Recharts payload formatting, and API routes.

Run the test suite from the `backend/` directory:
```bash
# From DataLens-AI/backend (with venv activated)
pytest -v tests
```

Expected result:
```text
======================= 42 passed in 2.76s =======================
```

---

## API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access token | No |
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile | **Yes** |
| `GET` | `/api/datasets/health` | Inspect DB connection & LLM configuration status | No |
| `GET` | `/api/datasets` | List all uploaded datasets | No |
| `POST` | `/api/datasets/upload` | Upload CSV or Excel dataset with profiling | No |
| `GET` | `/api/datasets/{id}` | Retrieve dataset details, summary, and schema | No |
| `DELETE`| `/api/datasets/{id}` | Delete dataset and its associated conversations | No |
| `POST` | `/api/datasets/{id}/query`| Query dataset via AI Analyst | No |
| `GET` | `/api/datasets/charts` | Retrieve all AI-generated charts across datasets | No |
| `GET` | `/api/datasets/{id}/conversation` | Retrieve dataset chat history | No |
| `DELETE`| `/api/datasets/{id}/conversation`| Reset dataset chat history | No |

---

## License

This project is licensed under the MIT License.
