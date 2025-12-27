# Guia de Testes e Qualidade (QA)

Este documento define os padrões, regras e estratégias para garantir a qualidade do código no projeto **Backend Elementar**.

---

## 1. Princípios Gerais

- **Cobertura**: Buscamos 100% de cobertura em Services e Controllers.
- **Isolamento**: Testes unitários **NUNCA** devem tocar no banco de dados, APIs externas ou sistemas de arquivos.
- **Velocidade**: Testes devem rodar rapidamente. Usamos mocks para tudo que é I/O (Input/Output).

---

## 2. Estratégia de Mocks (A Regra de Ouro)

O projeto utiliza um padrão de **Mock Manual** para o Prisma e outras dependências críticas.

### Prisma (Banco de Dados)

Nunca importe o `prisma` diretamente para usar seus métodos reais em testes unitários.
Em vez disso, use o mock configurado:

1.  **Importe o Mock**:

    ```javascript
    const { mockReset } = require("jest-mock-extended");
    jest.mock("../../utils/prisma"); // Carrega utils/__mocks__/prisma.js
    const prisma = require("../../utils/prisma");
    ```

2.  **Limpe no `beforeEach`**:

    ```javascript
    beforeEach(() => {
      mockReset(prisma);
    });
    ```

3.  **Defina o Comportamento**:
    ```javascript
    prisma.user.findUnique.mockResolvedValue({ id: 1, name: "Teste" });
    ```

---

## 3. Guia de Testes Unitários

### 3.1 Services (`tests/unit/*.service.test.js`)

Testam a regra de negócio pura.

- **O que testar**: Lógica, validações, cálculos e chamadas ao banco (mockadas).
- **Exemplo**:

  ```javascript
  it("deve criar usuário", async () => {
    const data = { email: "a@a.com" };
    prisma.user.create.mockResolvedValue({ ...data, id: 1 });

    const result = await service.create(data);
    expect(result.id).toBe(1);
  });
  ```

### 3.2 Controllers (`tests/unit/controllers/*.controller.test.js`)

Testam a camada HTTP (input/output).

- **Mocks de Dependência**: O Service deve ser mockado.

  ```javascript
  jest.mock("../../../services/users.service");
  const service = require("../../../services/users.service");
  ```

  _Dica: Se tiver problemas de importação, use o factory manual:_

  ```javascript
  jest.mock("../../../services/chat.service", () => ({
    methodName: jest.fn(),
  }));
  ```

- **Helpers HTTP**: Use `tests/utils/httpMocks.js` para criar `req`, `res`, `next`.

  ```javascript
  const {
    mockRequest,
    mockResponse,
    mockNext,
  } = require("../../utils/httpMocks");

  it("deve retornar 200", async () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);

    expect(res.json).toHaveBeenCalledWith([]);
  });
  ```

---

## 4. Guia de Testes de Integração (`tests/integration/*.test.js`)

Testam o fluxo completo da API (Rota -> Middleware -> Controller).
Embora chamem "Integração", ainda mockamos o Prisma para evitar a necessidade de um Docker com Postgres rodando.

- **Ferramenta**: `supertest`.
- **Autenticação**: Gere tokens falsos para testar rotas protegidas.

  ```javascript
  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);

  await request(app)
    .get("/api/rota")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
  ```

---

## 5. Comandos Úteis

- **Rodar todos os testes**:
  ```bash
  npm test
  ```
- **Rodar com relatório de cobertura**:
  ```bash
  npm run test:coverage
  ```
- **Rodar arquivo específico**:
  ```bash
  npm test tests/unit/auth.service.test.js
  ```

---

## 6. Regras de Negócio Cobertas (Coverage Functional)

Além da cobertura de linhas, nossa suíte garante as seguintes regras funcionais críticas:

### 🔒 Autenticação e Segurança

1.  **Bloqueio de Inativos**: Usuários com `isActive: false` são impedidos de logar (Erro: "User is inactive").
2.  **Credenciais Inválidas**: Senha incorreta retorna erro específico ("Invalid credentials").
3.  **RBAC (Controle de Acesso)**:
    - Sem Token -> Retorna **401 Unauthorized**.
    - Com Token mas Sem Permissão -> Retorna **403 Forbidden**.
    - Com Token e Permissão -> Acesso **200 OK**.



### 👥 Gestão de Usuários

1.  **Criptografia**: Ao criar usuário, a senha é sempre hashada (Bcrypt) antes de salvar.
2.  **Proteção de Dados**: O campo `password` é removido das respostas da API (`getAll`, `getById`, `create`).

### 🏢 Corporativo

1.  **Soft Delete**: A inativação de `Users` e `Companies` altera o status (`isActive: false`) em vez de deletar o registro.
2.  **Access Control**: Uma empresa só pode ter um gestor (`role: "gestor"`) e um admin (`role: "admin"`).
3.  **Access Control**: Usuários de uma empresa não podem acessar, criar, editar ou deletar dados de outra empresa.

### 🍽️ Refeições

1.  **Vínculo**: Refeições só podem ser registradas para funcionários ativos e existentes.
2.  **Validação**: Um funcionário não pode registrar mais de uma refeição por dia.
3.  **Validação**: Quando um funcionário inativa-se, suas refeições não são removidas, mas sim marcadas como `isDeleted: true`. 
4.  **Validação**: Nos relatórios, apenas refeições com `isDeleted: false` são consideradas.


