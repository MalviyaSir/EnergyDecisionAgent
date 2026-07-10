# ⚡ AI Building Energy Decision Agent

> **An Agentic AI-powered platform for intelligent building energy monitoring, optimization, and decision support.**

![Status](https://img.shields.io/badge/Status-Completed-success)
![Python](https://img.shields.io/badge/Python-FastAPI-blue)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![License](https://img.shields.io/badge/License-Hackathon-orange)

---

# 📖 Overview

The **AI Building Energy Decision Agent** is an intelligent energy optimization platform developed as part of the **LTTS Hackathon**.

The application continuously monitors building energy usage, identifies inefficiencies, analyzes the causes using AI, estimates savings, and recommends optimization strategies to improve operational efficiency while reducing energy consumption.

The platform combines real-time monitoring, Agentic AI reasoning, interactive AI consultation, and intelligent recommendations into a single dashboard.

---

# ✨ Features

## 📊 Live Energy Dashboard

* Real-time energy monitoring
* Live meter simulation
* Building energy KPIs
* Dynamic charts and visualizations
* Historical energy trends

---

## 👀 Observation Engine

Automatically detects:

* High energy consumption
* Sudden power spikes
* Energy wastage
* Idle equipment
* Abnormal consumption patterns
* Unusual operating conditions

---

## 🧠 Reasoning Engine

Analyzes detected observations and identifies:

* Root causes
* Severity level
* Confidence score
* Business impact
* Priority of issues

---

## 💡 Recommendation Engine

Provides AI-generated recommendations such as:

* HVAC optimization
* Lighting optimization
* Peak demand reduction
* Equipment scheduling
* Idle device shutdown
* Load balancing
* Operational improvements

---

## 💰 Savings & ROI Engine

Estimates:

* Energy Savings
* Monthly Savings
* Annual Savings
* Carbon Emission Reduction
* Return on Investment (ROI)

---

## 🤖 AI Building Energy Consultant

Interactive AI assistant capable of:

* Answering energy-related questions
* Explaining recommendations
* Explaining observations
* Suggesting optimization strategies
* Helping building managers make better decisions

---

## 🔮 What-if Simulation

Allows users to simulate different optimization scenarios before implementation.

Example simulations:

* Reduce HVAC runtime
* Shift energy loads
* Turn off idle equipment
* Change operating schedules

The AI predicts:

* Expected energy savings
* Cost reduction
* Carbon reduction
* ROI impact

---

# 🏗️ System Architecture

```text
                    React Frontend
                           │
                           │ REST APIs
                           ▼
                    FastAPI Backend
                           │
      ┌────────────┬────────────┬─────────────┐
      │            │            │             │
 Observation   Reasoning   Recommendation   AI Consultant
   Engine        Engine        Engine       (LLM)
      │            │            │
      └────────────┴────────────┘
                  │
          Savings & ROI Engine
                  │
        Live Dashboard Updates
```

---

# 🛠️ Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### Backend

* FastAPI
* Python
* Pydantic

### Artificial Intelligence

* Agentic AI
* GPT Models
* Prompt Engineering

### APIs

* REST APIs
* Live Energy Simulation

---

# 📂 Project Structure

```text
EnergyDecisionAgent/

├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore
```

---

# 🚀 Installation

## Clone the Repository

```bash
git clone https://github.com/MalviyaSir/EnergyDecisionAgent.git
```

Move into the project folder:

```bash
cd EnergyDecisionAgent
```

---

# ⚙️ Backend Setup

Open a terminal.

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If your project uses environment variables, create a `.env` file and add the required values.

Start the backend server:

```bash
uvicorn app.main:app --reload
```

The FastAPI backend will start successfully.

---

# 💻 Frontend Setup

Open another terminal.

Navigate to the frontend folder:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local development URL, typically:

```text
http://localhost:5173
```

Open it in your browser.

---

# ▶️ Running the Project

### Terminal 1

```bash
cd backend

uvicorn app.main:app --reload
```

### Terminal 2

```bash
cd frontend

npm run dev
```

The application will be available in your browser after both backend and frontend are running.

---

# 🔄 Application Workflow

1. Live energy data is generated through the simulator.
2. The Observation Engine continuously monitors the readings.
3. The Reasoning Engine identifies the root causes of inefficiencies.
4. The Recommendation Engine generates intelligent optimization suggestions.
5. The Savings & ROI Engine estimates potential savings.
6. The AI Consultant answers user questions and explains recommendations.
7. The dashboard updates dynamically with the latest information.

---

# 📦 Prerequisites

Before running the project, ensure the following are installed:

* Python 3.10+
* Node.js 18+
* npm
* Git

---

# 🌟 Future Enhancements

* IoT Sensor Integration
* Building Management System (BMS) Integration
* Predictive Maintenance
* Renewable Energy Optimization
* Multi-Building Support
* Mobile Application
* Predictive Energy Forecasting
* Automated Energy Scheduling

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new feature branch.
3. Commit your changes.
4. Push the branch.
5. Open a Pull Request.

---

# 👨‍💻 Project Owner

**Vaibhav Malviya**

**GitHub Repository**

https://github.com/MalviyaSir/EnergyDecisionAgent

Developed as part of the **LTTS Hackathon** to demonstrate the application of Agentic AI in intelligent building energy optimization and decision support.

---

# 📜 License

This project is intended for educational, research, demonstration, and hackathon purposes.

---

## ⭐ Support

If you found this project useful, consider giving the repository a ⭐ on GitHub.
