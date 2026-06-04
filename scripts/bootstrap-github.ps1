$ErrorActionPreference = "Stop"

$Owner = if ($env:OWNER) { $env:OWNER } else { "epyi12345" }
$Repo = if ($env:REPO) { $env:REPO } else { "carthage-scout-rpg" }
$Full = "$Owner/$Repo"
$ProjectTitle = if ($env:PROJECT_TITLE) { $env:PROJECT_TITLE } else { "Carthage Scout RPG - Planning & Prototype" }
$Description = "A hardcore text-based survival RPG about a Carthaginian scout captain mapping a route through the Alps for Hannibal's campaign."

function Require-Command($Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

Require-Command gh
Require-Command git

gh auth status | Out-Null

if (-not (Test-Path ".git")) {
  git init | Out-Null
}
git branch -M main

git add .
$pending = git diff --cached --name-only
if ($pending) {
  git commit -m "Initialize Carthage Scout RPG project"
} else {
  Write-Host "No local file changes to commit."
}

try {
  gh repo view $Full | Out-Null
  Write-Host "Repository already exists: $Full"
  try { git remote get-url origin | Out-Null } catch { git remote add origin "https://github.com/$Full.git" }
  try { git push -u origin main } catch { Write-Host "Push skipped or failed; check git remote/auth." }
} catch {
  gh repo create $Full --private --description $Description --source . --remote origin --push
}

function Create-Label($Name, $Color, $DescriptionText) {
  gh label create $Name -R $Full --color $Color --description $DescriptionText --force | Out-Null
}

Create-Label "type:gdd" "5319E7" "GDD and design-document work"
Create-Label "type:system" "1D76DB" "Gameplay system design or implementation"
Create-Label "type:story" "8A63D2" "Story, narrative, and ending text"
Create-Label "type:encounter" "D876E3" "Encounter design or implementation"
Create-Label "type:ui" "FBCA04" "UI and presentation work"
Create-Label "type:data" "0E8A16" "Game data and tables"
Create-Label "type:prototype" "0052CC" "Playable prototype work"
Create-Label "type:research" "7057FF" "Historical or design research"
Create-Label "priority:critical" "B60205" "Must be resolved for MVP direction"
Create-Label "priority:high" "D93F0B" "High priority"
Create-Label "priority:medium" "FBCA04" "Medium priority"
Create-Label "priority:low" "C5DEF5" "Low priority"
Create-Label "scope:mvp" "0E8A16" "Included in MVP scope"
Create-Label "scope:later" "BFDADC" "Later or post-MVP scope"
Create-Label "needs:decision" "D4C5F9" "Requires a design decision"
Create-Label "needs:review" "FBCA04" "Needs review"
Create-Label "blocked" "000000" "Blocked by another task or decision"

function Create-Milestone($Title, $DescriptionText) {
  $existing = gh api "repos/$Full/milestones?state=all" --jq ".[] | select(.title == `"$Title`") | .number"
  if (-not $existing) {
    gh api "repos/$Full/milestones" -f title="$Title" -f description="$DescriptionText" -f state="open" | Out-Null
  }
}

Create-Milestone "GDD v0.1" "지금까지 정리한 기획을 개발 가능한 형태로 정리."
Create-Milestone "Text Prototype v0.1" "텍스트 기반으로 20~30분 플레이 가능한 첫 프로토타입 제작."
Create-Milestone "Map System v0.1" "이 게임의 핵심인 지도/관측/기록 시스템 구현."
Create-Milestone "Encounter System v0.1" "선택지 기반 인카운터 시스템 구현."
Create-Milestone "Ending Simulation v0.1" "플레이어가 만든 지도 결과가 한니발군 산행/전투 결과로 이어지게 만들기."

$ProjectNumber = $null
if ($env:SETUP_PROJECT -ne "0") {
  try { gh auth refresh -s project } catch { Write-Host "Project scope refresh skipped or failed." }
  $ProjectNumber = gh project list --owner $Owner --format json --jq ".projects[] | select(.title == `"$ProjectTitle`") | .number" | Select-Object -First 1
  if (-not $ProjectNumber) {
    $ProjectNumber = gh project create --owner $Owner --title $ProjectTitle --format json --jq ".number"
  }
  try { gh project link $ProjectNumber --owner $Owner --repo $Repo } catch { Write-Host "Project link skipped or failed." }
  $boardStatus = gh project field-list $ProjectNumber --owner $Owner --format json --jq '.fields[] | select(.name == "Board Status") | .id'
  if (-not $boardStatus) {
    try { gh project field-create $ProjectNumber --owner $Owner --name "Board Status" --data-type SINGLE_SELECT --single-select-options "Inbox,Backlog,Ready,In Progress,Review,Done,Archive / Later" | Out-Null } catch { Write-Host "Board Status field creation skipped or failed." }
  }
}

Import-Csv "scripts/issues.tsv" -Delimiter "`t" -Header Title,Labels,Milestone,BodyFile | ForEach-Object {
  $existing = gh issue list -R $Full --state all --search "`"$($_.Title)`" in:title" --json title --jq ".[] | select(.title == `"$($_.Title)`") | .title"
  if ($existing -contains $_.Title) {
    Write-Host "Issue already exists: $($_.Title)"
  } else {
    $args = @("issue", "create", "-R", $Full, "--title", $_.Title, "--body-file", $_.BodyFile, "--label", $_.Labels, "--milestone", $_.Milestone)
    if ($env:SETUP_PROJECT -ne "0") { $args += @("--project", $ProjectTitle) }
    gh @args | Out-Null
    Write-Host "Created issue: $($_.Title)"
  }
}

Write-Host "Done. Repository: https://github.com/$Full"
if ($ProjectNumber) { Write-Host "Project: https://github.com/users/$Owner/projects/$ProjectNumber" }
