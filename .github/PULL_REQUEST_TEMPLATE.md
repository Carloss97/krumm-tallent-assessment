## 📝 Description

<!-- Briefly describe the changes in this PR -->

**Type of Change**: 
- [ ] 🐛 Bug fix (fixes #___)
- [ ] ✨ Feature (adds #___)
- [ ] 📚 Documentation
- [ ] 🔧 Configuration/Refactoring
- [ ] 🔒 Security
- [ ] ⚡ Performance
- [ ] 🧪 Tests

---

## 🎯 Motivation & Context

<!-- Why are these changes needed? What problem do they solve? -->

### Related Issues
- Closes #___
- Related to #___

---

## ✅ Checklist (Required before merge)

### Code Quality
- [ ] My code follows the project's style guidelines (`npm run lint` passes)
- [ ] I have self-reviewed my changes
- [ ] I have commented complex logic or non-obvious code
- [ ] I have removed `console.log`, `debugger`, and TODO comments

### Testing
- [ ] I have added tests for my changes
- [ ] All tests pass (`npm test`)
- [ ] Code coverage is maintained or improved
- [ ] I have tested edge cases and error scenarios

### Security
- [ ] No hardcoded secrets or credentials (checked with `grep -r password\|secret`)
- [ ] Input validation is implemented (server-side)
- [ ] No SQL injection vulnerabilities (parameterized queries used)
- [ ] No XSS vulnerabilities (HTML sanitized with DOMPurify if needed)
- [ ] Authentication/authorization checks are in place (if applicable)
- [ ] Security audit passes (`npm run security:audit`)

### Documentation
- [ ] I have updated relevant documentation
- [ ] Comments added for non-obvious code
- [ ] API documentation updated (if new endpoints)
- [ ] Database schema changes documented (if applicable)

### Database (if applicable)
- [ ] Migration script is idempotent
- [ ] Backward compatibility maintained
- [ ] Schema changes follow the adapter pattern (SQLite & Postgres)

### Frontend (if applicable)
- [ ] No unnecessary re-renders (checked with React DevTools)
- [ ] Accessibility (a11y) standards met
- [ ] Responsive design tested
- [ ] Lazy loading applied for large components
- [ ] Error boundaries in place

### Backend (if applicable)
- [ ] Error handling with proper HTTP status codes
- [ ] Logging includes request IDs for tracing
- [ ] Rate limiting applied to sensitive endpoints
- [ ] Prometheus metrics updated (if new metrics)
- [ ] API validated with Ajv JSON Schema

---

## 📊 Testing Details

### Test Coverage
- Statements: ___% (target: 80%+)
- Branches: ___% (target: 75%+)
- Functions: ___% (target: 85%+)

### Manual Testing
- [ ] Tested in development mode
- [ ] Tested in production build (`npm run build && npm run preview`)
- [ ] Tested on desktop
- [ ] Tested on mobile (if applicable)

### Browser Compatibility
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if applicable)

---

## 🔄 Deployment Notes

### Breaking Changes
- [ ] No breaking changes
- [ ] Breaking changes documented below:
  ```
  - Describe breaking changes
  ```

### Database Migrations
- [ ] No migrations needed
- [ ] Migrations included (check `server/db.*.js`)
- [ ] Migration rollback plan: ___

### Environment Variables
- [ ] No new environment variables
- [ ] New variables added:
  ```
  - VAR_NAME=description
  ```

### Configuration Changes
- [ ] No configuration changes
- [ ] Changes documented in `.env.example`

---

## 📦 Artifacts

- [ ] Build successful (`npm run build`)
- [ ] No console errors or warnings
- [ ] Bundle size acceptable

---

## 🤖 AI-Friendly Notes

For faster review:
- **Key changes**: [Summarize the main changes]
- **Design decisions**: [Explain why you chose this approach]
- **Known limitations**: [List any limitations or future improvements]
- **Migration path**: [How does this affect existing data/users?]

---

## 🔗 Links

- Related PR: #___
- Related Issue: #___
- Documentation: [link]
- Staging deploy: [link]

---

## 👥 Reviewers

Please review focusing on:
- [ ] @sarlo - Code quality & testing
- [ ] Security implications
- [ ] Performance impact
- [ ] Database changes (if applicable)

---

## 📝 Reviewer Checklist

- [ ] Code follows project standards
- [ ] Tests are comprehensive
- [ ] Security controls are in place
- [ ] Documentation is clear
- [ ] No performance regressions
- [ ] Database changes are safe
- [ ] Ready to merge

---

**This PR is ready for review!** ✅
