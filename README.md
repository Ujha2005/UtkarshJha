# CareGraph

**Your Medical History, Connected.**

CareGraph is a privacy-conscious longitudinal health-record platform that converts a patient's medical records into a structured health graph and timeline. It provides intelligent symptom analysis with evidence-based reasoning while maintaining strict safety guardrails.

## ⚕️ Important Disclaimers

- **All patient data is synthetic** — created for demonstration purposes only.
- This application does **not** provide medical diagnoses.
- All AI-generated insights are framed as **informational decision-support content**.
- Users should always consult qualified healthcare professionals.

## Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Patient overview with conditions, medications, allergies, and health metrics |
| **Health Graph** | Interactive visual graph connecting patients, conditions, medications, tests, and doctors |
| **Timeline** | Chronological view of all medical events |
| **Lab Trends** | Historical lab parameter trends with reference ranges |
| **Medications** | Complete medication list with relationships |
| **Symptom Analysis** | New symptom → relevant history → evidence → safety check → response |
| **Nutrition Journal** | Daily food tracking with estimated nutritional breakdown |
| **Doctor Mode** | Clinician-oriented patient summary with consent simulation |
| **Senior Mode** | Simplified UI with large buttons and plain language |
| **Report Upload** | Simulated report upload and extraction flow |

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — fast build tooling
- **Tailwind CSS** — utility-first styling
- **Recharts** — data visualization
- **React Force Graph** — interactive health graph
- **Lucide React** — icon library
- **React Router** — client-side routing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   └── layout/       # App shell, sidebar, navigation
├── data/             # Centralized synthetic demo data
├── pages/            # Page-level route components
├── types/            # TypeScript interfaces
└── main.tsx          # Application entry point
```

## Architecture Principles

1. **Modular AI Engine** — Health reasoning is abstracted so a real LLM/API can be connected later
2. **Evidence Model** — Every AI-generated claim references source, date, and record
3. **Safety First** — Contradiction and safety checks before any response
4. **Centralized Data** — Single source of truth for demo data, no duplication
5. **Clean Types** — Comprehensive TypeScript interfaces for all health entities

## License

This project is developed for demonstration and hackathon purposes.
