# TransitOps

**Smart Transport Operations Platform**

*Odoo Hackathon 2026*

---

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

---

## Overview

**TransitOps** is a Smart Transport Operations Platform designed to streamline and modernize public and private transit management. It provides real-time visibility, efficient scheduling, and operational insights to optimize transport networks end-to-end.

---

## Team

| Name | Role |
|------|------|
| Bishnu Prasad Sahu | Developer |
| Deepika Tandulkar | Developer |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React |
| Backend | FastAPI |
| Database | PostgreSQL |

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 14

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Database Setup

```bash
psql -U postgres -c "CREATE DATABASE transitops;"
```

---

## Project Structure

```
TransitOps/
├── frontend/               # React application
├── backend/                # FastAPI application
│   ├── main.py
│   ├── routers/
│   ├── models/
│   └── requirements.txt
├── docs/                   # Documentation
└── README.md
```

---

## License

Built for **Odoo Hackathon 2026**. All rights reserved.
