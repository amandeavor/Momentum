# Contributing to Momentum

Thank you for contributing to Momentum.

## Development Setup

Prerequisites: Node.js 18+ and an Expo development environment.

```bash
git clone https://github.com/amandeavor/Momentum.git
cd Momentum
npm install
cp .env.example .env
npm start
```

## Quality Commands

Before opening a pull request:

```bash
npm run typecheck
npm run lint
```

## Guidelines

- Ensure UI components adapt cleanly to different mobile screen sizes and safe areas.
- Keep Supabase queries optimized and handle offline/reconnection gracefully.
- Never commit live database credentials or service keys.
