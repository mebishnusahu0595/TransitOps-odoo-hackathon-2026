# 🚌 TransitOps

> **Smart Transport Operations Platform** — Odoo Hackathon 2026

---

## 👥 Team Members

| Name | Role |
|------|------|
| Bishnu Prasad Sahu | Developer |
| Deepika Tandulkar | Developer |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React |
| Backend | FastAPI |
| Database | PostgreSQL |

---

## 📋 Problem Statement

**TransitOps** is a Smart Transport Operations Platform designed to streamline and modernize public and private transit management. It provides real-time visibility, efficient scheduling, and operational insights to optimize transport networks.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 14

### Installation

#### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

#### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE transitops;"
```

---

## 📁 Project Structure

```
TransitOps/
├── frontend/          # React application
├── backend/           # FastAPI application
│   ├── main.py
│   ├── routers/
│   ├── models/
│   └── requirements.txt
├── docs/              # Documentation
└── README.md
```

---

## 📄 License

This project was built for the **Odoo Hackathon 2026**.
