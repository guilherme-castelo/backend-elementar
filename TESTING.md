# Guia de Testes e Qualidade (QA) - Backend Elementar

Este documento define os padrões, a análise atual da cobertura e o detalhamento do comportamento esperado da API garantido pelos testes.

---

## 1. Status Atual da Qualidade
**Última Atualização:** 30/12/2025
**Status Global:** ✅ 100% Passing (33 Test Suites)
**Cobertura Geral:** ~60% das linhas de código

### Destaques de Cobertura
| Módulo | Tipo | Cobertura | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | Integração/Unit | 95-100% | 🟢 Crítico Coberto |
| **Chat** | Unitário | ~35% | 🟡 Core Logic Validado |
| **Tasks** | Integração/Unit | ~70% | 🟢 CRUD Validado |
| **SaaS** | Fluxo | - | 🟢 Multi-tenancy Validado |

---

## 2. Detalhamento dos Testes (Comportamento da API)

Esta seção descreve o contrato funcional que é garantido pela nossa suíte de testes. Se um teste passar, significa que a API se comporta exatamente como descrito abaixo.

### 🔐 Autenticação (`auth`)
**Arquivos**: `auth.routes.test.js`, `auth.service.test.js`

*   **Login (`POST /auth/login`)**:
    *   ✅ **Sucesso**: Retorna `200 OK` com Token JWT e dados do usuário (sem senha) se credenciais válidas.
    *   ❌ **Falha (Email)**: Retorna `401 Unauthorized` se o email não existe.
    *   ❌ **Falha (Senha)**: Retorna `401 Unauthorized` se a senha estiver incorreta.
*   **Registro (`POST /auth/register`)**:
    *   ✅ **Sucesso**: Retorna `201 Created` e loga o usuário imediatamente.
    *   ❌ **Duplicidade**: Retorna `400 Bad Request` se o email já estiver em uso.
*   **Sessão (`GET /auth/me`)**:
    *   ✅ **Sucesso**: Retorna dados do usuário logado se o Token for válido.
    *   ❌ **Sem Token**: Retorna `401 Unauthorized`.
    *   ❌ **Token Inválido**: Retorna `403 Forbidden` ou `401 Unauthorized`.

### 💬 Chat Real-time (`chat`)
**Arquivos**: `chat.service.test.js`

*   **Serviço (`ChatService`)**:
    *   ✅ **Listagem**: Garante que o método `getConversations` retorne a lista formatada de conversas do usuário.
    *   ✅ **Envio de Mensagem**: Ao enviar mensagem, garante que:
        1.  A mensagem é salva no banco.
        2.  Um evento `socket.io` do tipo `new_message` é emitido apenas para o destinatário (`io.to(recipientId).emit`).

### 👥 Funcionários (`employees`)
**Arquivos**: `employees.routes.test.js`, `employees.service.test.js`

*   **API (`EmployeesController`)**:
    *   ✅ **Listar (`GET /employees`)**: Retorna lista paginada de funcionários da empresa do usuário.
    *   ✅ **Criar (`POST /employees`)**:
        *   Sucesso: `201 Created` ao fornecer dados válidos (Nome, Matrícula, Data Admissão).
    *   ❌ **Erro**: Retorna `500` (ou erro específico) se houver falha de validação ou banco.

### 🏢 Empresas (`companies`)
**Arquivos**: `companies.routes.test.js`, `companies.service.test.js`

*   **API (`CompaniesController`)**:
    *   ✅ **Listar (`GET /companies`)**: Retorna todas as empresas (Acesso Admin).
    *   ✅ **Inativar (`PATCH /companies/:id/inactivate`)**: Realiza Soft Delete (`isActive: false`) e retorna `204 No Content`.

### 🍽️ Refeições (`meals`)
**Arquivos**: `meals.routes.test.js`, `meals.service.test.js`

*   **API (`MealsController`)**:
    *   ✅ **Registrar (`POST /meals`)**:
        *   Sucesso: `201 Created` se funcionário existir e não tiver refeição no dia.
        *   ❌ **Duplicidade**: Retorna `400 Bad Request` se já existir refeição para o funcionário na data especificada.
        *   ❌ **Dados Inválidos**: Retorna `400` para payload vazio.
    *   ✅ **Relatórios (`GET /meals`)**:
        *   Filtros: Aceita `periodStart` e `periodEnd` para filtrar refeições.
        *   Retorno: Array de refeições populado com dados do funcionário.

### ✅ Tarefas (`tasks`)
**Arquivos**: `tasks.routes.test.js`, `tasks.service.test.js`

*   **API (`TasksController`)**:
    *   ✅ **Listar (`GET /tasks`)**: Retorna lista de tarefas visíveis ao usuário (próprias ou públicas).
    *   ✅ **Criar (`POST /tasks`)**: Cria nova tarefa e associa colaboradores corretamente.
    *   ✅ **Deletar (`DELETE /tasks/:id`)**: Remove a tarefa e retorna `204 No Content`.

### 🏢 SaaS & Multi-tenancy
**Arquivos**: `saas.flow.test.js`, `companies.routes.test.js`

*   **Isolamento**:
    *   ✅ Garante que usuários da **Empresa A** não conseguem ver colaboradores ou dados da **Empresa B**.
    *   ✅ Testes de fluxo validam que um `request` com `companyId` alterado manualmente é rejeitado ou sanitizado pelo middleware.

### 🛡️ Permissões e Segurança (`permissions`)
**Arquivos**: `permissions.flow.test.js`

*   **RBAC (Role Based Access Control)**:
    *   ✅ Usuários sem a permissão específica (`slug`) recebem `403 Forbidden` ao tentar acessar rotas protegidas (ex: Deletar Usuário).

---

## 3. Estratégia de Mocks (A Regra de Ouro)

O projeto utiliza **Mock Manual** para dependências críticas I/O.

### Prisma (Banco de Dados)
Nunca importe o `prisma` real em testes unitários.
```javascript
jest.mock("../../utils/prisma");
const prismaMock = require("../../utils/prisma");
prismaMock.user.findUnique.mockResolvedValue({ id: 1 });
```

### Socket.IO
O socket é mockado para evitar abrir portas reais durante os testes.
```javascript
jest.mock("../../utils/socket", () => ({
  getIO: jest.fn().mockReturnValue({ emit: jest.fn(), to: jest.fn().mockReturnThis() })
}));
```

---

## 4. Como Rodar os Testes

*   **Todos os Testes**:
    ```bash
    npm test
    ```
*   **Apenas Integração**:
    ```bash
    npm test tests/integration
    ```
*   **Coverage Report**:
    ```bash
    npm run test:coverage
    ```
