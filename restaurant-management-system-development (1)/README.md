# Comanda Pro — ativação mensal com Firebase

O sistema mantém as dez telas e funções existentes. Antes de abrir o caixa, agora exige uma chave mensal emitida pela Conta Bahia. A tela de ativação só libera o PDV depois de uma validação no Firebase; a chave digitada não é persistida no `localStorage` nem no Firestore.

> **Importante:** a parte visual do Comanda Pro continua sendo uma aplicação web estática. Nenhuma trava feita apenas no navegador é impossível de contornar por alguém que controle o próprio computador. A solução abaixo dificulta a liberação casual, mantém a base de chaves no servidor e assina as autorizações. Para impedir alterações deliberadas no JavaScript, os dados e operações que precisem de proteção comercial real também teriam de ser movidos para um backend. Os cadastros e vendas que já existiam continuam no `localStorage` do caixa.

## Como a licença funciona

1. A empresa emite uma chave aleatória `CP-XXXXX-XXXXX-XXXXX-XXXXX` para um período mensal.
2. O usuário informa a chave na tela de ativação. O navegador chama a Cloud Function com Firebase App Check; não consulta nem lê o Firestore diretamente.
3. A função usa um segredo privado para calcular o HMAC da chave e consulta `chavesLicenca` e `assinaturas` com o Firebase Admin SDK. A chave em texto puro **não é gravada** no banco.
4. Se a licença estiver vigente, ativa e corresponder ao período atual, a função vincula o primeiro caixa disponível à assinatura. O limite inicial é **um caixa por assinatura**.
5. O servidor devolve um token opaco e uma autorização RS256 assinada, válida por até 12 horas ou até o vencimento da licença (o que ocorrer primeiro). O navegador guarda esses itens, nunca a chave mensal.
6. A autorização é revalidada ao abrir o sistema, ao voltar à aba e a cada cinco minutos. Sem internet, um caixa já ativado pode continuar usando o sistema até o vencimento da autorização offline, por no máximo 12 horas. Nova ativação sempre exige internet.
7. Ao emitir a próxima chave mensal para a mesma assinatura, a chave anterior é substituída e deixa de autorizar novas verificações. O usuário informa a chave nova para continuar.

As regras do Firestore negam toda leitura e escrita do navegador. As Cloud Functions usam credenciais administrativas, protegidas no servidor, para acessar os documentos.

### Estrutura do Firestore

O controlador cria os documentos automaticamente; **não crie chaves manualmente no Console**. Os IDs de documentos são HMACs e não contêm a chave em texto puro.

| Caminho | Campos principais | Uso |
| --- | --- | --- |
| `assinaturas/{id}` | `active`, `restaurantName`, `currentKeyHash`, `currentPeriodId`, `validUntil` (Timestamp), `maxDevices`, `activeDeviceCount` | Estado e vencimento da assinatura do restaurante. |
| `chavesLicenca/{hmac}` | `status`, `subscriptionId`, `periodId`, `validFrom` e `expiresAt` (Timestamps), `createdAt` | Hash HMAC da chave mensal, nunca a chave legível. |
| `ativacoesComanda/{hmac}` | `active`, `subscriptionId`, `keyHash`, `deviceDocumentId`, `deviceHash`, `periodId`, `createdAt` | Registro de uma credencial de ativação; o token puro não é armazenado. |
| `assinaturas/{id}/dispositivos/{hmac}` | `active`, `deviceHash`, `activeTokenHash`, `periodId`, `activatedAt`, `updatedAt` | Vínculo do caixa à assinatura e limite de dispositivos. |

Os campos `currentKeyHash` e os IDs HMAC são produzidos pelo controlador com `LICENSE_PEPPER`. As Rules abaixo fecham todo o banco para clientes Web; Admin SDK das Functions e do controlador continua tendo acesso.

## 1. Criar e preparar o projeto Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e cadastre um **aplicativo Web**.
2. Crie o banco **Cloud Firestore** em modo produção, de preferência na região `southamerica-east1` para manter o serviço próximo aos usuários da Bahia.
3. Ative faturamento conforme exigido pelo Firebase para Cloud Functions e confira os preços/cotas atuais do projeto.
4. Ative o Firebase App Check para o aplicativo Web usando um provedor reCAPTCHA v3. Cadastre o domínio real em que o Comanda Pro será publicado (por exemplo, `amonsenaestudos-creator.github.io`) e anote a **site key** pública.
5. Em uma máquina administrativa, instale o Firebase CLI e autentique-se:

   ```bash
   npm install -g firebase-tools
   firebase login
   cd "restaurant-management-system-development (1)"
   firebase use --add
   ```

   Selecione o projeto criado. O arquivo `.firebaserc` é local e está ignorado pelo Git.

