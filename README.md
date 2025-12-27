# Backend Elementar MVP

**API RESTful para a plataforma Elementar UI SaaS**

Este repositório contém o backend da aplicação Elementar, focado em gestão corporativa eficiente, controle de acesso granular (RBAC) e integridade de dados operacionais (RH e Refeitório).

---

## 📚 Índice

1.  [Visão Geral e Arquitetura](#-visão-geral-e-arquitetura)
2.  [Stack Tecnológica](#-stack-tecnológica)
3.  [Instalação e Configuração](#-instalação-e-configuração)
4.  [Segurança e RBAC](#-segurança-e-rbac)
5.  [Documentação da API](#-documentação-da-api)
6.  [Manual de Testes e Qualidade](#-manual-de-testes-e-qualidade)
7.  [Guia de Desenvolvimento de Features](#-guia-de-desenvolvimento-de-features)
8.  [Estrutura do Projeto](#-estrutura-do-projeto)

---

## 🚀 Visão Geral e Arquitetura

O sistema foi projetado para resolver problemas de **segurança** e **escalabilidade** na gestão de múltiplos módulos corporativos.

### Principais Funcionalidades

- **RBAC Dinâmico**: Permissões não são hardcoded no código (exceto checagens). Elas residem no banco e podem ser criadas/atribuídas via API.
- **Multi-Tenancy (Logico)**: Suporte a múltiplas empresas (`Companies`), com isolamento de dados por `companyId`.
- **Integridade de Refeições**: Sistema de snapshots para garantir que o registro de uma refeição mantenha os dados do funcionário (setor/cargo) no momento do consumo, independente de mudanças futuras.
- **Soft Delete**: Entidades como `User` e `Company` possuem inativação lógica (`isActive`), preservando integridade referencial.

---

## 🛠️ Stack Tecnológica

| Camada        | Tecnologia       | Detalhes                                                       |
| :------------ | :--------------- | :------------------------------------------------------------- |
| **Runtime**   | Node.js          | Ambiente de execução JavaScript                                |
| **Framework** | Express.js       | Servidor Web RESTful                                           |
| **Database**  | Prisma ORM       | Cliente de Banco de Dados (SQLite em Dev / PostgreSQL em Prod) |
| **Auth**      | JWT + bcryptjs   | Autenticação Stateless e Hashing de senhas                     |
| **Real-time** | Socket.io        | Chat e Notificações                                            |
| **Testes**    | Jest + Supertest | Suíte de testes (Unitários e Integração)                       |

---

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- NPM ou Yarn

### Passo a Passo

1.  **Clone o repositório**

    ```bash
    git clone https://gitlab.com/guilherme.castelo/backend-elementar.git
    cd backend-elementar
    ```

2.  **Instale as dependências**

    ```bash
    npm install
    ```

3.  **Configuração de Ambiente**
    Crie um arquivo `.env` na raiz do projeto com as seguintes chaves:

    ```env
    PORT=3000
    DATABASE_URL="file:./dev.db"  # Ou sua string de conexão Postgres
    JWT_SECRET="segredo_super_seguro_para_token_jwt"
    NODE_ENV="development"
    ```

4.  **Banco de Dados (Prisma)**
    Execute as migrações e o seed inicial (cria Admin, Roles básicas e Features):

    ```bash
    npx prisma migrate dev --name init
    node prisma/seed.js
    ```

5.  **Executar**
    ```bash
    npm run dev
    ```
    O servidor iniciará em `http://localhost:3000`.

---

## 🔒 Segurança e RBAC

O sistema utiliza um modelo hierárquico: **Feature -> Permission -> Role -> User**.

### Fluxo de Autenticação e Autorização

1.  **Login**: O usuário envia credenciais. O sistema valida e retorna um **Token JWT**.

    - _Payload do Token_: Contém `id`, `email` e `role`.
    - _Simultaneamente_: O backend busca todas as permissões (slugs) associadas ao Role do usuário no banco.

2.  **Proteção de Rotas**:
    O middleware `checkPermission` intercepta requisições protegidas.

    ```javascript
    // Exemplo: Apenas quem tem a permissão 'user:create' passa.
    router.post(
      "/",
      authGuard,
      checkPermission("user:create"),
      userController.create
    );
    ```

3.  **Inativação (`isActive: false`)**:
    - Bloqueia login imediatamente.
    - Bloqueia requisições de tokens antigos (o middleware `auth.js` verifica o status no banco a cada request).

### Principais Slugs de Permissão

| Slug             | Descrição                           |
| :--------------- | :---------------------------------- |
| `feature:manage` | Criar/Editar módulos do sistema     |
| `role:manage`    | Criar Roles e atribuir permissões   |
| `user:create`    | Cadastrar novos usuários            |
| `meal:register`  | Registrar refeição (Tablet/Sistema) |

---

## 📖 Documentação da API

Principais endpoints disponíveis. Para a documentação completa, consulte a coleção do Postman (export disponível na pasta `/docs`).

### Autenticação

- `POST /auth/login`: Autentica e retorna Token + Permissões.
- `GET /auth/me`: Retorna dados do usuário logado.

### Gestão Corporativa

- **Empresas** (`/companies`)
  - `POST /`: Criar empresa.
  - `PATCH /:id/inactivate`: Inativar empresa.
- **Usuários** (`/users`)
  - `POST /`: Criar usuário Admin/Gestor.
  - `PATCH /:id/inactivate`: Inativar acesso.

### RBAC (Admin)

- **Features** (`/features`): Gestão de módulos.
- **Permissions** (`/permissions`): Gestão de ações possíveis.
- **Roles** (`/roles`): Criação de perfis (ex: "RH", "Portaria") e vínculo com permissões.

---

## 🧪 Manual de Testes e Qualidade

O projeto mantém uma política de qualidade focada na estabilidade dos serviços críticos (`Auth`, `Roles`, `Financial`).

### Executando Testes

```bash
# Rodar todos os testes
npm test

# Rodar com relatório de cobertura (Coverage)
npm run test:coverage

# Rodar um arquivo específico
npm test tests/unit/auth.service.test.js
```

### Arquitetura de Testes (Jest)

1.  **Unitários (`/tests/unit`)**: Testam a lógica de negócio dos Services (`services/*.js`).

    - **Mocking**: Utilizamos um **Manual Mock** do Prisma para evitar conexões reais e garantir velocidade.
    - O mock reside em: `utils/__mocks__/prisma.js`.

2.  **Integração (`/tests/integration`)**: Testam o contrato da API (`routes` -> `controllers`).
    - Validam respostas HTTP (200, 403, 400).
    - Validam se o middleware de permissão está bloqueando acessos indevidos.

> **Importante**: Ao criar novos testes, sempre importe o Prisma mockado:
> `jest.mock('../../utils/prisma');`

---

## 💻 Guia Prático: Implementando uma Nova Feature (Ex: Produtos)

Este guia serve como referência absoluta para desenvolvedores e IAs. Siga este fluxo para garantir consistência, segurança e qualidade.

### Cenário

Queremos criar um **CRUD de Produtos** (`Products`).
Permissões necessárias: `product:read`, `product:create`.

---

### Passo 1: Banco de Dados (Prisma)

1.  Edite o arquivo `prisma/schema.prisma` e adicione o modelo:
    ```prisma
    model Product {
      id          Int      @id @default(autoincrement())
      name        String
      price       Decimal
      isActive    Boolean  @default(true)
      companyId   Int
      company     Company  @relation(fields: [companyId], references: [id])
    }
    ```
2.  Gere a migração:
    ```bash
    npx prisma migrate dev --name create_products_table
    ```

---

### Passo 2: Camada de Service (`services/products.service.js`)

Crie a lógica de negócio. **Não** receba `req` ou `res` aqui. Receba dados puros.

```javascript
const prisma = require("../utils/prisma"); // Singleton do Prisma

class ProductsService {
  async create(data) {
    // Validações de negócio aqui
    if (data.price < 0) throw new Error("Preço inválido");

    return prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        companyId: data.companyId,
      },
    });
  }

  async getAll(companyId) {
    return prisma.product.findMany({ where: { companyId } });
  }
}

module.exports = new ProductsService();
```

---

### Passo 3: Camada de Controller (`controllers/products.controller.js`)

Gerencia a entrada HTTP e chama o Service.

```javascript
const productsService = require("../services/products.service");

class ProductsController {
  async create(req, res, next) {
    try {
      const { name, price } = req.body;
      const companyId = req.user.companyId; // Obtido do Token

      const product = await productsService.create({ name, price, companyId });
      return res.status(201).json(product);
    } catch (error) {
      next(error); // Passa para o Error Handler global
    }
  }
}

module.exports = new ProductsController();
```

---

### Passo 4: Rotas e Segurança (`routes/products.routes.js`)

Defina os endpoints e proteja com **Auth Guard** e **Permission Check**.

```javascript
const express = require("express");
const router = express.Router();
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const productsController = require("../controllers/products.controller");

// Rota POST protegida pela permissão 'product:create'
router.post(
  "/",
  authGuard,
  checkPermission("product:create"),
  productsController.create
);

module.exports = router;
```

> **Não esqueça**: Registre a nova rota no `app.js`: `app.use('/products', productsRoutes);`

---

### Passo 5: Testes Unitários (`tests/unit/products.service.test.js`)

**OBRIGATÓRIO**: Antes de considerar pronto, escreva o teste unitário.

```javascript
const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma"); // <--- IMPORTANTE: Use o mock manual

const prisma = require("../../utils/prisma");
const productsService = require("../../services/products.service");

describe("ProductsService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  it("deve criar um produto", async () => {
    const data = { name: "Prod A", price: 10, companyId: 1 };
    // Define o retorno esperado do mock do banco
    prisma.product.create.mockResolvedValue({ id: 1, ...data });

    const result = await productsService.create(data);

    expect(result.id).toBe(1);
    expect(prisma.product.create).toHaveBeenCalled();
  });
});
```

---

### Passo 6: Cadastro no Sistema (RBAC)

O código está pronto, mas ninguém tem acesso ainda. Você precisa "avisar" o sistema que essa feature existe.
Faça estas chamadas via Postman/Insomnia (ou via interface admin quando existir):

1.  **Criar a Feature**:
    - `POST /features`
    - Body: `{ "name": "Gestão de Produtos", "slug": "products" }`
2.  **Criar a Permissão**:
    - `POST /permissions`
    - Body: `{ "name": "Criar Produtos", "slug": "product:create", "featureId": ID_DA_FEATURE }`

### Passo 7: Liberar Acesso

1.  **Atribuir ao Role**:
    - Identifique o Role (ex: Gestor, ID 2).
    - `PUT /roles/2`
    - Body: `{ "permissions": { "connect": [{ "id": ID_DA_PERMISSAO }] } }`

**Pronto!** Agora qualquer usuário com o cargo "Gestor" pode acessar `POST /products`.

---

## 📂 Estrutura do Projeto

```
backend-elementar/
├── config/             # Variáveis globais e constantes
├── controllers/        # Controladores (Validação básica + Chamada de Serviço)
├── middlewares/        # Auth, Permission, Error Handling
├── prisma/             # Schema.prisma, Migrations e Seeds
├── routes/             # Definição de rotas do Express
├── services/           # Regras de Negócio (Core da aplicação)
├── tests/              # Suíte de Testes (Unitários e Integração)
│   ├── integration/
│   └── unit/
└── utils/              # Helpers, Logger e Mocks (__mocks__)
```
