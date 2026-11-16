# NeuroVita Cliente

MVP administrativo do NeuroVita. O frontend Angular consome a API Spring Boot em `backend/`.
Somente usuários com perfil `ADMINISTRADOR` ou `SECRETARIA` podem entrar. Pacientes,
responsáveis e profissionais são registros gerenciados pela equipe; não recebem contas de acesso.

## Requisitos

- Node.js compatível com Angular 21 e npm
- Java 21
- URI MongoDB configurada em `MONGODB_URI` (o aplicativo não cria ou altera o banco por este README)
- `JWT_SECRET` com pelo menos 32 caracteres

## Desenvolvimento local

Configure as variáveis no ambiente do backend. Para recuperação de senha por email também configure
as variáveis `SMTP_*` esperadas em `backend/src/main/resources/application.properties`; não coloque
credenciais no código.

Em um terminal, inicie a API:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Em outro terminal, inicie o frontend (o proxy local encaminha `/api` para `localhost:8080`):

```powershell
npm ci
npm start
```

Abra <http://localhost:4200>. Não há usuários de demonstração nem senhas fixas. A API valida as
credenciais e o perfil; é necessário que exista um administrador inicial provisionado na instalação.

## Validação

```powershell
npm test
npm run build
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

Os testes de backend que iniciam o contexto completo requerem MongoDB disponível. Não use bancos
reais em testes. O build Angular pode emitir aviso quando o bundle inicial excede o orçamento do
Angular.

## Segurança e configuração

- JWT armazenado na sessão do navegador; o interceptor envia o token para a API.
- Rotas Angular exigem sessão. A API também valida JWT e perfis em cada endpoint protegido.
- Autenticação e gestão de contas são limitadas a `ADMINISTRADOR` e `SECRETARIA`.
- Recuperação e troca de senha usam os fluxos de código existentes no backend.
- `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN` e configuração SMTP são variáveis de ambiente;
  nunca versione valores secretos.

### Conta inicial do administrador

O primeiro administrador deve ser provisionado previamente pela equipe responsável, sem endpoint
público de bootstrap. Para o login funcionar, mantenha registros correspondentes nas coleções
`administradores` e `usuarios`:

- `administradores`: `nome` e `email` preenchidos, `perfil: "ADMINISTRADOR"`; `cpf`, `telefone` e
  `criadoEm` seguem os campos do modelo e podem ser informados quando disponíveis.
- `usuarios`: `nome` e `email` preenchidos (mesmo email do administrador), `perfil: "ADMINISTRADOR"`,
  `ativo: true`, senha no campo `senha` previamente codificada com BCrypt e
  `entidadeId` igual ao `_id` do registro em `administradores`.
- Para login normal, use `senhaProvisoria: false`. Se provisionar `senhaProvisoria: true`, a conta
  precisa concluir a troca de senha inicial; o JWT inicial dura 10 minutos e só autoriza essa troca.
- `tokenVersion` pode iniciar em `0` (ou ser omitido, tratado como zero). `senhaAlteradaEm` é opcional.
- Configure `JWT_SECRET` com pelo menos 32 bytes UTF-8 e mantenha o mesmo segredo entre reinícios
  da mesma instalação para que os tokens emitidos continuem válidos.

Não grave senha em texto claro. Não existe procedimento de provisionamento automatizado neste MVP;
uma conta ausente ou inconsistente exige correção pela equipe responsável pelo ambiente.

## Estrutura

- `src/`: telas e serviços Angular do MVP Cliente.
- `backend/src/main/java`: API Spring Boot, segurança JWT, serviços e acesso MongoDB.
- `backend/src/test/java`: testes unitários e testes que dependem de contexto.
- `proxy.conf.json`: proxy de desenvolvimento para a API local.