## 2. Criar as chaves criptográficas do controlador

A chave RSA privada e o segredo HMAC ficam somente no Secret Manager/Firebase e no ambiente administrativo seguro. **Não** os coloque em arquivos `VITE_*`, no GitHub, no navegador, no Firestore ou neste repositório.

Em uma pasta segura **fora do repositório**, gere um segredo HMAC e um par RSA:

```bash
openssl rand -base64 48
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out comanda-licenca-private.pem
openssl pkcs8 -topk8 -nocrypt -in comanda-licenca-private.pem -outform DER | base64 -w0
openssl pkey -in comanda-licenca-private.pem -pubout -outform DER | base64 -w0
```

Guarde as saídas:

- A primeira linha aleatória é o `LICENSE_PEPPER`.
- A segunda é a chave privada PKCS#8 em DER/Base64, para `LICENSE_SIGNING_PRIVATE_KEY`.
- A terceira é a chave pública DER/Base64, para `VITE_LICENSE_PUBLIC_KEY_DER_BASE64`. A chave pública pode ser incluída no build do navegador; a privada, nunca.

No macOS, se `base64 -w0` não existir, remova as quebras de linha com `base64 | tr -d '\n'`.

Cadastre os dois segredos no Firebase Secret Manager (o CLI solicita o valor):

```bash
firebase functions:secrets:set LICENSE_PEPPER
firebase functions:secrets:set LICENSE_SIGNING_PRIVATE_KEY
```

Para emitir chaves pela ferramenta administrativa, o mesmo `LICENSE_PEPPER` também precisa estar disponível apenas no ambiente seguro da máquina que executa o controlador. Não o salve no projeto. Em um shell Bash, o Firebase CLI pode fornecer a versão ativa sem colocá-la no histórico:

```bash
export LICENSE_PEPPER="$(firebase functions:secrets:access LICENSE_PEPPER)"
export FIREBASE_PROJECT_ID="seu-id-de-projeto"
```

Proteja o arquivo RSA privado original e faça uma cópia de segurança segura. Sem a chave privada, não será possível assinar novas autorizações. Sem o HMAC original, não será possível emitir chaves compatíveis com os documentos já criados.

## 3. Configurar Firebase App Check e o build Web

Copie `.env.example` para `.env.local` (desenvolvimento) ou `.env.production.local` (build de produção) e preencha os valores da configuração do aplicativo Web no Firebase Console:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-id-de-projeto
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_FUNCTIONS_REGION=southamerica-east1
VITE_RECAPTCHA_V3_SITE_KEY=...
VITE_LICENSE_PUBLIC_KEY_DER_BASE64=...
```

A configuração Firebase do cliente, a site key do reCAPTCHA e a chave pública são visíveis no bundle por natureza. Isso é esperado; **a segurança não depende de esconder a API key do Firebase**. Ela depende das regras do Firestore, App Check e dos segredos do servidor.

Em desenvolvimento local, o App Check precisa de um token de depuração registrado em Firebase Console → App Check → tokens de depuração. Temporariamente, adicione ao `.env.local`:

```env
VITE_APPCHECK_DEBUG_TOKEN=true
```

Inicie `npm run dev`, copie o token mostrado no console do navegador para o Firebase Console e substitua `true` pelo token registrado. Tokens de depuração são sensíveis e **nunca devem entrar em um build público**. Remova `VITE_APPCHECK_DEBUG_TOKEN` da configuração de produção.

No GitHub Pages, forneça as variáveis `VITE_*` durante o build da aplicação. Elas precisam estar disponíveis quando `npm run build` executa; adicioná-las depois do build não altera o arquivo estático publicado. Não configure `LICENSE_PEPPER`, `LICENSE_SIGNING_PRIVATE_KEY` ou credenciais administrativas como variáveis `VITE_*`.

## 4. Instalar e publicar as funções e as regras

Na pasta do projeto:

```bash
npm install
npm --prefix functions install
npm --prefix functions run build
firebase deploy --only firestore:rules,functions
```

O deploy publica duas Callable Cloud Functions protegidas por App Check (`ativarComanda` e `consultarAtivacaoComanda`) e regras que bloqueiam qualquer acesso direto ao Firestore pelo navegador. As funções rodam em `southamerica-east1` e têm limite de instâncias para conter picos de chamadas.

Antes de publicar para os usuários, confirme no Firebase Console que ambos os segredos estão disponíveis para a versão implantada, que o App Check reconhece o domínio de produção e que o Firestore está em modo produção.

## 5. Emitir, renovar, revogar e liberar caixas

O controlador de chaves está em `functions/scripts/manage-licenses.mjs`. Ele usa o Firebase Admin SDK e Application Default Credentials; não existe uma função pública para criar chaves.

Para que o Firebase Admin SDK do script tenha acesso ao Firestore, use Application Default Credentials de uma conta administrativa:

```bash
gcloud auth application-default login
```

Como alternativa, defina `GOOGLE_APPLICATION_CREDENTIALS` para um JSON de service account guardado fora do repositório e com apenas as permissões administrativas necessárias. O `firebase login` do CLI, sozinho, não fornece credenciais ADC ao script Node.

Na primeira emissão, não informe `--subscription-id`; guarde o ID impresso para renovações futuras:

```bash
cd functions
npm run license -- create \
  --name "Restaurante Exemplo" \
  --period 2026-10 \
  --expires-at 2026-11-01T03:00:00.000Z \
  --max-devices 1
