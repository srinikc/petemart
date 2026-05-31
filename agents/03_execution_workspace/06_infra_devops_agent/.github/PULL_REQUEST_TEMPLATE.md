---
name: Pull Request
about: Submit a code change for review
title: '[PROJ-XXX] Brief description'
labels: ''
assignees: ''

---

## 📋 Description
<!--- Provide a concise summary of the changes -->

## 🔗 Related Issue
<!--- Link to the issue or user story -->
Fixes # (issue)

## 🏗️ Type of Change
- [ ] 🐛 Bug fix (non-breaking patch)
- [ ] ✨ New feature (non-breaking minor)
- [ ] 💥 Breaking change (major — describe migration path)
- [ ] 🔒 Security fix
- [ ] 📝 Documentation only
- [ ] ⚙️ Infrastructure/CI/CD

## ✅ Checklist
### Code Quality
- [ ] Code follows project style and conventions
- [ ] Lint passes (`pnpm lint`)
- [ ] TypeScript checks pass (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] New tests added for new functionality

### Security
- [ ] No hardcoded secrets, tokens, or credentials
- [ ] No plaintext database connection strings
- [ ] All user inputs are sanitized/validated
- [ ] API endpoints have proper auth guards

### Database
- [ ] Migration scripts are reversible (have `DOWN` or `ROLLBACK`)
- [ ] New tables have RLS policies
- [ ] Indexes added for query performance

### Deployment
- [ ] Environment variables documented in `.env.example`
- [ ] Docker build succeeds
- [ ] Vercel preview deployment works
- [ ] Supabase migration dry-run passes

## 🧪 Testing Evidence
<!--- Provide screenshots, test output, or curl commands showing the change works -->

## 📸 Screenshots (if UI change)
<!--- Before/after screenshots -->

## 🚀 Deployment Notes
<!--- Special steps needed for deployment, DB migrations, feature flags, etc. -->

## 🔄 Rollback Plan
<!--- How to revert this change if needed -->

## 👀 Reviewer Notes
<!--- Anything specific you want the reviewer to focus on -->
