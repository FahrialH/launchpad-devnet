# AGENTS.md — Workspace Context for solana-private-sale-launchpad

This document provides automated workspace context for AI coding engines (**Antigravity CLI** and **OpenCode CLI**).

---

## 🚀 Overview

- **Project Name**: `solana-private-sale-launchpad`
- **Location**: `/home/wan/sc/evgo/tokens-page`
- **Tech Stack**: React, TypeScript, Vite, Node.js

---

## 📁 Key Directories

- `dist/`
- `src/`
- `supabase/`

---

## ⚡ Scripts & Commands

- `npm run dev`: `vite`
- `npm run build`: `tsc && vite build`
- `npm run lint`: `eslint .`
- `npm run preview`: `vite preview`

---

## 🤖 Dual AI Engine Guidelines

When using **Satya Lab** with **Antigravity CLI (`agy`)** or **OpenCode CLI (`opencode`):
1. **Context Document Workflow**:
   - Before making complex or multi-file edits, create or update `.satya/context/implementation_plan.md`.
   - After completing edits, record changes in `.satya/context/walkthrough.md`.
   - Session history and git snapshots are tracked in `.satya/context/session_history.md`.
2. Keep edits aligned with existing project conventions and dependencies.
3. Verify changes using project build or test commands.
4. **Mandatory Documentation Update Rule**: Whenever you create, modify, add, or delete repository files, you MUST review and update `AGENTS.md` if project structure, tech stack, components, or commands have changed.
