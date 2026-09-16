# AI Interview Assistant

A portfolio-ready technical interview simulator built with React, Bootstrap, Node.js, Express, and Google Gemini.

## Features

- Technology selection
- Beginner, Intermediate, and Advanced difficulty
- Custom number of questions
- Custom interview time limit
- Timed interview sessions
- Question generation
- Answer evaluation
- Correct, partial, and incorrect scoring
- Model answers and improvement feedback
- Interview summary
- Question-by-question review
- Persistent local interview history
- Performance dashboard
- Technology performance analytics
- Difficulty performance analytics
- Development mock AI mode
- Gemini production mode
- Backend API key protection
- Helmet security headers
- API rate limiting
- Input validation
- Health endpoint

## Local setup

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and configure the values.

Start the backend:

```bash
npm start
```

The backend uses port 5001 by default.

## Gemini mode

Keep `DEV_MODE=true` while developing without consuming Gemini quota.

For real Gemini question generation and evaluation:

```env
DEV_MODE=false
GEMINI_API_KEY=your_key
```

## Deployment

Deploy the frontend to Vercel or another Vite-compatible host.

Set:

```env
VITE_API_URL=https://your-backend-domain.example.com
```

Deploy the backend to Render, Railway, or another Node.js-compatible host.

Set:

```env
PORT=5001
DEV_MODE=false
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.6-flash
FRONTEND_URL=https://your-frontend-domain.example.com
```

Do not put `GEMINI_API_KEY` in the React frontend.

## Portfolio talking points

The project demonstrates React state management, REST APIs, asynchronous requests, client-side persistence, responsive UI, analytics, timed workflows, backend validation, API security, and external AI integration.
