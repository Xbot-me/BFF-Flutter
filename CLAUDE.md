@AGENTS.md
# 🛑 Context Restrictions & Scope

**CRITICAL INSTRUCTION:** 
For all queries, analysis, and code generation, you must **strictly limit your scope** to the following directories:
1. `app/api/` (API routes and backend controllers)
2. `lib/` (Core services, providers, mappers, and utilities)

**Rules of Engagement:**
- **DO NOT** read, reference, edit, or suggest changes to any files outside of these two directories.
- **IGNORE** UI components, pages, global CSS, public assets, or configuration files (unless explicitly asked to modify an environment variable related to the backend).
- If a user request requires modifying the frontend or files outside of `app/api` or `lib/`, you must refuse that part of the request and state: *"I am restricted to backend logic in the app/api and lib folders."*
- Assume all UI and frontend state management is handled by a separate team or context. Focus purely on data fetching, business logic, integrations, and API responses.