# 🐴 Horse Index – Retirement Home for Horses  
### Code for Change 2026

Horse Index is a web application built for Code for Change 2026 to support Retirement Home for Horses, Inc., a non-profit equine sanctuary located in Alachua, Florida.

The organization currently relies on a paper-based filing system to manage medical records, feeding plans, and daily care for over 100 horses. This system is slow, difficult to search, and not accessible on mobile devices. Horse Index replaces this process with a fast, digital, and mobile-friendly platform that allows volunteers to spend less time on paperwork and more time caring for horses.

---

## Problem Statement

Volunteers at the Retirement Home for Horses manage critical information using physical folders, including medical treatments, medications, feeding schedules, vet and farrier visits, behavioral notes, and safety instructions. As the number of horses grows, this system becomes increasingly inefficient, error-prone, and hard to scale. Accessing information quickly in the field is especially challenging.

---

## Our Solution

Horse Index provides a centralized digital system that allows volunteers and staff to quickly search, view, and update horse information from any device. The application supports detailed horse profiles, action logging, and an audit trail to ensure accuracy and accountability, while remaining simple and intuitive for everyday use.

---

## Features (MVP)

- Horse library with search and filtering
- Individual horse profiles with medical, behavioral, and feeding information
- Action logging for treatments, medications, and daily care
- Role-based access control (Admin, Editor, Viewer)
- Audit trail showing who made changes and when
- Mobile-friendly interface for use in the field

---

## Tech Stack

Frontend:
- React
- TypeScript
- CSS

Backend:
- Python
- FastAPI
- Uvicorn

---

## Project Structure

horse-index/
├── frontend/  
│   └── react-app/  
├── backend/  
│   ├── main.py  
│   └── venv/  
└── README.md  

---

## Getting Started (Local Development)

Backend setup:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn
uvicorn main:app --reload


