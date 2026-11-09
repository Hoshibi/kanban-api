# Vértice Wealth CRM & AI Kanban - Especificação de Endpoints da API

**Versão da API:** `v1`  
**Base URL:** `https://seu-dominio.com/api/v1` (ou `http://localhost:3000/api/v1`)  
**Padrão de Comunicação:** RESTful / JSON  
**Autenticação:** Bearer Token JWT (`Authorization: Bearer <token>`)

---

## Estrutura Padrão de Resposta de Erro

Para requisições que retornam status de erro (`4xx` ou `5xx`), o formato padrão de resposta é:

```json
{
  "error": "Descrição resumida do erro",
  "details": "Mensagem detalhada ou array de validações com falha",
  "statusCode": 400,
  "timestamp": "2026-10-30T18:00:00.000Z"
}
```

---

## Índice de Módulos

1. [Autenticação & Assessor](#1-autenticação--assessor-auth)
2. [Etapas do Kanban](#2-etapas-do-kanban-stages)
3. [Clientes & CRM](#3-clientes--crm-clients)
4. [Carteira & Alocação](#4-carteira--alocação-de-ativos-clientsidportfolio)
5. [Inteligência Artificial (Gemini)](#5-inteligência-artificial-ai)
6. [Linha do Tempo & CRM](#6-linha-do-tempo--notas-clientsidtimeline)
7. [Métricas & Dashboard](#7-métricas--dashboard-metrics)

---

## 1. Autenticação & Assessor (`/auth`)

### 1.1 `POST /auth/login`

Autentica o assessor de investimentos na plataforma.

- **Headers:** `Content-Type: application/json`
- **Params:** Nenhum
- **Request Body:**
```json
{
  "email": "ricardo@vertice.com.br",
  "password": "senha_segura_123"
}
```

- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Ricardo Vértice",
    "email": "ricardo@vertice.com.br",
    "role": "advisor",
    "avatarUrl": "https://assets.vertice.com/advisors/ricardo.jpg"
  }
}
```

- **Erros:** `400 Bad Request` (campos faltando), `401 Unauthorized` (credenciais inválidas).

---

### 1.2 `GET /auth/me`

Retorna os dados do assessor autenticado via token.

- **Headers:** `Authorization: Bearer <token>`
- **Params:** Nenhum
- **Request Body:** Nenhum
- **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Ricardo Vértice",
  "email": "ricardo@vertice.com.br",
  "role": "advisor",
  "avatarUrl": "https://assets.vertice.com/advisors/ricardo.jpg",
  "createdAt": "2026-08-01T10:00:00.000Z"
}
```

- **Erros:** `401 Unauthorized`.

---

## 2. Etapas do Kanban (`/stages`)

### 2.1 `GET /stages`

Retorna as colunas do funil do Kanban para renderização do quadro.

- **Headers:** `Authorization: Bearer <token>`
- **Params:** Nenhum
- **Request Body:** Nenhum
- **Response (200 OK):**
```json
[
  {
    "id": 1,
    "slug": "lead",
    "title": "1. Prospecção & Lead",
    "description": "Primeiro contato e qualificação de patrimônio",
    "position": 1,
    "colorBorder": "border-slate-800",
    "colorAccent": "text-slate-400"
  },
  {
    "id": 2,
    "slug": "suitability",
    "title": "2. Análise de Perfil",
    "description": "Diagnóstico de risco e horizonte com IA",
    "position": 2,
    "colorBorder": "border-indigo-900/60",
    "colorAccent": "text-indigo-400"
  },
  {
    "id": 3,
    "slug": "proposal",
    "title": "3. Proposta de Alocação",
    "description": "Carteira sugerida e tese de investimento",
    "position": 3,
    "colorBorder": "border-cyan-900/60",
    "colorAccent": "text-cyan-400"
  },
  {
    "id": 4,
    "slug": "negotiation",
    "title": "4. Em Negociação",
    "description": "Abertura de conta e transferência de custódia",
    "position": 4,
    "colorBorder": "border-amber-900/60",
    "colorAccent": "text-amber-400"
  },
  {
    "id": 5,
    "slug": "active",
    "title": "5. Carteira Ativa",
    "description": "Custódia sob gestão e rebalanceamento contínuo",
    "position": 5,
    "colorBorder": "border-emerald-900/60",
    "colorAccent": "text-emerald-400"
  }
]
```

---

## 3. Clientes & CRM (`/clients`)

### 3.1 `GET /clients`

Lista os clientes com opções de busca, filtros de etapa e perfil, e ordenação.

- **Headers:** `Authorization: Bearer <token>`
- **Query Params:**
  - `q` _(opcional, string)_: Termo de busca por nome, email ou objetivo. Ex: `carlos`
  - `stage` _(opcional, string)_: Filtrar por slug da etapa. Ex: `lead`, `suitability`, `proposal`
  - `riskProfile` _(opcional, string)_: `Conservador`, `Moderado`, `Arrojado`, `Sofisticado`, `Pendente`
  - `sortBy` _(opcional, string)_: `targetAum:desc`, `targetAum:asc`, `recent`, `name:asc`
  - `page` _(opcional, int)_: Padrão `1`
  - `limit` _(opcional, int)_: Padrão `50`
- **Request Body:** Nenhum
- **Response (200 OK):**
```json
{
  "total": 5,
  "page": 1,
  "limit": 50,
  "clients": [
    {
      "id": 1,
      "name": "Carlos Eduardo Mendes",
      "email": "carlos.mendes@agronegocios.com.br",
      "phone": "(19) 99821-4321",
      "stage": "lead",
      "targetAum": 1800000.0,
      "currentAum": 0.0,
      "monthlyContribution": 25000.0,
      "horizonYears": 10,
      "riskProfile": "Pendente",
      "riskScore": 0,
      "primaryGoal": "Planejamento sucessório e preservação de capital",
      "marketDropReaction": "Preocupa-se com oscilações, prefere estabilidade",
      "investmentExperience": "Iniciante",
      "priority": "VIP",
      "advisorName": "Ricardo Vértice",
      "lastContact": "Há 1 dia",
      "createdAt": "2026-10-25T14:30:00.000Z"
    }
  ]
}
```

---

### 3.2 `POST /clients`

Cadastra um novo investidor no funil do Kanban.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "name": "Beatriz Fonseca",
  "email": "beatriz.fonseca@invest.com.br",
  "phone": "(11) 98765-4321",
  "stage": "lead",
  "targetAum": 1200000.0,
  "monthlyContribution": 20000.0,
  "horizonYears": 12,
  "primaryGoal": "Construção de renda passiva com dividendos e proteção contra inflação",
  "marketDropReaction": "Manteria a calma e aportaria mais aproveitando desconto",
  "investmentExperience": "Intermediário",
  "priority": "Alta",
  "notes": "Executiva do setor farmacêutico. Indicada por cliente VIP."
}
```

- **Response (201 Created):**
```json
{
  "id": 6,
  "name": "Beatriz Fonseca",
  "stage": "lead",
  "targetAum": 1200000.0,
  "riskProfile": "Pendente",
  "riskScore": 0,
  "createdAt": "2026-10-30T16:00:00.000Z"
}
```

- **Erros:** `400 Bad Request` (campo obrigatório `name` ou formato inválido).

---

### 3.3 `GET /clients/:id`

Retorna todos os detalhes de um cliente, incluindo alocações, diagnóstico de IA e histórico.

- **Headers:** `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_ - Identificador único do cliente.
- **Response (200 OK):**
```json
{
  "id": 2,
  "name": "Dra. Sofia Albuquerque",
  "email": "sofia.med@clinicaalbuquerque.med.br",
  "phone": "(11) 98744-9912",
  "stage": "suitability",
  "targetAum": 850000.0,
  "currentAum": 320000.0,
  "monthlyContribution": 15000.0,
  "horizonYears": 15,
  "riskProfile": "Moderado",
  "riskScore": 54,
  "primaryGoal": "Aposentadoria precoce com renda passiva recorrente",
  "marketDropReaction": "Entende a volatilidade, não resgata no pânico",
  "investmentExperience": "Intermediário",
  "priority": "Alta",
  "advisorName": "Ricardo Vértice",
  "lastContact": "Há 2 dias",
  "aiSuitabilitySummary": "Perfil equilibrado com excelente capacidade de aporte mensal...",
  "aiKeyInsights": [
    "Capacidade de poupança alta permite absorver volatilidade",
    "Horizonte de 15 anos viabiliza NTN-B longa"
  ],
  "aiNextStepAction": "Apresentar proposta de portfólio estruturado com foco em dividendos",
  "currentAllocation": {
    "fixedIncome": 45,
    "equities": 15,
    "realEstateFunds": 20,
    "multiMarket": 10,
    "internationalCrypto": 0,
    "cashReserves": 10
  },
  "recommendedAllocation": {
    "fixedIncome": 40,
    "equities": 20,
    "realEstateFunds": 25,
    "multiMarket": 10,
    "internationalCrypto": 5,
    "cashReserves": 0
  }
}
```

- **Erros:** `404 Not Found`.

---

### 3.4 `PATCH /clients/:id/stage` _(Operação de Drag & Drop do Kanban)_

Atualiza a etapa do cliente no funil e registra automaticamente no histórico.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Request Body:**
```json
{
  "stage": "proposal",
  "note": "Reunião de suitability finalizada. Elaborando carteira recomendada."
}
```

- **Response (200 OK):**
```json
{
  "id": 2,
  "name": "Dra. Sofia Albuquerque",
  "previousStage": "suitability",
  "currentStage": "proposal",
  "updatedAt": "2026-10-30T16:15:00.000Z"
}
```

- **Erros:** `400 Bad Request` (etapa inválida), `404 Not Found`.

---

### 3.5 `PUT /clients/:id`

Atualiza dados cadastrais e financeiros do cliente.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Request Body:**
```json
{
  "name": "Carlos Eduardo Mendes",
  "email": "carlos.mendes@agronegocios.com.br",
  "phone": "(19) 99821-4321",
  "targetAum": 2100000.0,
  "monthlyContribution": 30000.0,
  "priority": "VIP",
  "notes": "Atualizado valor de liquidez pós-safra."
}
```

- **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Carlos Eduardo Mendes",
  "targetAum": 2100000.0,
  "monthlyContribution": 30000.0,
  "updatedAt": "2026-10-30T16:20:00.000Z"
}
```

---

## 4. Carteira & Alocação de Ativos (`/clients/:id/portfolio`)

### 4.1 `GET /clients/:id/portfolio`

Retorna o comparativo entre a alocação atual e a recomendada pelo motor de IA.

- **Headers:** `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Response (200 OK):**
```json
{
  "clientId": 3,
  "current": {
    "fixedIncome": 20.0,
    "equities": 50.0,
    "realEstateFunds": 10.0,
    "multiMarket": 10.0,
    "internationalCrypto": 5.0,
    "cashReserves": 5.0
  },
  "recommended": {
    "fixedIncome": 25.0,
    "equities": 35.0,
    "realEstateFunds": 15.0,
    "multiMarket": 10.0,
    "internationalCrypto": 15.0,
    "cashReserves": 0.0
  },
  "driftAnalysis": {
    "fixedIncomeDelta": 5.0,
    "equitiesDelta": -15.0,
    "realEstateFundsDelta": 5.0,
    "multiMarketDelta": 0.0,
    "internationalCryptoDelta": 10.0,
    "cashReservesDelta": -5.0
  }
}
```

---

### 4.2 `PUT /clients/:id/portfolio`

Atualiza manualmente a carteira atual ou recomendada do cliente.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Request Body:**
```json
{
  "type": "current",
  "allocation": {
    "fixedIncome": 40.0,
    "equities": 25.0,
    "realEstateFunds": 15.0,
    "multiMarket": 10.0,
    "internationalCrypto": 5.0,
    "cashReserves": 5.0
  }
}
```

- **Response (200 OK):**
```json
{
  "message": "Alocação atualizada com sucesso",
  "clientId": 3,
  "total": 100.0
}
```

- **Erros:** `400 Bad Request` (se a soma dos percentuais for diferente de 100%).

---

## 5. Inteligência Artificial (AI)

### 5.1 `POST /ai/analyze-risk`

Executa o diagnóstico regulatório de Suitability e perfil de risco com o Gemini 3.8 Flash.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "client": {
    "name": "Carlos Eduardo Mendes",
    "targetAum": 1800000,
    "monthlyContribution": 25000,
    "horizonYears": 10,
    "primaryGoal": "Planejamento sucessório e preservação de capital com rendimento real",
    "marketDropReaction": "Preocupa-se com oscilações, prefere estabilidade",
    "investmentExperience": "Iniciante",
    "currentAllocation": {
      "fixedIncome": 70,
      "equities": 0,
      "realEstateFunds": 0,
      "multiMarket": 0,
      "internationalCrypto": 0,
      "cashReserves": 30
    }
  }
}
```

- **Response (200 OK):**
```json
{
  "riskProfile": "Conservador",
  "riskScore": 28,
  "summary": "Investidor com foco absoluto em segurança patrimonial e baixa tolerância à volatilidade de curto prazo. O horizonte de 10 anos permite alocação em títulos públicos indexados à inflação (NTN-B) com rentabilidade real garantida.",
  "targetAllocation": {
    "fixedIncome": 75.0,
    "equities": 5.0,
    "realEstateFunds": 10.0,
    "multiMarket": 5.0,
    "internationalCrypto": 0.0,
    "cashReserves": 5.0
  },
  "keyInsights": [
    "Patrimônio robusto permite alocação com cupom semestral isento de IR",
    "Excessivo percentual em Caixa (30%) perde rendimento para o CDI líquido",
    "Exposição controlada em FIIs de recebíveis (10%) eleva o rendimento sem oscilação brusca de cota"
  ],
  "recommendedNextStep": "Apresentar lâmina de Renda Fixa Premium estruturada e simulação de redução de caixa para a etapa de Proposta."
}
```

- **Erros:** `400 Bad Request` (dados do investidor incompletos), `500 Internal Server Error` (falha na API do modelo).

---

### 5.2 `POST /ai/recommend-movements`

Gera movimentos táticos de carteira (Aporte, Rebalanceamento, Troca de Ativos).

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "client": {
    "name": "Marcio Fontes",
    "stage": "proposal",
    "targetAum": 1250000,
    "riskProfile": "Arrojado",
    "currentAllocation": {
      "fixedIncome": 20,
      "equities": 50,
      "realEstateFunds": 10,
      "multiMarket": 10,
      "internationalCrypto": 5,
      "cashReserves": 5
    },
    "recommendedAllocation": {
      "fixedIncome": 25,
      "equities": 35,
      "realEstateFunds": 15,
      "multiMarket": 10,
      "internationalCrypto": 15,
      "cashReserves": 0
    }
  }
}
```

- **Response (200 OK):**
```json
{
  "executiveOverview": "Rebalanceamento tático para redução de concentração em ações locais voláteis e ampliação de exposição global dolarizada.",
  "recommendations": [
    {
      "title": "Aporte em ETFs Globais (IVVB11 / WRLD11)",
      "action": "APORTE",
      "assetClass": "Internacional",
      "rationale": "Mitiga o risco-país com exposição direta a empresas globais de alta margem.",
      "priority": "ALTA",
      "estimatedAmount": 125000.0
    },
    {
      "title": "Trava de Taxa em NTN-B 2035 (IPCA + 6,8% a.a.)",
      "action": "APORTE",
      "assetClass": "Renda Fixa",
      "rationale": "Garante taxa de juro real histórica para proteger o capital no médio prazo.",
      "priority": "ALTA",
      "estimatedAmount": 150000.0
    },
    {
      "title": "Realização Parcial de Lucros em Ações Locais",
      "action": "REBALANCEAR",
      "assetClass": "Ações",
      "rationale": "Desconcentrar posições cíclicas para realocar em fundos imobiliários com yield atrativo.",
      "priority": "MEDIA",
      "estimatedAmount": 80000.0
    }
  ]
}
```

---

### 5.3 `POST /ai/chat`

Conversa com o Copilot de IA de Wealth Management com injeção automática de contexto do cliente.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Crie um roteiro de mensagem para WhatsApp convidando a Dra. Sofia para reunião de proposta de carteira."
    }
  ],
  "clientContext": {
    "name": "Dra. Sofia Albuquerque",
    "stage": "suitability",
    "targetAum": 850000,
    "riskProfile": "Moderado",
    "primaryGoal": "Aposentadoria precoce com renda passiva recorrente",
    "horizonYears": 15,
    "lastContact": "Há 2 dias"
  }
}
```

- **Response (200 OK):**
```json
{
  "reply": "Olá, Dra. Sofia! Tudo bem?\n\nConcluí a análise detalhada do seu questionário de perfil e o mapeamento dos seus objetivos de aposentadoria e renda passiva.\n\nEstruturei uma proposta de carteira personalizada com foco em proventos recorrentes (isenção de IR) e blindagem contra inflação para o seu horizonte de 15 anos.\n\nPodemos fazer um alinhamento rápido de 15 minutos amanhã às 11h ou na quinta às 16h para eu te apresentar a tese?"
}
```

---

## 6. Linha do Tempo & Notas (`/clients/:id/timeline`)

### 6.1 `GET /clients/:id/timeline`

Retorna todos os eventos cronológicos de interações com o cliente.

- **Headers:** `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Response (200 OK):**
```json
[
  {
    "id": 101,
    "date": "Ontem às 16:30",
    "text": "Contato inicial realizado por WhatsApp.",
    "author": "Ricardo Vértice",
    "type": "contact"
  },
  {
    "id": 102,
    "date": "Hoje às 11:00",
    "text": "Questionário de Suitability analisado pelo motor de IA.",
    "author": "Motor de IA Vértice",
    "type": "suitability"
  }
]
```

