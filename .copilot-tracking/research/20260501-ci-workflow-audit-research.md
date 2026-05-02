<!-- markdownlint-disable-file -->

# Task Research Notes: CI workflow YAML parse error audit

## Research Executed

### File Analysis

- .github/workflows/ai-ready-ci.yml
  - Inspected full workflow. Found a multiline `script: |` block inside a `uses: actions/github-script@v7` step (Security job) where a JavaScript ternary expression is split across lines. One of the split lines begins with a colon at the start of the line which YAML parsers can interpret as a mapping with an empty key when the block scalar indentation is ambiguous.

### Code Search Results

- Pattern: lines that start with a colon inside the workflow
  - Match: the line containing the literal beginning with `:` (the `: '✅ **Security Audit Passed**';` line) inside the `script: |` block.

## Key Discoveries

### Exact problematic snippet (as found in file)

```yaml
      - name: Comment audit results on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const audit = fs.readFileSync('audit-report.txt', 'utf8');
            const hasVulnerabilities = audit.includes('vulnerabilities');
            const message = hasVulnerabilities 
              ? `⚠️ **Security Audit Found Issues**\n\`\`\`\n${audit}\n\`\`\``
              : '✅ **Security Audit Passed**';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: message
            });
```

### Root cause

- The YAML block scalar (`script: |`) expects all following content lines to belong to the scalar as long as they are more indented than the `script:` key. Because the ternary operator was split across lines and the line starting with `:` begins at the leftmost non-space position for that indentation level, some YAML parsers (and the GitHub Actions workflow validator) interpreted that `:` as the start of a mapping with an empty key (i.e. an unexpected empty key), yielding an error like "Unexpected value ''" at the location where the colon appears.

- In short: the multiline ternary produced a line beginning with `:` which the parser treated as YAML syntax (empty key) because of how block indentation was parsed. This is a precarious construct inside YAML block scalars and can break some validators.

## Recommended (Minimal, Non-Breaking) Fix

- Replace the multiline ternary expression with an explicit `if/else` assignment in the `script:` block so no line starts with a leading `?` or `:` at the block indentation boundary.

### Unified diff (to apply manually) — minimal change (presented with leading spaces to avoid parser conflicts)

```diff
  *** Update File: .github/workflows/ai-ready-ci.yml
  @@
   -          script: |
   -            const fs = require('fs');
   -            const audit = fs.readFileSync('audit-report.txt', 'utf8');
   -            const hasVulnerabilities = audit.includes('vulnerabilities');
   -            const message = hasVulnerabilities 
   -              ? `⚠️ **Security Audit Found Issues**\\n\\`\\`\\`\\n${audit}\\n\\`\\`\\``
   -              : '✅ **Security Audit Passed**';
   -            github.rest.issues.createComment({
   -              issue_number: context.issue.number,
   -              owner: context.repo.owner,
   -              repo: context.repo.repo,
   -              body: message
   -            });
   +          script: |
   +            const fs = require('fs');
   +            const audit = fs.readFileSync('audit-report.txt', 'utf8');
   +            const hasVulnerabilities = audit.includes('vulnerabilities');
   +            let message;
   +            if (hasVulnerabilities) {
   +              message = `⚠️ **Security Audit Found Issues**\\n\\`\\`\\`\\n${audit}\\n\\`\\`\\``;
   +            } else {
   +              message = '✅ **Security Audit Passed**';
   +            }
   +            github.rest.issues.createComment({
   +              issue_number: context.issue.number,
   +              owner: context.repo.owner,
   +              repo: context.repo.repo,
   +              body: message
   +            });
```

This change avoids lines that begin with `?` or `:` at block indentation boundaries and is functionally equivalent.

## Commands to validate locally

- YAML syntax check (general):

```bash
# Install yamllint (if you don't have it)
pip install yamllint
yamllint .github/workflows/ai-ready-ci.yml
```

- GitHub Actions schema / best-practice linter (actionlint):

```bash
# Recommended: use Docker to run actionlint without installing
docker run --rm -v "%cd%":/workdir ghcr.io/rhysd/actionlint:latest /workdir/.github/workflows/ai-ready-ci.yml
# Or on Unix/macOS
docker run --rm -v "$(pwd)":/workdir ghcr.io/rhysd/actionlint:latest /workdir/.github/workflows/ai-ready-ci.yml
```

- Run the workflow locally (optional) with `act` (https://github.com/nektos/act):

```bash
# Install act (follow project docs). Example: brew install act OR scoop install act
act -j lint --workflows .github/workflows/ai-ready-ci.yml
```

- Quick YAML parse using Python's pyyaml (detects basic parsing errors):

```bash
python -c "import sys, yaml; yaml.safe_load(open('.github/workflows/ai-ready-ci.yml')) or print('OK')"
```

## Suggested commit message

```
fix(ci): avoid YAML parse error in ai-ready-ci.yml by replacing multiline ternary in github-script step

Replace multiline ternary (which produced a line beginning with ':') with explicit if/else
assignment inside the `script` block to prevent YAML parser complaining about an empty key.
```

## Implementation Guidance / Notes

- This is a minimal, non-breaking change: the semantics are identical (message content unchanged).
- The change keeps the `script: |` block and indentation; it only alters the JS inside the block to avoid problematic leading punctuation at line starts.
- After applying the patch, run `actionlint` (recommended) and `yamllint` to confirm the workflow parses correctly.

----

File created: c:\Users\sarlo\OneDrive\Escritorio\Proyectos\Test\.copilot-tracking\research\20260501-ci-workflow-audit-research.md
