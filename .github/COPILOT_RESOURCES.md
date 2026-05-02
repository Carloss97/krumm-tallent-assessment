# ?? Copilot Resources - Talent Assessment Project

## ?? Resumen de Recursos Descargados

Este proyecto ahora cuenta con una colección curada de **Agentes**, **Instrucciones** y **Skills** del repositorio [awesome-copilot](https://github.com/github/awesome-copilot) para optimizar el desarrollo de la aplicación de evaluación de talento.

### ?? Estadísticas
- **Agentes Descargados**: 10
- **Instrucciones Descargadas**: 6  
- **Skills Descargados**: 12
- **Total de Recursos**: 28

---

## ?? Agentes Disponibles

### Equipo de Desarrollo de IA
**ai-team-dev.agent.md** - Equipo de desarrollo con roles dinámicos (Nova, Sage, Milo)
- Usado para: Construcción de features, escritura de código, corrección de bugs
- Especialidades: Frontend, backend, diseño (cambia dinámicamente)

### React & Frontend Specialists
**expert-react-frontend-engineer.agent.md** - Especialista en React 19+
- Hooks modernos, Server Components, TypeScript, optimización de performance
- Uso: Componentes, state management, integración de librerías

**expert-nextjs-developer.agent.md** - Especialista en Next.js 16+
- App Router, Server Actions, API routes, deployment
- Nota: Adaptable a Vite + React para tu stack

### Testing & Quality
**polyglot-test-generator.agent.md** - Generador de tests multilenguaje
- Crear tests unitarios automáticamente
- Soporta: TypeScript, JavaScript, Python, Java, Go, Rust
- Perfecto para: Vitest, Jest, etc.

### Arquitectura & Infraestructura  
**principal-software-engineer.agent.md** - Ingeniero Principal
- Guidance arquitectónico, mejores prácticas, liderazgo técnico
- Revisión de decisiones de diseño complejas

**devops-expert.agent.md** - Especialista DevOps
- CI/CD, automación, deploy, monitoreo
- Plan ? Code ? Build ? Test ? Release ? Deploy ? Operate ? Monitor

**repo-architect.agent.md** - Arquitecto de Repositorio
- Bootstrap de estructuras ágentes
- Valida jerarquías de carpetas, configuración de Copilot
- Post-init validation

### Colaboración & Revisión
**swe-subagent.agent.md** - Subagente Senior
- Implementación de features, debugging, refactoring, testing
- Delegable para tareas concretas

**address-comments.agent.md** - Abordador de Comentarios PR
- Responde feedback de revisión automáticamente
- Excelente para resolver comentarios en PRs

**task-planner.agent.md** - Planificador de Tareas
- Descomposición de epics/features en tareas
- Priorización inteligente, tracking de dependencias

---

## ?? Instrucciones (Mejores Prácticas)

### Frontend Development
**nextjs.instructions.md** (9.8 KB)
- Next.js best practices (adaptable a Vite + React)
- Optimización para LLMs
- Patrones modernos

**nodejs-javascript-vitest.instructions.md** (1.4 KB)
- Node.js + JavaScript con Vitest
- Testing guidelines
- Directamente aplicable a tu stack

### DevOps & Deployment
**github-actions-ci-cd-best-practices.instructions.md** (54.2 KB)
- Configuración de workflows
- Best practices para CI/CD
- Triggers, matrices, variables

**containerization-docker-best-practices.instructions.md** (35.9 KB)
- Docker best practices
- Multi-stage builds
- Optimización de imágenes

### Security & Quality
**security-and-owasp.instructions.md** (30.3 KB)
- OWASP Top 10
- Patrones de seguridad
- JWT, CORS, validación

**ai-prompt-engineering-safety-best-practices.instructions.md** (28.1 KB)
- Prompt engineering seguro
- Mitigación de bias
- Testing de prompts

---

## ?? Skills (Workflows Especializados)

### Testing & Quality Assurance
1. **polyglot-test-agent** - Generación automática de tests multilenguaje
2. **eval-driven-dev** - Desarrollo guiado por evaluaciones (evals)
3. **quality-playbook** - Constitución de calidad + suite de tests completa

### Arquitectura & Planning
4. **acquire-codebase-knowledge** - Mapeo y documentación de codebase
5. **breaking-epic-arch** - Diseño arquitectónico de epics

### Security
6. **codeql** - Configuración de análisis de seguridad estático
7. **appinsights-instrumentation** - Instrumentación de telemetría (Azure App Insights)

### Git & Workflow
8. **git-flow-branch-creator** - Creador automático de ramas Git Flow
9. **conventional-commit** - Generador de commit messages convencionales

### Project Setup
10. **ai-ready** - Prepara repo para AI contributions (genera AGENTS.md, etc.)
11. **github-copilot-starter** - Configuración inicial de Copilot
12. **create-readme** - Genera README automáticamente

---

## ?? Flujos de Trabajo Posibles

### 1. **Desarrollo de Nuevas Features**
`
ai-team-dev (setup equipo)
  ? breaking-epic-arch (diseño)
  ? expert-react-frontend-engineer / swe-subagent (implementación)
  ? polyglot-test-agent (tests)
  ? quality-playbook (validación)
`

### 2. **Code Review & PR Workflow**
`
address-comments (responder feedback)
  ? swe-subagent (implementar fixes)
  ? polyglot-test-agent (actualizar tests)
  ? codeql (validar seguridad)
`

### 3. **Onboarding a Nuevo Developer**
`
acquire-codebase-knowledge (mapeo del repo)
  ? create-readme (documentación)
  ? quality-playbook (entender estándares)
`

### 4. **Setup Inicial de Proyecto**
`
ai-ready (configuración Copilot)
  ? github-copilot-starter (inicialización)
  ? create-readme (documentación)
  ? codeql (seguridad)
`

### 5. **Deployment & DevOps**
`
devops-expert (planning)
  ? github-actions-ci-cd-best-practices (workflows)
  ? containerization-docker-best-practices (Docker)
`

### 6. **Performance & Testing**
`
eval-driven-dev (setup evals)
  ? polyglot-test-agent (tests)
  ? appinsights-instrumentation (telemetría)
`

---

## ?? Cómo Usar en el Desarrollo

### Instalación de Agentes
Puedes invocar cualquiera de estos agentes en VS Code con Copilot:

1. **Abrir Copilot Chat** (Ctrl+Shift+I o Cmd+Shift+I)
2. **Seleccionar el agente** desde el dropdown
3. **Describir tu tarea**

Ejemplo:
`
@ai-team-dev
Necesito implementar un nuevo dashboard de analíticos. 
Comenzaré con la arquitectura.
`

### Uso de Instructions
Las instrucciones aplican automáticamente a Copilot cuando están en:
- .github/copilot-instructions.md (global)
- .github/instructions/*.instructions.md (específicas por tarea)

### Invocación de Skills
Skills se invocan automáticamente o manualmente:
`
/polyglot-test-agent
Generate tests para el componente ProgressTracker

/eval-driven-dev
Setup evaluaciones para la API de telemetría
`

---

## ?? Estructura de Carpetas

`
.github/
+-- agents/                          # 10 Agentes
¦   +-- ai-team-dev.agent.md
¦   +-- expert-react-frontend-engineer.agent.md
¦   +-- expert-nextjs-developer.agent.md
¦   +-- polyglot-test-generator.agent.md
¦   +-- principal-software-engineer.agent.md
¦   +-- devops-expert.agent.md
¦   +-- repo-architect.agent.md
¦   +-- swe-subagent.agent.md
¦   +-- address-comments.agent.md
¦   +-- task-planner.agent.md
¦
+-- instructions/                    # 6 Instrucciones
¦   +-- nextjs.instructions.md
¦   +-- nodejs-javascript-vitest.instructions.md
¦   +-- github-actions-ci-cd-best-practices.instructions.md
¦   +-- containerization-docker-best-practices.instructions.md
¦   +-- security-and-owasp.instructions.md
¦   +-- ai-prompt-engineering-safety-best-practices.instructions.md
¦
+-- skills/                          # 12 Skills
    +-- polyglot-test-agent/
    +-- eval-driven-dev/
    +-- quality-playbook/
    +-- acquire-codebase-knowledge/
    +-- codeql/
    +-- appinsights-instrumentation/
    +-- git-flow-branch-creator/
    +-- conventional-commit/
    +-- ai-ready/
    +-- github-copilot-starter/
    +-- create-readme/
    +-- breaking-epic-arch/
`

---

## ?? Recomendaciones para Efectividad

### Immediatas (Primera Semana)
1. ? Ejecuta i-ready para preparar repo
2. ? Revisa quality-playbook para standards
3. ? Configura codeql en GitHub Actions
4. ? Usa cquire-codebase-knowledge para onboarding

### Medio Plazo (Primer Mes)
1. ?? Adopta polyglot-test-agent para tests automáticos
2. ?? Implementa eval-driven-dev para evals de calidad
3. ?? Usa devops-expert para CI/CD pipeline
4. ?? Configura ppinsights-instrumentation para telemetría

### Largo Plazo (Escalabilidad)
1. ?? Mantén principal-software-engineer para decisiones arquitectónicas
2. ?? Usa i-team-dev para nuevos features complejos
3. ?? Optimiza con eval-driven-dev continuamente
4. ?? Escala con devops-expert en deployment

---

## ?? Referencias Rápidas

| Necesito...  | Usa este Agente/Skill |
|---|---|
| Implementar feature | ai-team-dev / swe-subagent |
| Tests automáticos | polyglot-test-agent |
| Code review | address-comments |
| Arquitectura | principal-software-engineer / breaking-epic-arch |
| DevOps/Deploy | devops-expert |
| Documentación | create-readme / acquire-codebase-knowledge |
| Security | codeql / security-and-owasp.instructions.md |
| Telemetría | appinsights-instrumentation |
| Calidad | quality-playbook / eval-driven-dev |
| Next.js best practices | expert-nextjs-developer |
| React optimization | expert-react-frontend-engineer |

---

## ?? Notas Importantes

- **No cambies manualmente** los archivos en .github/agents/, .github/instructions/, o .github/skills/
- **Versiona** en Git estos archivos para que todo tu equipo tenga los mismos recursos
- **Personaliza** creando archivos adicionales en .github/instructions/ para tu proyectoEspecífico
- **Actualiza regularmente** desde awesome-copilot para obtener nuevas capacidades

---

**Generado**: 2026-05-01  
**Proyecto**: Talent Assessment - React + Vite + Node.js  
**Fuente**: https://github.com/github/awesome-copilot

