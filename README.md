# MITRA — Employability & Assessment Platform

MITRA is an end-to-end employability assessment and training platform designed for institutions and colleges. It bridges student learning with placement readiness through diagnostic assessments, psychometric evaluations, AI-assisted question generation, and custom Excel reporting for recruitment drives.

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Backend**: Node.js, Express.js, MongoDB / Mongoose, ExcelJS, JWT, Nodemailer, Resend
- **AI Integrations**: Google Gemini, Groq, Hugging Face

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # UI Components (DataTable, Toast, Card, etc.)
│   │   ├── layouts/        # Admin, Student, Public layouts
│   │   ├── pages/          # Admin, Student, Public, Auth pages
│   │   └── services/       # API integration client
└── server/                 # Express backend API
    ├── middleware/         # Auth, Role, Error middleware
    ├── modules/            # Auth, Students, Assessments, AI, Reports
    └── utils/              # Emailer, Seeds, Validators
```

## 🛠️ Getting Started

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Configure your MongoDB URI, JWT_SECRET, and API keys in .env
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.
