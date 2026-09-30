# DataLens AI

> **Autonomous Conversational Data Analytics & Machine Learning Platform**  
> Talk to your data like a senior analyst. Zero hallucination, deterministic pandas execution, multi-model AutoML suite with competitive leaderboards, self-healing query auto-repair, and interactive visualizations.

---

## Highlights & Capabilities

- **Zero-Hallucination Two-Stage AI Analyst:** Gemini generates query execution plans, but **all mathematical operations are executed deterministically by Pandas in Python**. Once verified, Stage 2 synthesizes a senior analyst narrative with bold key metrics and business takeaways—strictly grounded on the computed facts with zero invented numbers.
- **Self-Healing Query Auto-Repair:** If an out-of-the-box query snippet encounters a syntax error or column casing mismatch (e.g. `fuel_type` vs `Fuel_Type`), the engine automatically feeds the error and dataset schema back to Gemini to auto-repair and re-execute seamlessly.
- **Smart Two-Tier Query Routing:** Well-known deterministic operations (row/column counts, duplicates, filters, distributions, correlations, summary statistics) run instantly via the local rule-based planner with **zero LLM latency and zero API cost**. The system escalates to Gemini only for complex, out-of-the-box analytical questions.
- **Multi-Model AutoML Suite & Leaderboard:** Automatically detects whether a problem is **Regression** or **Classification**. Trains and evaluates a competitive suite of algorithms on an 80/20 holdout test split:
  - **Regression:** Linear Regression (OLS), Ridge Regression (L2), Random Forest Regressor, XGBoost Regressor ($R^2$, RMSE, MAE).
  - **Classification:** Logistic Regression, Random Forest Classifier, K-Nearest Neighbors (KNN), XGBoost Classifier (Accuracy, F1-Score).
  - Generates a sorted competitive leaderboard, auto-selects the champion model (or honors user algorithm preferences), and provides game-theoretic feature importance via **SHAP TreeExplainer** and normalized coefficients.
- **AST Security Sandbox:** Strict Abstract Syntax Tree (AST) allowlist ensures only approved pandas and numpy methods can execute. Dangerous operations (`os`, `eval`, `exec`, file writing, network calls, dunder inspection) are blocked before runtime, backed by a hard timeout.
- **Interactive Data Grid & Schema Explorer:** Live column search, sorting, pagination, missing value profiling, and data quality scoring for uploaded CSV and Excel files.
- **Visualizations (Charts):** Auto-adaptive Recharts (Bar, Horizontal Bar, Line, Histogram, Scatter, Pie) with instant type filtering, dataset filtering, search, and one-click bookmarking.
- **Saved Insights Library:** Persistent local and server bookmarking of critical findings with rich text formatting and one-click clipboard copying.
- **Per-User Isolation & Authentication:** Multi-user workspaces backed by PostgreSQL, Bcrypt password hashing, and JWT bearer tokens. Every dataset, conversation, and insight is strictly scoped to its owning user.
- **Automated Test Suite:** 49 comprehensive unit, integration, and security tests with 100% pass rate run via `pytest`.

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                 React 19 + Vite Frontend                    │
│   (AppShell, Interactive Data Grid, Recharts, Auth Context) │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (JWT Authenticated)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                        │
│   (/api/auth, /api/datasets, /api/datasets/{id}/query)      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
  ┌─────────────────────────┐    ┌─────────────────────────┐
  │   Smart Two-Tier Router │    │   PostgreSQL Database   │
  │   (Rule-Based Planner)  │    │ (Users, Datasets, Conv) │
  └────────────┬────────────┘    └─────────────────────────┘
               │
        ┌──────┴──────────────────────────┐
        │ Known Deterministic Intent?     │
        ├─────────────────┬───────────────┤
        │ YES             │ NO (Complex)  │
        ▼                 ▼               ▼
  [Fast Local Exec]  [Gemini Structured Plan]
                          │
                          ▼
             ┌─────────────────────────┐
             │  AST Security Sandbox   │
             │ (Default-Deny Allowlist)│
             └────────────┬────────────┘
                          │
                          ▼
             ┌─────────────────────────┐
             │ Deterministic Pandas    │
             │ & Multi-Model AutoML    │
             └────────────┬────────────┘
                          │ (If error -> Auto-Repair)
                          ▼
             ┌─────────────────────────┐
             │ Stage 2: Senior Analyst │
             │ Explanation Synthesis   │
             └────────────┬────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│     Structured JSON Payload + Recharts Visualizations       │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, React Router v7 |
| **Backend** | FastAPI, Python 3.10+, Uvicorn, Pydantic v2 |
| **Data & ML** | Pandas, NumPy, Scikit-learn, XGBoost, SHAP, OpenPyXL |
| **Database & ORM** | PostgreSQL, SQLAlchemy, Psycopg2 / Psycopg binary |
| **AI / LLM** | Google Gemini API (`gemini-3.6-flash`), LangChain Structured Output |
| **Security & Auth** | Bcrypt (12 rounds), Python-Jose (JWT), AST Sandbox |
| **Testing** | Pytest, FastAPI TestClient (49 automated tests) |

---

## Project Structure

```text
DataLens-AI/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, Database engine, Security (JWT/Bcrypt)
│   │   ├── models/         # SQLAlchemy models (User, Dataset, Conversation, Message)
│   │   ├── routes/         # FastAPI endpoints (auth, datasets, query, charts)
│   │   └── services/       # Code executor, Sandbox, ML, Analytics, LLM planner
│   ├── tests/              # 49 Automated pytest test cases
│   ├── requirements.txt    # Python backend dependencies
│   ├── .env.example        # Backend environment template
│   └── main.py             # FastAPI entrypoint (with 0.0.0.0 & dynamic PORT binding)
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
- **PostgreSQL** running locally (or a remote PostgreSQL connection URL)

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
   GOOGLE_API_KEY=your_gemini_api_key_here
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

## Deploying Frontend on Vercel

To deploy the frontend to Vercel:

1. Import the repository into your [Vercel Dashboard](https://vercel.com).
2. Set the **Framework Preset** to **Vite**.
3. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com` (your deployed backend URL)
4. Deploy! The included `vercel.json` handles Single Page Application (SPA) client-side routing automatically.

---

## Running the Automated Test Suite

DataLens AI includes **49 automated tests** covering the AST security sandbox, multi-model AutoML, JWT authentication, and analytical query execution.

Run the test suite from the `backend/` directory:
```bash
pytest -v tests
```

Expected result:
```text
======================= 49 passed in 3.68s =======================
```

---

## API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT access token | No |
| `GET` | `/api/auth/me` | Retrieve current authenticated user profile | **Yes** |
| `GET` | `/api/datasets/health` | Inspect DB connection & LLM configuration status | No |
| `GET` | `/api/datasets` | List all datasets owned by the logged-in user | **Yes** |
| `POST` | `/api/datasets/upload` | Upload CSV or Excel dataset with profiling | **Yes** |
| `GET` | `/api/datasets/{id}` | Retrieve dataset details, summary, and schema | **Yes** |
| `DELETE`| `/api/datasets/{id}` | Delete dataset and its associated conversations | **Yes** |
| `POST` | `/api/datasets/{id}/query`| Query dataset via AI Analyst (AutoML / Analytics) | **Yes** |
| `GET` | `/api/datasets/charts` | Retrieve all user-generated charts across datasets | **Yes** |
| `GET` | `/api/datasets/{id}/conversation` | Retrieve dataset chat history | **Yes** |
| `DELETE`| `/api/datasets/{id}/conversation`| Reset dataset chat history | **Yes** |

---

## License

This project is licensed under the MIT License.