```

`2026-11-01T03:00:00.000Z` representa 1º de novembro à meia-noite no horário de Brasília (UTC-3). Ajuste o vencimento e o período para o mês correto. O script mostra a chave **uma única vez**: copie-a e entregue-a ao cliente por um canal seguro. O texto puro não fica no Firestore, portanto não pode ser recuperado pelo controlador.

Para renovar, use o mesmo ID de assinatura e um período/vencimento novos. A nova chave passa a ser a atual e invalida a anterior:

```bash
npm run license -- create \
  --subscription-id "ID-IMPRESSO-NA-PRIMEIRA-EMISSAO" \
  --name "Restaurante Exemplo" \
  --period 2026-11 \
  --expires-at 2026-12-01T03:00:00.000Z \
  --max-devices 1
```

Revogar a assinatura bloqueia o acesso na próxima verificação online (um caixa offline pode usar a autorização já assinada até o vencimento dela, no máximo 12 horas):

```bash
npm run license -- revoke --subscription-id "ID-DA-ASSINATURA"
```

Se o cliente trocar de computador ou limpar os dados do navegador, libere os vínculos de dispositivos antes de ativar o novo caixa. O vínculo antigo deixa de funcionar:

```bash
npm run license -- reset-devices --subscription-id "ID-DA-ASSINATURA"
```

A partir daí, o primeiro dispositivo que informar uma chave vigente ocupará a vaga. Faça essas operações apenas em uma máquina confiável com permissão administrativa no Firebase.

## Variáveis privadas e o que não fazer

- **Nunca** coloque a chave mensal em código-fonte, `.env` versionado, URL, logs, Analytics ou em `localStorage`.
- **Nunca** publique `LICENSE_PEPPER`, `LICENSE_SIGNING_PRIVATE_KEY`, a chave RSA privada ou JSON de service account.
- Não crie uma API pública para listar/consultar documentos `chavesLicenca`.
- Não abra as regras do Firestore com `allow read, write: if true`. As Functions usam Admin SDK e continuam funcionando com a regra fechada.
- `VITE_FIREBASE_API_KEY` é identificador público do cliente Firebase, não senha. Restringir a chave por APIs/domínios no Google Cloud é uma camada adicional, mas não substitui as regras do Firestore/App Check.
- Se o usuário apagar o armazenamento do navegador, o vínculo de dispositivo permanece no servidor por segurança. Use `reset-devices` para liberar a vaga.

## Limite de segurança do modelo Web

O gate impede o uso normal antes da validação e o servidor não confia em uma flag local como `licensed=true`. Ainda assim, código e armazenamento de uma SPA estão sob controle do usuário do computador: alguém experiente pode modificar o bundle, o relógio do dispositivo ou copiar um perfil do navegador. Uma autorização offline também implica uma janela de revogação de até 12 horas. App Check e as Functions reduzem abuso e protegem o cadastro de licenças, mas não tornam o JavaScript inviolável.

Este projeto ainda guarda comandas, vendas, produtos e cadastros no `localStorage`, como antes. Proteja o login do sistema operacional e o computador do caixa; não considere o gate de licença criptografia para os dados locais. Para bloquear de fato operações sem licença, o próximo passo é mover os dados e as operações críticas para uma API/Firestore com validação da assinatura em cada operação, ou distribuir uma aplicação gerenciada/nativa com controles adicionais.
