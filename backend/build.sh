#!/usr/bin/env bash
# Render build script for EduQuiz AI Backend
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations against the production Supabase DB
python -m alembic upgrade head

# Seed AI prompts (idempotent — only inserts if missing)
python scripts/seed_prompts.py
