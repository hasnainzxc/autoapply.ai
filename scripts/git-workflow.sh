#!/bin/bash
# ApplyMate Git Workflow Script
# Usage: ./scripts/git-workflow.sh [command]

set -e

REPO_OWNER="hasnainzxc"
REPO_NAME="autoapply.ai"
BRANCH=$(git branch --show-current)

get_pr_info() {
    gh pr view "$1" --json number,title,state,mergeable,additions,deletions,changedFiles,reviews,url 2>/dev/null
}

find_pr() {
    gh pr list --head "$BRANCH" --state all --json number 2>/dev/null | jq -r '.[0].number // empty'
}

push_and_report() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚀 PUSHING TO GITHUB"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get commits ahead
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/$BRANCH 2>/dev/null || echo "")
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo "⚠️  Branch is up to date, nothing to push"
        return
    fi
    
    # Push
    git push
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 PR STATUS REPORT"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Find or create PR
    PR_NUM=$(find_pr)
    
    if [ -z "$PR_NUM" ]; then
        echo "📝 No PR found for branch '$BRANCH'"
        echo "   Create one with: gh pr create --base main --head $BRANCH"
        return
    fi
    
    echo ""
    echo "PR #$PR_NUM:"
    
    # Get PR details
    PR_INFO=$(get_pr_info $PR_NUM)
    
    STATE=$(echo "$PR_INFO" | jq -r '.state')
    MERGEABLE=$(echo "$PR_INFO" | jq -r '.mergeable // "UNKNOWN"')
    ADDITIONS=$(echo "$PR_INFO" | jq -r '.additions // 0')
    DELETIONS=$(echo "$PR_INFO" | jq -r '.deletions // 0')
    FILES=$(echo "$PR_INFO" | jq -r '.changedFiles // 0')
    URL=$(echo "$PR_INFO" | jq -r '.url')
    REVIEWS=$(echo "$PR_INFO" | jq -r '.reviews | length')
    
    # Status with emoji
    case $STATE in
        "OPEN") STATE_EMOJI="🟢" ;;
        "MERGED") STATE_EMOJI="✅" ;;
        "CLOSED") STATE_EMOJI="🔴" ;;
        *) STATE_EMOJI="⚪" ;;
    esac
    
    case $MERGEABLE in
        "true") MERGE_EMOJI="✅" ;;
        "false") MERGE_EMOJI="⚠️ " ;;
        *) MERGE_EMOJI="⏳" ;;
    esac
    
    echo "   $STATE_EMOJI State: $STATE"
    echo "   $MERGE_EMOJI Mergeable: $MERGEABLE"
    echo "   📁 Files: $FILES"
    echo "   ➕ +$ADDITIONS / -$DELETIONS lines"
    echo "   👀 Reviews: $REVIEWS"
    echo ""
    echo "   🔗 $URL"
    
    # Check if conflicts exist
    if [ "$MERGEABLE" = "false" ]; then
        echo ""
        echo "⚠️  CONFLICTS DETECTED - Action Required"
        echo "   Run: ./scripts/git-workflow.sh resolve"
    fi
}

resolve_conflicts() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 RESOLVING CONFLICTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    git fetch origin main
    
    if git merge origin/main --no-commit --no-ff 2>&1 | grep -q "Conflict"; then
        CONFLICTS=$(git diff --name-only --diff-filter=U)
        
        if [ -n "$CONFLICTS" ]; then
            echo "Conflicted files:"
            echo "$CONFLICTS" | sed 's/^/   - /'
            echo ""
            echo "Resolving with --theirs (keeping incoming main changes)..."
            git checkout --theirs $(git diff --name-only --diff-filter=U) 2>/dev/null || true
            git add -A
            git commit -m "merge: resolve conflicts with main"
            echo "✅ Conflicts resolved and committed"
        fi
    else
        echo "No conflicts found"
        git merge --abort 2>/dev/null || true
    fi
    
    push_and_report
}

check_status() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 REPO STATUS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo ""
    echo "📂 Open PRs:"
    gh pr list --state OPEN --json number,title,mergeable | jq -r '.[] | "   #\(.number): \(.title) [mergeable=\(.mergeable)]"'
    
    echo ""
    echo "🌿 Current Branch: $BRANCH"
    
    # Check if branch is ahead/behind
    AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
    BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
    
    if [ "$AHEAD" -gt 0 ]; then
        echo "   ↑ $AHEAD commits ahead of main"
    fi
    if [ "$BEHIND" -gt 0 ]; then
        echo "   ↓ $BEHIND commits behind main"
    fi
    
    # Check for uncommitted changes
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo "   ⚠️  Uncommitted changes present"
    fi
    
    # Check PR for current branch
    PR_NUM=$(find_pr)
    if [ -n "$PR_NUM" ]; then
        echo ""
        echo "📋 PR #$PR_NUM:"
        PR_INFO=$(get_pr_info $PR_NUM)
        STATE=$(echo "$PR_INFO" | jq -r '.state')
        MERGEABLE=$(echo "$PR_INFO" | jq -r '.mergeable // "UNKNOWN"')
        
        echo "   State: $STATE"
        echo "   Mergeable: $MERGEABLE"
        
        if [ "$MERGEABLE" = "false" ]; then
            echo "   ⚠️  Has conflicts - run './scripts/git-workflow.sh resolve'"
        fi
    fi
}

case "${1:-status}" in
    push)
        push_and_report
        ;;
    resolve)
        resolve_conflicts
        ;;
    status|check)
        check_status
        ;;
    *)
        echo "Usage: $0 {push|resolve|status}"
        exit 1
        ;;
esac
