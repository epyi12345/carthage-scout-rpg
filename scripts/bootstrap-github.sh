#!/usr/bin/env bash
set -euo pipefail

OWNER="${OWNER:-epyi12345}"
REPO="${REPO:-carthage-scout-rpg}"
FULL="$OWNER/$REPO"
PROJECT_TITLE="${PROJECT_TITLE:-Carthage Scout RPG - Planning & Prototype}"
DESCRIPTION="A hardcore text-based survival RPG about a Carthaginian scout captain mapping a route through the Alps for Hannibal's campaign."

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd gh
require_cmd git

echo "Checking GitHub authentication..."
gh auth status >/dev/null

echo "Preparing local git repository..."
if [ ! -d .git ]; then
  git init
fi
git branch -M main

git add .
if ! git diff --cached --quiet; then
  git commit -m "Initialize Carthage Scout RPG project"
else
  echo "No local file changes to commit."
fi

echo "Creating or reusing private repository: $FULL"
if gh repo view "$FULL" >/dev/null 2>&1; then
  echo "Repository already exists."
  if ! git remote get-url origin >/dev/null 2>&1; then
    git remote add origin "https://github.com/$FULL.git"
  fi
  git push -u origin main || true
else
  gh repo create "$FULL" --private --description "$DESCRIPTION" --source . --remote origin --push
fi

create_label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" -R "$FULL" --color "$color" --description "$description" --force >/dev/null
}

echo "Creating labels..."
create_label "type:gdd" "5319E7" "GDD and design-document work"
create_label "type:system" "1D76DB" "Gameplay system design or implementation"
create_label "type:story" "8A63D2" "Story, narrative, and ending text"
create_label "type:encounter" "D876E3" "Encounter design or implementation"
create_label "type:ui" "FBCA04" "UI and presentation work"
create_label "type:data" "0E8A16" "Game data and tables"
create_label "type:prototype" "0052CC" "Playable prototype work"
create_label "type:research" "7057FF" "Historical or design research"
create_label "priority:critical" "B60205" "Must be resolved for MVP direction"
create_label "priority:high" "D93F0B" "High priority"
create_label "priority:medium" "FBCA04" "Medium priority"
create_label "priority:low" "C5DEF5" "Low priority"
create_label "scope:mvp" "0E8A16" "Included in MVP scope"
create_label "scope:later" "BFDADC" "Later or post-MVP scope"
create_label "needs:decision" "D4C5F9" "Requires a design decision"
create_label "needs:review" "FBCA04" "Needs review"
create_label "blocked" "000000" "Blocked by another task or decision"

create_milestone() {
  local title="$1" description="$2"
  local existing
  existing=$(gh api "repos/$FULL/milestones?state=all" --jq ".[] | select(.title == "$title") | .number" | head -n 1 || true)
  if [ -z "$existing" ]; then
    gh api "repos/$FULL/milestones" -f title="$title" -f description="$description" -f state="open" >/dev/null
  else
    echo "Milestone already exists: $title"
  fi
}

echo "Creating milestones..."
create_milestone "GDD v0.1" "지금까지 정리한 기획을 개발 가능한 형태로 정리."
create_milestone "Text Prototype v0.1" "텍스트 기반으로 20~30분 플레이 가능한 첫 프로토타입 제작."
create_milestone "Map System v0.1" "이 게임의 핵심인 지도/관측/기록 시스템 구현."
create_milestone "Encounter System v0.1" "선택지 기반 인카운터 시스템 구현."
create_milestone "Ending Simulation v0.1" "플레이어가 만든 지도 결과가 한니발군 산행/전투 결과로 이어지게 만들기."

setup_project() {
  echo "Refreshing project scope if needed..."
  gh auth refresh -s project || echo "Project scope refresh skipped or failed. Project setup may need to be run manually."

  local project_number
  project_number=$(gh project list --owner "$OWNER" --format json --jq ".projects[] | select(.title == "$PROJECT_TITLE") | .number" | head -n 1 || true)
  if [ -z "$project_number" ]; then
    echo "Creating project: $PROJECT_TITLE"
    project_number=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json --jq '.number')
  else
    echo "Project already exists: #$project_number"
  fi

  gh project link "$project_number" --owner "$OWNER" --repo "$REPO" || true

  if ! gh project field-list "$project_number" --owner "$OWNER" --format json --jq '.fields[] | select(.name == "Board Status") | .id' | grep -q .; then
    gh project field-create "$project_number" --owner "$OWNER" --name "Board Status" --data-type SINGLE_SELECT --single-select-options "Inbox,Backlog,Ready,In Progress,Review,Done,Archive / Later" >/dev/null || true
  fi

  echo "$project_number"
}

PROJECT_NUMBER=""
if [ "${SETUP_PROJECT:-1}" = "1" ]; then
  PROJECT_NUMBER=$(setup_project | tail -n 1 || true)
fi

issue_exists() {
  local title="$1"
  gh issue list -R "$FULL" --state all --search ""$title" in:title" --json title --jq ".[] | select(.title == "$title") | .title" | grep -Fxq "$title"
}

create_issue_from_row() {
  local title="$1" labels="$2" milestone="$3" body_file="$4"
  if issue_exists "$title"; then
    echo "Issue already exists: $title"
    return
  fi

  local args=(-R "$FULL" --title "$title" --body-file "$body_file" --label "$labels" --milestone "$milestone")
  if [ -n "${PROJECT_TITLE:-}" ] && [ "${SETUP_PROJECT:-1}" = "1" ]; then
    args+=(--project "$PROJECT_TITLE")
  fi
  gh issue create "${args[@]}" >/dev/null
  echo "Created issue: $title"
}

echo "Creating initial issues..."
while IFS=$'	' read -r title labels milestone body_file; do
  [ -z "$title" ] && continue
  create_issue_from_row "$title" "$labels" "$milestone" "$body_file"
done < scripts/issues.tsv

echo "Done. Repository: https://github.com/$FULL"
if [ -n "$PROJECT_NUMBER" ]; then
  echo "Project: https://github.com/users/$OWNER/projects/$PROJECT_NUMBER"
fi
