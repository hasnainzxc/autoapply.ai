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
            echo "<<<<<<< .our (your changes)"
            git show :2:"$file" 2>/dev/null | head -10 || echo "(unavailable)"
            echo "======="
            git show :3:"$file" 2>/dev/null | head -10 || echo "(unavailable)"
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

push_and_report() {
    echo "=== Pushing to GitHub ==="
    git push
    
    echo ""
    echo "=== PR Status Report ==="
    
    # Find open PR for current branch
    PR_INFO=$(gh pr view $(git branch --show-current) --json number,title,state,mergeable,additions,deletions,changedFiles,reviews 2>/dev/null || gh pr list --head $(git branch --show-current) --json number | jq -r '.[0].number // "none"')
    
    if [ "$PR_INFO" != "none" ] && [ "$PR_INFO" != "" ]; then
        PR_NUM=$(echo "$PR_INFO" | jq -r '.number // empty' 2>/dev/null || echo "$PR_INFO")
        
        if [ -n "$PR_NUM" ] && [ "$PR_NUM" != "null" ]; then
            echo "PR #$PR_NUM:"
            gh pr view "$PR_NUM" --json number,title,state,mergeable,additions,deletions,changedFiles 2>/dev/null | jq -r '
                "  Title: \(.title)
                State: \(.state)
                Mergeable: \(.mergeable // "unknown")
                Files: \(.changedFiles // 0) changed
                +\(.additions // 0) / -\(.deletions // 0)"
            '
        fi
    else
        echo "No open PR found for current branch"
    fi
}

resolve_and_push() {
    echo "=== Resolving conflicts and pushing ==="
    
    git fetch origin main
    git merge origin/main --no-commit --no-ff 2>&1 || true
    
    if git diff --name-only --diff-filter=U | grep -q .; then
        echo "Conflicts found. Using --theirs to keep incoming changes..."
        git checkout --theirs $(git diff --name-only --diff-filter=U)
        git add -A
        git commit -m "merge: resolve conflicts with main"
    else
        echo "No conflicts - completing merge commit"
        git commit --no-edit
    fi
    
    push_and_report
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
    push)
        push_and_report
        ;;
    resolve)
        resolve_and_push
        ;;
    all)
        check_pr_conflicts
        echo ""
        check_conflicts
        ;;
    *)
        echo "Usage: $0 {conflicts|pr-status|pr-conflicts|push|resolve|all}"
        exit 1
        ;;
esac
