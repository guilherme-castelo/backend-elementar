# Guia de Testes e Qualidade (QA) - Backend Elementar

Este documento define os padrões, a análise atual da cobertura e o detalhamento do comportamento esperado da API garantido pelos testes.

---

## 1. Status Atual da Qualidade
**Última Atualização:** 30/12/2025
**Status Global:** ✅ 100% Passing (35 Test Suites)
**Cobertura Geral:** > 80% das linhas de código (Services críticos > 90%)

### Destaques de Cobertura
| Módulo | Tipo | Cobertura | Status |
| :--- | :--- | :--- | :--- |
| **Auth** | Integração/Unit | 100% | 🟢 Crítico Coberto |
| **All Controllers** | Unitário | 100% | 🟢 API Completamente Coberta |
| **Meals** | Unitário (Novo) | ~93% | 🟢 Lógica Complexa Coberta |
| **Permissions/Roles** | Unitário (Novo) | 100% | 🟢 RBAC Completo |
| **Notifications** | Unitário (Novo) | 100% | 🟢 Validado |
| **Companies/Features** | Unitário (Novo) | 100% | 🟢 Validado |
| **Tasks** | Unitário (Novo) | ~84% | 🟢 Filtros de Visibilidade |
| **SaaS** | Fluxo | - | 🟢 Multi-tenancy Validado |

---

## 2. Detalhamento dos Testes (Comportamento da API)

Esta seção descreve o contrato funcional que é garantido pela nossa suíte de testes. Se um teste passar, significa que a API se comporta exatamente como descrito abaixo.

### 🔐 Autenticação (`auth`)
**Arquivos**: `auth.routes.test.js`, `auth.service.test.js`, `auth.controller.test.js`

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

### � Usuários (`users`)
**Arquivos**: `users.routes.test.js`, `users.service.test.js`, `users.controller.test.js`

*   **API (`UsersController`)**:
    *   ✅ **CRUD Completo**: `getAll`, `getById`, `create`, `update`, `delete`.
    *   ✅ **Segurança**: Senhas nunca são retornadas nas respostas.
    *   ✅ **Validação**: Emails duplicados retornam `409 Conflict`.

### �💬 Chat Real-time (`chat`)
**Arquivos**: `chat.routes.test.js`, `chat.service.test.js`, `chat.controller.test.js`

*   **Serviço (`ChatService`)**:
    *   ✅ **Listagem**: Garante que o método `getConversations` retorne a lista formatada de conversas do usuário.
    *   ✅ **Envio de Mensagem**: Ao enviar mensagem, garante que:
        1.  A mensagem é salva no banco.
        2.  Um evento `socket.io` do tipo `new_message` é emitido apenas para o destinatário.

### 👥 Funcionários (`employees`)
**Arquivos**: `employees.routes.test.js`, `employees.service.test.js`, `employees.controller.test.js`

*   **API (`EmployeesController`)**:
    *   ✅ **Listar**: Retorna lista paginada de funcionários da empresa.
    *   ✅ **Unicidade**: Garante que Matricula/CPF não se repitam.

### 🏢 Empresas (`companies`)
**Arquivos**: `companies.routes.test.js`, `companies.service.test.js`, `companies.controller.test.js`

*   **API (`CompaniesController`)**:
    *   ✅ **Listar**: Retorna todas as empresas (Admin).
    *   ✅ **Inativar**: Realiza Soft Delete.

### 🍽️ Refeições (`meals`)
**Arquivos**: `meals.routes.test.js`, `meals.service.test.js`, `meals.controller.test.js`

*   **API (`MealsController`)**:
    *   ✅ **Registrar**: Cria refeição validando funcionário e evitando duplicidade diária.
    *   ✅ **Importação**: Processa arquivos em lote e lida com registros parciais.

### ✅ Tarefas (`tasks`)
**Arquivos**: `tasks.routes.test.js`, `tasks.service.test.js`, `tasks.controller.test.js`

*   **API (`TasksController`)**:
    *   ✅ **Visibilidade**: Filtra tarefas privadas x públicas.
    *   ✅ **Colaboração**: Gerencia array de colaboradores.

### 🔔 Notificações (`notifications`)
**Arquivos**: `notifications.routes.test.js`, `notifications.service.test.js`, `notifications.controller.test.js`

*   **API**:
    *   ✅ **Listar**: Apenas notificações do usuário logado.
    *   ✅ **Ações**: Marcar como lida (`markAsRead`) e arquivar (`archive`).

### 📩 Convites (`invitations`)
**Arquivos**: `invitations.routes.test.js`, `invitations.service.test.js`, `invitations.controller.test.js`

*   **API**:
    *   ✅ **Fluxo**: Criar convite -> Validar Token -> Aceitar (Criar Usuário).

### 🛡️ Permissões e Roles (`permissions`, `roles`)
**Arquivos**: `permissions.flow.test.js`, `permissions.service.test.js`, `roles.service.test.js`

*   **RBAC**:
    *   ✅ **Roles**: CRUD de perfis de acesso.
    *   ✅ **Proteção**: Middleware bloqueia acesso sem permissão necessária.