---

### 6.2 `POST /clients/:id/timeline`

Adiciona uma nota manual ou registro de contato.

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **URL Params:** `id` _(obrigatório, int)_
- **Request Body:**
```json
{
  "text": "Reunião de 30min realizada via Google Meet. Cliente aprovou a tese de alocação em FIIs e pediu o envio do formulário de abertura de conta.",
  "type": "meeting"
}
```

- **Response (201 Created):**
```json
{
  "id": 103,
  "clientId": 2,
  "text": "Reunião de 30min realizada via Google Meet...",
  "type": "meeting",
  "author": "Ricardo Vértice",
  "createdAt": "2026-10-30T17:00:00.000Z"
}
```

---

## 7. Métricas & Dashboard (`/metrics`)

### 7.1 `GET /metrics/overview`

Retorna os indicadores executivos do painel comercial e da carteira gerida.

- **Headers:** `Authorization: Bearer <token>`
- **Params:** Nenhum
- **Request Body:** Nenhum
- **Response (200 OK):**
```json
{
  "totalAum": 11500000.0,
  "activeAum": 5380000.0,
  "pipelineAum": 4650000.0,
  "totalMonthlyInflow": 140000.0,
  "totalClients": 5,
  "clientsByStage": {
    "lead": 1,
    "suitability": 1,
    "proposal": 1,
    "negotiation": 1,
    "active": 1
  },
  "distributionByRisk": {
    "Conservador": 1,
    "Moderado": 2,
    "Arrojado": 2,
    "Sofisticado": 0,
    "Pendente": 0
  }
}
```

---

## Resumo das Convenções de Código HTTP

| Código | Significado               | Quando é retornado                                                                           |
| :----: | :------------------------ | :------------------------------------------------------------------------------------------- |
| `200`  | **OK**                    | Sucesso em leituras (`GET`), atualizações (`PUT`/`PATCH`) ou inferências de IA (`POST`).     |
| `201`  | **Created**               | Criação com sucesso de cliente (`POST /clients`) ou nota (`POST /timeline`).                 |
| `400`  | **Bad Request**           | Campos obrigatórios ausentes, JSON malformatado ou percentual de alocação que não soma 100%. |
| `401`  | **Unauthorized**          | Token Bearer ausente ou expirado.                                                            |
| `404`  | **Not Found**             | Cliente ou recurso não encontrado no banco.                                                  |
| `500`  | **Internal Server Error** | Erro interno do servidor ou falha na integração com API externa.                             |
