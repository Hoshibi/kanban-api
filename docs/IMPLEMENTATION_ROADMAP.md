# Ordem de implementação — Kanban Assessor API

> Checklist resumido: **tabela → rotas/endpoints → testes**. Seguir as fases em ordem e reutilizar `createRoute`, Zod, Swagger e os padrões atuais da API. Não recriar tabelas já existentes.

## 1. Base

- [x] `advisors` 
    — **Auth**: 
    `POST /auth/register`, 
    `POST /auth/login`, 
    `POST /auth/refresh`, 
    `POST /auth/logout`, 
    `GET /auth/me` 
    *(verificar o que já está pronto)*.

- [ ] `kanban_stages` 
    — **Kanban**: 
    `GET /kanban-stages`, 
    `GET /kanban-stages/:id` 
    *(seed dos cinco estágios)*.

## 2. Clientes e CRM

- [ ] `clients` — 
    `POST /clients`, 
    `GET /clients`, 
    `GET /clients/:id`, 
    `PATCH /clients/:id`, 
    `PATCH /clients/:id/stage`, 
    `PATCH /clients/:id/archive`.
    
- [ ] `client_financial_profiles` — 
    `GET /clients/:id/financial-profile`, 
    `PUT /clients/:id/financial-profile`.

- [ ] `client_investment_profiles` — 
    `GET /clients/:id/investment-profile`, 
    `PUT /clients/:id/investment-profile`.

- [ ] `client_goals` — 
    `GET /clients/:id/goals`, 
    `POST /clients/:id/goals`, 
    `PATCH /clients/:id/goals/:goalId`, 
    `DELETE /clients/:id/goals/:goalId`.

- [ ] `client_tasks` — 
    `GET /clients/:id/tasks`, 
    `POST /clients/:id/tasks`, 
    `PATCH /clients/:id/tasks/:taskId`, 
    `PATCH /clients/:id/tasks/:taskId/status`.

- [ ] `client_timeline_events` — 
    `GET /clients/:id/timeline`, 
    `POST /clients/:id/timeline` 
    *(eventos automáticos registrados pelos serviços)*.

## 3. Suitability

- [ ] `suitability_questions` — 
    `GET /suitability/questions?version=...`.

- [ ] `suitability_assessments` — 
    `GET /clients/:id/suitability-assessments`, 
    `POST /clients/:id/suitability-assessments`, 
    `GET /clients/:id/suitability-assessments/:assessmentId`, 
    `PATCH /clients/:id/suitability-assessments/:assessmentId`, 
    `POST /clients/:id/suitability-assessments/:assessmentId/submit`.

- [ ] `suitability_answers` — 
    `PUT /clients/:id/suitability-assessments/:assessmentId/answers` 
    *(salvar rascunho)*.

## 4. Carteiras e propostas

- [ ] `portfolios` — 
    `GET /clients/:id/portfolios`, 
    `POST /clients/:id/portfolios`, 
    `GET /clients/:id/portfolios/:portfolioId`, 
    `PATCH /clients/:id/portfolios/:portfolioId`.

- [ ] `portfolio_positions` — 
    `POST /clients/:id/portfolios/:portfolioId/positions`, 
    `PATCH /clients/:id/portfolios/:portfolioId/positions/:positionId`, 
    `DELETE /clients/:id/portfolios/:portfolioId/positions/:positionId`.

- [ ] `allocation_proposals` — 
    `GET /clients/:id/proposals`, 
    `POST /clients/:id/proposals`, 
    `GET /clients/:id/proposals/:proposalId`, 
    `PATCH /clients/:id/proposals/:proposalId`.

- [ ] `allocation_proposal_versions` — 
    `GET /clients/:id/proposals/:proposalId/versions`, 
    `POST /clients/:id/proposals/:proposalId/versions`.

- [ ] `proposal_allocation_targets` — 
    `PUT /clients/:id/proposals/:proposalId/versions/:versionId/targets`.

## 5. IA e recomendações

- [ ] `ai_diagnostics` — 
    `GET /clients/:id/ai-diagnostics`, 
    `POST /clients/:id/ai-diagnostics` 
    *(somente com integração/autorização)*.

- [ ] `recommended_movements` — 
    `GET /clients/:id/movements`, 
    `POST /clients/:id/movements`, 
    `PATCH /clients/:id/movements/:movementId` 
    *(hipóteses e revisão; não executar ordens)*.

## 6. Copilot

- [ ] `copilot_conversations` — 
    `GET /copilot/conversations`, 
    `POST /copilot/conversations`, 
    `GET /copilot/conversations/:id`.
    
- [ ] `copilot_chat_messages` — 
    `GET /copilot/conversations/:id/messages`, 
    `POST /copilot/conversations/:id/messages`.

---

**Para cada item:** modelar no Prisma → criar/revisar migration → schema Zod + contrato → service/controller/route → testes → Swagger.

**Regras gerais:** derivar `advisor_id` da autenticação; validar acesso aos clientes; usar `NULL` para dados desconhecidos (não `0`); manter carteiras declaradas/custodiadas/propostas separadas; não confundir IA com suitability formal. Endpoints são **planejados**, não necessariamente implementados.