### 🧩 Features (`features`)
**Arquivos**: `features.routes.test.js`, `features.service.test.js`, `features.controller.test.js`

*   **API**:
    *   ✅ **Gestão**: CRUD de funcionalidades do sistema.

### 🏢 SaaS & Multi-tenancy
**Arquivos**: `saas.flow.test.js`, `companies.routes.test.js`

*   **Isolamento**:
    *   ✅ Garante que dados de uma empresa não vazem para outra.

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

## Regras de Negócio do Backend

Esta seção descreve as regras de negócio validadas pelos testes unitários e de integração. O Frontend **DEVE** respeitar estas regras para garantir consistência.

### 1. Usuários (`UsersService`)
- **Unicidade de Email**: Não é possível criar ou atualizar um usuário com um email já existente (`ConflictError`).
- **Senha**: A senha é obrigatória na criação. Ela é armazenada como hash (bcrypt). Em atualizações, se o campo `password` for enviado, ele será re-hashado.
- **Preferências Padrão**: Se não fornecidas na criação, as preferências padrão são: `{ language: { code: "pt", name: "Portuguese (Brazil)" }, dateFormat: "DD/MM/YYYY", automaticTimeZone: { isEnabled: true } }`.
- **Formato de Dados**:
  - `preferences` e `address`: Podem ser enviados como objeto JSON, mas são salvos como String no banco. O serviço faz a conversão automática (`JSON.stringify`).
  - `roles`: Pode ser enviado como Array de strings (ex: `['ADMIN']`), mas é salvo como uma string separada por vírgulas.
- **Exclusão**: A exclusão requer que o usuário exista (`NotFoundError`).

### 2. Funcionários (`EmployeesService`)
- **Unicidade**: `matricula` e `cpf` devem ser únicos dentro da empresa (`ConflictError`).
- **Criação/Atualização**:
  - Ao criar ou atualizar, o sistema tenta automaticamente vincular (LINK) refeições pendentes que correspondam à `matricula` do funcionário.
  - A atualização é transacional.
- **Exclusão (`delete`)**:
  - Aceita um parâmetro `mealsAction`:
    - `DELETE`: Remove todas as refeições associadas ao funcionário.
    - Padrão: Mantém as refeições, mas remove o vínculo (`employeeId` torna-se null) e marca o status como `PENDING`.
- **Desligamento (`update` com `dataDemissao`)**:
  - Se um funcionário for desligado (`dataDemissao` preenchida) e `mealsAction` for `UNLINK_IGNORE`, as refeições associadas são marcadas como `ignoredInExport: true`.

### 3. Refeições (`MealsService`)
- **Filtros de Listagem (`getAll`)**:
  - Suporta filtros por `companyId`, `employeeId`.
  - Filtros de data: `date_gte` (maior ou igual) e `date_lte` (menor ou igual). Datas ISO com hora são suportadas.
- **Criação (`create`)**:
  - Funcionário deve existir e pertencer à empresa.
  - Funcionário não pode estar desligado (`dataDemissao` anterior à data da refeição).
  - Previne duplicidade: Não permite criar refeição para o mesmo funcionário na mesma data (`ConflictError`, exceto se a anterior foi deletada?). *Nota: Regra atual lança Conflict se já existir.*
- **Importação em Massa (`importBulk`)**:
  - Processa uma lista de registros.
  - Tenta vincular imediatamente com funcionários pela `matricula`.
  - Registros sem funcionário correspondente são salvos com status `PENDING` (sem `employeeId`).
  - Ignora registros com falha sem abortar todo o processo (retorna status individual).

### 4. Tarefas (`TasksService`)
- **Visibilidade (`getAll`)**:
  - Um usuário vê tarefas se:
    - A tarefa é pública (`isPublic: true`).
    - O usuário é o criador (`ownerUserId`).
    - O usuário é um colaborador (`collaborators`).
- **Colaboradores**:
  - Podem ser adicionados (`connect`) na criação ou redefinidos (`set`) na atualização via `collaboratorUserIds` (array de IDs).
- **Comentários**:
  - Qualquer usuário com acesso à tarefa pode adicionar comentários.
  - Comentários são listados em ordem cronológica.

### 5. Permissões e Perfis (`Permissions/Roles`)
- **Roles**:
  - Podem ter múltiplas permissões associadas via `permissionIds`.
  - Alterações em roles atualizam as relações com permissões.
- **Permissions**:
  - Associadas a uma `Feature` (opcional).
  - CRUD padrão.

### 6. Notificações (`NotificationsService`)
- **Escopo**: Listagem sempre filtrada pelo usuário logado.
- **Status**: Podem ser marcadas como lidas (`read: true`) ou arquivadas (`archived: true`).
- **Imutabilidade**: Geralmente criadas pelo sistema, não editáveis pelo usuário (apenas status).

### 7. Convites (`InvitationsService`)
- **Fluxo**:
  - Admin cria convite com email e role. Gera um token.
  - Usuário valida token (endpoint público).
  - Usuário aceita convite fornecendo nome e senha -> Cria usuário, vincula à empresa e inativa o token.

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
