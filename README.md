# NeuroVita Cliente

Aplicacao administrativa NeuroVita com frontend Angular e API Spring Boot/MongoDB. O mesmo
servico Spring Boot atende o frontend compilado e os endpoints `/api`, permitindo publicar ambos
em um unico servico Docker no Render.

Somente usuarios com perfil `ADMINISTRADOR` ou `SECRETARIA` podem entrar. Pacientes, responsaveis
e profissionais sao registros gerenciados pela equipe; nao recebem contas de acesso.

## Estrutura

- `frontend/`: aplicacao Angular, recursos publicos, configuracao e proxy de desenvolvimento.
- `backend/`: API Spring Boot, seguranca JWT, acesso MongoDB e testes.
- `Dockerfile`: build multi-stage do Angular e Java e imagem final de runtime.
- `.dockerignore` e `.gitignore`: exclusao de artefatos e configuracoes locais.

## Tecnologias

- Angular 21, TypeScript e Node.js 22 para o frontend.
- Java 21, Spring Boot e Maven para a API.
- MongoDB para persistencia.
- Docker multi-stage para executar frontend e backend no mesmo servico.

## Requisitos para desenvolvimento

- Node.js 22.12 ou superior na linha 22 e npm.
- JDK 21.
- MongoDB acessivel pela variavel `MONGODB_URI`.
- `JWT_SECRET` com pelo menos 32 bytes UTF-8.

## Configuracao de ambiente

Configure as variaveis no ambiente antes de iniciar o backend. Nao versione arquivos `.env` nem
credenciais. `MONGODB_URI` e `JWT_SECRET` sao obrigatorias. As variaveis SMTP sao usadas pelo
fluxo de recuperacao de senha; o envio fica desativado por padrao.

| Variavel | Obrigatoria | Descricao / padrao |
| --- | --- | --- |
| `MONGODB_URI` | Sim | URI da instancia MongoDB usada pela aplicacao. |
| `JWT_SECRET` | Sim | Segredo JWT de pelo menos 32 bytes UTF-8; mantenha estavel entre reinicios. |
| `PORT` | Render fornece | Porta HTTP; Spring Boot usa `8080` como fallback local. |
| `SMTP_ENABLED` | Nao | Habilita email; padrao `false`. |
| `SMTP_HOST` | Se SMTP habilitado | Servidor SMTP; padrao `localhost`. |
| `SMTP_PORT` | Se SMTP habilitado | Porta SMTP; padrao `587`. |
| `SMTP_USERNAME` | Se exigido pelo SMTP | Usuario SMTP; padrao vazio. |
| `SMTP_PASSWORD` | Se exigido pelo SMTP | Senha SMTP; padrao vazio. |
| `SMTP_AUTH` | Nao | Autenticacao SMTP; padrao `true`. |
| `SMTP_STARTTLS` | Nao | STARTTLS SMTP; padrao `true`. |
| `SMTP_FROM` | Se SMTP habilitado | Remetente; padrao `no-reply@neurovita.local`. |
| `CLIENT_ORIGIN` | Nao | Origem do frontend quando hospedado separadamente; no desenvolvimento o valor padrao e `http://localhost:4200`. O frontend e a API no mesmo dominio nao precisam de CORS. |

Para o desenvolvimento local, defina `MONGODB_URI` e `JWT_SECRET` no ambiente do terminal ou da
IDE. Ao executar o Docker localmente, use um arquivo `.env` local nao versionado com os valores
do seu ambiente.

## Desenvolvimento local

Inicie o backend em um terminal PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Inicie o frontend em outro terminal:

```powershell
cd frontend
npm ci
npm start
```

Abra <http://localhost:4200>. O `frontend/proxy.conf.json` encaminha `/api` para
`http://localhost:8080`; nao configure URLs locais no codigo Angular. Para executar o frontend
pela raiz no VS Code, as tarefas npm em `.vscode/tasks.json` usam `frontend/` como diretorio.

Nao ha usuarios de demonstracao nem senhas fixas. A API valida as credenciais e o perfil; e
necessario que exista um administrador inicial provisionado na instalacao.

## Compilacao e testes

Build de producao Angular:

