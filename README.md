# Plan B - Event Planning Assistant

## Overview

Plan B is an AI-powered event planning assistant that helps users organize weddings, birthdays, and community events with realistic budgets, timelines, vendor checklists, and personalized ideas. Unlike static planners, Plan B creates a realistic plan that instantly adapts when disruptions occur.

## Features

### Core Planning
- **Budget Engine**: Deterministic budget allocation with realism checks
- **Timeline Engine**: Critical-path scheduling backward from event date
- **Disruption Simulator**: Preset disruptions (venue cancelled, rain, budget cuts, etc.) with before/after diff
- **Vendor Checklists**: Per-category checklists with backup vendors for high-risk items
- **Personalized Ideas**: LLM-powered themes, decor, menu, and activities

### Disruption Scenarios
- Venue cancelled (requires backup venue, 50% cost increase)
- Bad weather (move indoors, 20% cost increase, 7-day delay)
- Guest count increase (30% more guests, 30% budget increase)
- Budget cut (20% reduction, timeline adjustments)
- Vendor no-show (21-day delay, 20K cost penalty)

### User Interface
- Clean, accessible React frontend with TypeScript
- Responsive design for desktop and mobile
- Tab-based navigation between planner and disruption simulator
- Real-time plan generation with Zod validation

## Architecture

```
plan-b/
├── server/              # Node.js API with Express
│   ├── src/
│   │   ├── engine/      # budget.ts, scheduler.ts, disruptions.ts
│   │   ├── llm/         # ideas.ts (LLM integration)
│   │   ├── routes/      # API endpoints
│   │   ├── validation/  # Zod schemas
│   │   └── data/        # templates
│   ├── package.json
│   └── tsconfig.json
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # EventForm, DisruptionPanel
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
├── tests/               # Unit tests
│   ├── budget.test.ts
│   ├── scheduler.test.ts
│   └── disruptions.test.ts
├── .env.example
├── .gitignore
└── README.md
```

## API Endpoints

### POST /api/plan
Generates a complete event plan
**Request Body:**
```json
{
  "eventType": "wedding",
  "eventDate": "2026-12-25",
  "city": "Mumbai",
  "guestCount": 100,
  "totalBudget": 500000,
  "theme": "Classic Elegance"
}
```

**Response:** Complete plan with budget, timeline, and personalized ideas

### POST /api/budget
Generates budget plan only
**Request Body:**
```json
{
  "eventType": "wedding",
  "guestCount": 100,
  "totalBudget": 500000
}
```

**Response:** Budget breakdown with realism checks

### POST /api/timeline
Generates timeline only
**Request Body:**
```json
{
  "eventType": "wedding",
  "eventDate": "2026-12-25",
  "guestCount": 100,
  "totalBudget": 500000
}
```

**Response:** Scheduled tasks with critical path

### POST /api/disrupt
Applies disruption and shows impact
**Request Body:**
```json
{
  "eventType": "wedding",
  "guestCount": 100,
  "totalBudget": 500000,
  "disruptionType": "venue_cancelled"
}
```

**Response:** Before/after diff with recommendations

### POST /api/ideas
Generates personalized ideas
**Request Body:**
```json
{
  "eventType": "wedding",
  "guestCount": 100,
  "totalBudget": 500000,
  "city": "Mumbai",
  "theme": "Classic Elegance"
}
```

**Response:** Themes, decor, menu, and activities

## Technology Stack

| Layer | Technology | Reason |
|-------|------------|--------|
| Frontend | React + Vite + TypeScript | Fast, component-based, typed code |
| Backend | Node.js + Express + TypeScript | Keeps API keys server-side |
| Validation | Zod | Strong input/output validation |
| Testing | Vitest | Unit tests for engines and API |
| Styling | Tailwind CSS + CSS | Accessible by design |

## Build Plan

1. **Core Engines First** (Weighted heavily)
   - Budget engine with tests
   - Timeline engine with tests
   - Disruption engine with tests

2. **API Layer**
   - Express routes with Zod validation
   - Error handling and health checks

3. **LLM Integration**
   - Gemini API integration
   - Fallback to curated templates

4. **Frontend**
   - Event form with validation
   - Plan display with tabs
   - Disruption simulator

5. **Polish**
   - README with examples
   - Environment configuration
   - Final testing

## Security

- API keys in `.env` (never in code)
- Zod validation for all inputs and outputs
- Rate limiting (to be implemented)
- Input sanitization

## Testing

All core components are tested:
- Budget allocation correctness
- Timeline critical path logic
- Disruption impact calculations
- API request/response validation

## Running Development

1. Install dependencies in both `server` and `client` directories:
   ```bash
   cd server && npm install
   cd client && npm install
   ```

2. Start the API server:
   ```bash
   cd server
   npm run dev
   ```

3. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Sample Event

Try a wedding event with these parameters:
- Event Type: Wedding
- Date: 2026-12-25 (Christmas Day)
- City: Mumbai
- Guests: 100
- Budget: ₹500,000

This will generate a comprehensive plan with venue booking, catering, photography, entertainment, and more, complete with backup vendors and disruption scenarios.

## Future Enhancements

- Multi-language support (English + Hindi)
- PDF export functionality
- Advanced AI for theme generation
- Social media integration
- Budget tracking over time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests for new functionality
5. Follow existing code style
6. Submit a pull request

Plan B aims to revolutionize event planning by providing realistic, adaptable plans that help organizers prepare for the unexpected while maintaining budget and timeline integrity.

Get-NetTCPConnection -LocalPort 3000,5173 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Output "Stopped PID $_" }; Start-Sleep -Seconds 2; $listen = Get-NetTCPConnection -LocalPort 3000,5173 -State Listen -ErrorAction SilentlyContinue; if (-not $listen) { Write-Output 'No listeners remaining on ports 3000 and 5173.' } else { $listen | Select-Object LocalPort,OwningProcess | Format-Table -AutoSize }