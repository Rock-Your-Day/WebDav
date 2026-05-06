# Contributing to OpenWebDav

Thank you for your interest in contributing to OpenWebDav! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check existing issues to avoid duplicates
2. Use the bug report template
3. Include steps to reproduce, expected behavior, and actual behavior
4. Include your environment details (OS, Docker version, browser)

### Suggesting Features

1. Check existing issues and discussions
2. Use the feature request template
3. Describe the use case and expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`: `git checkout -b feature/your-feature`
3. Make your changes
4. Write/update tests as needed
5. Ensure all tests pass: `make test`
6. Commit with conventional commits: `feat: add new storage provider`
7. Push and create a Pull Request

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+ (with npm)
- Docker & Docker Compose
- Make (optional, for convenience commands)

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev  # Starts on port 5173
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test

# Full test suite
make test
```

### Code Style

**Backend:**
- Formatter: `ruff format`
- Linter: `ruff check`
- Type checking: `mypy`

**Frontend:**
- Formatter: Prettier
- Linter: ESLint
- Type checking: TypeScript strict mode

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style (formatting, no logic change)
- `refactor:` — Code refactoring
- `test:` — Adding/updating tests
- `chore:` — Maintenance tasks

## Project Structure

See [docs/PLAN.md](docs/PLAN.md) for the full project structure and architecture.

## Questions?

Open a Discussion on GitHub or reach out to the maintainers.