```powershell
cd frontend
npm ci
npm run build -- --configuration production
```

Compilacao do backend sem iniciar testes que dependem do MongoDB:

```powershell
cd backend
.\mvnw.cmd -DskipTests compile
```

Testes e pacote do backend (os testes que iniciam o contexto requerem MongoDB disponivel):

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd package
```

## Docker local

Na raiz do repositorio, construa a imagem:

```powershell
docker build -t neurovita .
```

Execute o unico servico, expondo a porta 8080 local e fornecendo as variaveis do ambiente:

```powershell
docker run --rm -p 8080:8080 --env-file .env neurovita
```

O Dockerfile compila o Angular em modo de producao, incorpora os arquivos gerados em
`backend/src/main/resources/static/` durante o build, empacota o Spring Boot com Maven e executa
somente o JAR numa imagem Java 21 de runtime. A aplicacao serve `index.html`, recursos estaticos e
rotas do Angular; chamadas relativas a `/api` chegam ao backend no mesmo dominio.

## Publicacao no Render

1. Crie um Web Service no Render conectado ao repositorio.
2. Selecione **Docker** como ambiente e mantenha o diretorio raiz do repositorio.
3. Use o `Dockerfile` da raiz; o comando de inicializacao ja esta definido na imagem.
4. Cadastre no painel do Render `MONGODB_URI` e `JWT_SECRET`. Configure tambem as variaveis SMTP
   se o envio de email for habilitado.
5. O Render fornece `PORT`; o Spring Boot consome essa variavel e usa `8080` como fallback.
6. Garanta que a instancia MongoDB permita conexoes a partir do servico Render.

Variaveis a cadastrar no Render:

- Obrigatorias: `MONGODB_URI`, `JWT_SECRET`.
- Para envio de email: `SMTP_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`,
  `SMTP_PASSWORD`, `SMTP_AUTH`, `SMTP_STARTTLS` e `SMTP_FROM`, conforme o provedor SMTP.
- `PORT` e fornecida pelo Render. `CLIENT_ORIGIN` so e necessaria caso o frontend seja servido
  em outra origem; para esta implantacao de dominio unico, nao precisa ser definida.

Nao coloque valores reais de URI, senhas, tokens ou segredos no repositorio ou na imagem Docker.
Nao ha deploy incluido nestas instrucoes.

## Seguranca e conta inicial

- JWT e armazenado na sessao do navegador; o interceptor envia o token para a API.
- Rotas Angular exigem sessao. A API valida JWT e perfis nos endpoints protegidos.
- Autenticacao e gestao de contas sao limitadas a `ADMINISTRADOR` e `SECRETARIA`.
- Recuperacao e troca de senha usam os fluxos existentes no backend.

O primeiro administrador deve ser provisionado previamente pela equipe responsavel, sem endpoint
publico de bootstrap. Para o login funcionar, mantenha registros correspondentes nas colecoes
`administradores` e `usuarios`:

- `administradores`: `nome` e `email` preenchidos, `perfil: "ADMINISTRADOR"`; `cpf`, `telefone` e
  `criadoEm` seguem os campos do modelo e podem ser informados quando disponiveis.
- `usuarios`: `nome` e `email` preenchidos (mesmo email do administrador), `perfil: "ADMINISTRADOR"`,
  `ativo: true`, senha no campo `senha` previamente codificada com BCrypt e `entidadeId` igual ao
  `_id` do registro em `administradores`.
- Para login normal, use `senhaProvisoria: false`. Se provisionar `senhaProvisoria: true`, a conta
  precisa concluir a troca de senha inicial; o JWT inicial dura 10 minutos e so autoriza essa troca.
- `tokenVersion` pode iniciar em `0` (ou ser omitido, tratado como zero). `senhaAlteradaEm` e opcional.
- Configure `JWT_SECRET` com pelo menos 32 bytes UTF-8 e mantenha o mesmo segredo entre reinicios
  da mesma instalacao para que os tokens emitidos continuem validos.

Nao grave senha em texto claro. Nao existe procedimento de provisionamento automatizado neste MVP;
uma conta ausente ou inconsistente exige correcao pela equipe responsavel pelo ambiente.
