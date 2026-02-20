# Git Workflow Guide

## Principles
- **Never push directly to main** - Always use PRs
- **Check diff first** - Review all changes before committing
- **Use GitHub MCP** - For branch creation and PRs

---

## Standard Workflow

### 1. Check Status & Changes
```bash
git status
git diff
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Stage & Commit
```bash
git add <files>
git diff --staged  # Review before commit
git commit -m "feat: description of changes"
```

### 4. Push Branch
```bash
git push -u origin feature/your-feature-name
```

### 5. Create PR (Use GitHub MCP)
```
Use github_create_pull_request tool:
- owner: hasnainzxc
- repo: autoapply.ai
- base: main
- head: feature/your-feature-name
- title: feat: description
- body: Summary of changes
```

---

## OpenCode MCP Tools Available

| Tool | Use For |
|------|---------|
| `github_create_branch` | Create new branch |
| `github_create_pull_request` | Create PR |
| `github_list_pull_requests` | View open PRs |
| `github_get_pull_request` | Check PR status |
| `github_merge_pull_request` | Merge PR |

---

## Commit Message Format

```
<type>: <description>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation
- refactor: Code refactoring
- style:    UI changes
- chore:    Maintenance
```

---

## Before Any Push - Checklist

- [ ] `git diff` reviewed
- [ ] No secrets/keys included
- [ ] Build passes (`npm run build`)
- [ ] No console.logs or debug code
- [ ] Branch named correctly (`feature/`, `fix/`, `refactor/`)
