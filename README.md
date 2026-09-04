# Garage Fire Department Brief

A live-research tool that turns a Google Place ID into a concise, source-linked pre-call brief for Garage account executives.

## What it does

- Resolves department identity and contact details through Google Places
- Searches public department pages for leadership and apparatus
- Checks FEMA firefighter-assistance awards
- Finds recent public activity and turns useful findings into call prompts
- Links every displayed claim to its source
- Exports the brief as a one-page PDF
- Shows research gaps explicitly instead of guessing

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add `GOOGLE_PLACES_API_KEY` and `OPENAI_API_KEY`.
3. Run `npm run dev` and open `http://localhost:3000`.

The Google project must have the Places API enabled. Keep both API keys server-side and restrict the Google key to the Places API before deployment.

## Verification

```bash
npm run lint
npm run build
```

Test Place IDs: `ChIJpcN7ecgAyIkRrOcWzZx3Yyc` and `ChIJr-yREGP9tEwRr7M-F00PpM8`.

## Research approach

The app favors attributable public evidence over completeness. Sparse departments may return an incomplete brief; those gaps remain visible and do not prevent PDF export. Web results change over time, so the interface includes a generation timestamp and reminds users to verify sources.
