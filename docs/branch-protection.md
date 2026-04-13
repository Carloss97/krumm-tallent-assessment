# Branch protection (main)

Applied protection settings for the `main` branch (configured via GitHub API).

Current enforced rules (applied on: 2026-04-13):

- Require status checks to pass (strict, branch must be up-to-date):
  - `CI (node-version: 18.x)`
  - `CI (node-version: 20.x)`
- Require pull request reviews: minimum 1 approving review
- Dismiss stale reviews when new commits are pushed
- Do not enforce admin bypass (admins not enforced)

GitHub API payload used:

```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI (node-version: 18.x)", "CI (node-version: 20.x)"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null
}
```

How to inspect protection via CLI:

```bash
gh api /repos/Carloss97/krumm-tallent-assessment/branches/main/protection
```

How to remove protection (use with caution):

```bash
gh api --method DELETE /repos/Carloss97/krumm-tallent-assessment/branches/main/protection
```

Notes and recommendations:

- If your CI check context names differ, update the `contexts` array to match actual check names shown in the Checks tab of a PR.
- Consider enabling `enforce_admins: true` for stricter control if admins should not bypass rules.
- Optionally require code owner reviews for protected directories by setting `require_code_owner_reviews: true`.
