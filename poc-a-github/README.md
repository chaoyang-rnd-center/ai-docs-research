# AI Documentation - GitHub Actions PoC

This is a test repository demonstrating AI-powered documentation workflows using GitHub Actions.

## 🎯 Features

### 1. Automatic Issue Labeling
- **File**: `.github/workflows/ai-labeler.yml`
- **Trigger**: When issues are opened or edited
- **Function**: Automatically categorizes issues using keywords:
  - `bug` - Error reports, crashes
  - `enhancement` - Feature requests
  - `documentation` - Doc-related issues
  - `help wanted` - Questions and help requests
  - `priority: high` - Urgent issues

### 2. PR Summary Generation
- **File**: `.github/workflows/ai-pr-summary.yml`
- **Trigger**: When PRs are opened or updated
- **Function**: 
  - Categorizes changed files (docs, src, test, config)
  - Calculates PR size (XS/S/M/L/XL)
  - Lists key changes
  - Suggests reviewers and missing tests

### 3. Documentation Update Reminder
- **File**: `.github/workflows/doc-reminder.yml`
- **Trigger**: When code files are modified in PRs
- **Function**:
  - Detects source code changes without documentation updates
  - Warns about API changes
  - Provides a checklist for documentation updates

## 🚀 Setup

1. Copy `.github/workflows/` to your repository
2. No additional configuration needed for basic functionality
3. For GPT-powered features, add `OPENAI_API_KEY` to repository secrets

## 💡 Future Enhancements

- Integrate GPT-4 for smarter issue classification
- Auto-generate changelog entries from PR descriptions
- Semantic versioning suggestions based on changes
- Auto-update API documentation from code comments
