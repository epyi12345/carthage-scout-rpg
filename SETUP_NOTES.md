# Setup Notes

This package contains the repository structure, templates, seed data, and issue definitions for **Carthage Scout RPG**.

## Recommended setup

1. Install and authenticate GitHub CLI.
2. Extract this package.
3. Open a terminal inside the extracted `carthage-scout-rpg` folder.
4. Run one of the bootstrap scripts:

```bash
bash scripts/bootstrap-github.sh
```

or, on Windows PowerShell:

```powershell
.\scripts\bootstrap-github.ps1
```

## What the bootstrap script creates

- Private repository: `epyi12345/carthage-scout-rpg`
- Initial commit with the requested file/folder structure
- Labels
- Milestones
- GitHub Project: `Carthage Scout RPG - Planning & Prototype`
- Board Status single-select field with:
  - Inbox
  - Backlog
  - Ready
  - In Progress
  - Review
  - Done
  - Archive / Later
- Initial MVP planning issues

## Notes

Adding issues to a GitHub Project requires GitHub CLI project scope. If prompted, approve the scope refresh.

```bash
gh auth refresh -s project
```
