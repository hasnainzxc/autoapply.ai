#!/bin/bash
# Git Workflow Automation Script
# Usage: ./scripts/git-workflow.sh [command]

set -e

REPO="hasnainzxc/autoapply.ai"
BRANCH="feature/hyper-saturated-fluid-design"

check_conflicts() {
    echo "=== Checking for conflicts on $BRANCH ==="
    
    git fetch origin main
    
    git merge origin/main --no-commit --no-ff 2>&1 || true
    
    if git diff --name-only --diff-filter=U | grep -q .; then
        echo "⚠️  CONFLICTS FOUND:"
        echo ""
        git diff --name-only --diff-filter=U | while read file; do
            echo "  - $file"
        done
        echo ""
        echo "=== Conflict Details ==="
        git diff --name-only --diff-filter=U | while read file; do
            echo ""
            echo "--- $file ---"
            git show :1:"$file" 2>/dev/null | head -5 || echo "(base unavailable)"
            echo "<<<<<<< .our (your changes)"
            git show :2:"$file" 2>/dev/null | head -10 || echo "(our unavailable)"
            echo "======="
            git show :3:"$file" 2>/dev/null | head -10 || echo "(their unavailable)"
            echo ">>>>>>> .their (incoming)"
        done
        echo ""
        echo "To resolve: git merge --abort && manually fix conflicts"
        return 1
    else
        echo "✅ No conflicts found!"
        git merge --abort 2>/dev/null || true
        return 0
    fi
}

check_pr_status() {
    echo "=== GitHub PR Status for $REPO ==="
    gh pr list --state all --json number,title,state,mergeable
}

check_pr_conflicts() {
    echo "=== Checking GitHub PR conflicts ==="
    gh pr list --state OPEN --json number,mergeable | jq -r '.[] | "\(.number): mergeable=\(.mergeable)"'
}

case "${1:-all}" in
    conflicts)
        check_conflicts
        ;;
    pr-status)
        check_pr_status
        ;;
    pr-conflicts)
        check_pr_conflicts
        ;;
    all)
        check_pr_conflicts
        echo ""
        check_conflicts
        ;;
    *)
        echo "Usage: $0 {conflicts|pr-status|pr-conflicts|all}"
        exit 1
        ;;
esac
