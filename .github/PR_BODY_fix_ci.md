Corregir error de parseo YAML (Line: 174, Col: 14) en el workflow de CI.

Resumen corto:
- Causa: el paso 'github-script' construía el body del comentario usando literales multilínea que podían producir líneas problemáticas para el parser YAML.
- Fix: construir el cuerpo como array y hacer `join('\n')`, evitando template literals multilínea.

Archivos cambiados:
- .github/workflows/ai-ready-ci.yml

Verificación local (recomendado):
1) `yamllint .github/workflows/ai-ready-ci.yml`
2) `docker run --rm -v "${PWD}:/work" -w /work rhysd/actionlint actionlint .github/workflows/ai-ready-ci.yml`
3) `npm ci && npm run lint && npm test`

Se solicita revisión por DevOps/Backend/Security.

Checklist:
- [ ] `yamllint` OK
- [ ] `actionlint` OK
- [ ] Tests y linters locales pasan

Tareas de seguimiento sugeridas:
- Añadir `actionlint` y `yamllint` como checks en CI
- Agregar pre-commit que valide workflows
