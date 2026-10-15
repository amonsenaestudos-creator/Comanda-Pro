# Comanda Pro — Ativação e Bloqueio com Firebase (Plano Gratuito)

O Comanda Pro opera com todos os dados operacionais (comandas, mesas, pedidos, produtos e financeiro) salvos no `localStorage` do computador local.
Para controle de acesso, liberação e bloqueio de clientes, o sistema consulta a coleção `licencas` diretamente no **Cloud Firestore** no **Plano Spark (100% Gratuito do Firebase)**, sem necessidade de cartão de crédito ou Cloud Functions pagas.

---

## 1. Como Funciona

1. **Localmente:** Os clientes operam o PDV offline/localmente com rapidez sem custos de servidor.
2. **Única regra de liberação:** o campo **`ativa`** do documento. `ativa: true` → o caixa
   funciona; `ativa: false` (ou campo ausente / qualquer outro valor) → o caixa não funciona e
   fica na tela de bloqueio.
3. **Sem data de validade:** o sistema **não** consulta timestamp nenhum. Não existe bloqueio por
   vencimento nem renovação automática por data — quem liga e desliga o caixa é apenas o booleano
   `ativa`. Se existir um campo `validade` no documento, ele é ignorado.
4. **Checagem:** ao abrir o sistema, a cada **2 minutos**, e sempre que a janela do caixa volta a
   ficar visível ou recebe foco, o Comanda Pro relê `licencas/{chave}` no Firestore. Trocou
   `ativa` para `false` no Firebase Console? O caixa bloqueia sozinho na próxima checagem.
5. **Kill switch extra (opcional):** `bloqueada: true` também trava, mesmo com `ativa: true`.
6. **Tolerância Offline:** se a internet cair durante o expediente, caixas já liberados continuam
   funcionando por até **24 horas** desde a última confirmação; depois disso é preciso reconectar
   para validar de novo. (É tolerância de conexão, não validade da licença.)

---

## 2. Como Configurar o Firebase (Plano Gratuito)

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um projeto gratuito.
2. No menu lateral, clique em **Criação > Firestore Database** e clique em **Criar banco de dados** (escolha modo produção e região `southamerica-east1` ou `us-central1`).
3. Vá na aba **Regras (Rules)** do Firestore e cole as seguintes regras:
   ```javascript
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       // Permite ler apenas o documento da chave digitada;
       // Impede listar toda a coleção para proteger os dados de outros clientes.
       // Impede qualquer alteração pelo navegador do cliente.
       match /licencas/{chave} {
         allow get: if true;
         allow list, write: if false;
       }

       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
   Clique em **Publicar**.

4. Vá em **Configurações do Projeto (ícone de engrenagem) > Geral > Seus aplicativos** e adicione um aplicativo **Web**.
5. Copie os dados fornecidos e adicione no seu arquivo `.env.local` (ou nos Secrets do GitHub se usar o GitHub Pages):
   ```env
   VITE_FIREBASE_API_KEY=sua-api-key
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_APP_ID=seu-app-id
   ```

---

## 3. Como Cadastrar, Liberar ou Bloquear Clientes

No próprio **Firebase Console > Firestore Database**:

### Criar uma Licença para um Cliente
1. Clique em **Iniciar coleção** com o ID: `licencas`.
2. No **ID do documento**, coloque a chave do cliente em letras maiúsculas (exemplo: `CP-REST-BAHIA` ou o CNPJ do cliente `12345678000190`).
3. Adicione os campos (só estes três importam):
   - `ativa` (tipo: `boolean`): **`true`** — é o interruptor do caixa
   - `cliente` (tipo: `string`): `"Restaurante Exemplo"` — nome exibido no topo do sistema
   - `motivoBloqueio` (tipo: `string`, opcional): mensagem mostrada na tela quando `ativa` for `false`

   > Não precisa criar campo de validade/data. Se você criar um `validade`, o sistema ignora.

### Como Bloquear um Cliente Imediatamente
No documento do cliente, deixe:
- `ativa`: `false`
- `motivoBloqueio`: `"Mensalidade pendente. Entre em contato com a Conta Bahia."` (opcional)

Em até 2 minutos (ou ao recarregar a página / voltar para a janela do caixa) o Comanda Pro trava a
tela e mostra a mensagem configurada. Para bloqueio manual de uma máquina específica, apague o
`localStorage` do navegador daquele caixa.

### Como Reativar um Cliente
Troque `ativa` de volta para `true`. Não há data para atualizar, nem renovação para registrar: o
caixa volta a funcionar sozinho na próxima checagem.

### Tabela de Decisão (regra completa do app)

| Documento em `licencas/{chave}` | O caixa... |
| --- | --- |
| `ativa: true` | **funciona** — mesmo que exista um `validade` atrasado |
| `ativa: false` | bloqueado: "Esta licença está desativada (ativa: false)..." |
| `ativa` ausente | bloqueado (mesma mensagem) |
| `ativa: "false"` / `0` / `""` | bloqueado |
| `ativa: 1` / `"true"` / `"sim"` | funciona (o app é tolerante a tipos) |
| `bloqueada: true` (com `ativa: true`) | bloqueado — kill switch da administração |
| `motivoBloqueio: "..."` (bloqueado) | mostra exatamente esse texto |
| documento inexistente | "Chave de licença não encontrada no servidor..." |
| sem internet | funciona por até 24h desde a última confirmação, depois exige reconexão |

> A liberação é lida **direto do documento** no Firestore. O caminho opcional por Cloud Function
> (`functions/`, com `ativarLicenca`, `assinaturas`, `deviceBindings` e período mensal) não é
> chamado por esta versão do app — ele continua lá apenas como alternativa de ativação com App
> Check e limite de aparelhos, caso você queira migrar para ele no futuro.

---

## 4. Tela do Caixa: aparência e atalhos (v2.1)

Todas as preferências da Frente de Caixa ficam guardadas no `localStorage`
junto com os demais dados do estabelecimento (`comandapro_config_v2`) e podem
ser mexidas de dois lugares:

- **Botão "Ajustes rápidos"** na própria Frente de Caixa (Aba 1) — para o
  operador ajustar na hora, sem sair do caixa.
- **Aba Configuração (Aba 4)**, primeira seção *"Tela do Caixa — aparência,
  atalhos e menu"* — onde estão as opções completas.

Opções disponíveis:

| Opção | Efeito |
| --- | --- |
| Tema da tela | Claro / **Escuro** (melhor no balcão à noite) |
| Tamanho da letra | Padrão / Grande / Extra (total, preços e itens crescem) |
| Espaçamento | Confortável / **Compacto** (cabe mais coisa na tela) |
| Botões do cardápio | Produto maior ou mais itens por linha |
| Modo Caixa | Menu lateral mostra só Frente de Caixa, Pagamentos, Relatórios e Resumo |
| Telas do menu | Esconde/reesconde individualmente as abas que o caixa não usa |
| O que aparece na comanda | Estoque, EAN, setor, preço unitário, observação do item, observação da mesa, botão da cozinha, botão de imprimir, consulta de preço |
| Quantidades rápidas | Botões de 1 toque (padrão `1, 2, 3, 5`) |
| Enter lança o primeiro da busca | Digite/bipe e Enter, sem tirar a mão do teclado |
| Confirmar antes de limpar a mesa | Evita apagar a comanda sem querer |

Atalhos de teclado na Frente de Caixa:

- `F1` Frente de Caixa &nbsp;•&nbsp; `F2` ir para o Pagamento &nbsp;•&nbsp; `F11` Resumo do Caixa
- `Enter` no campo de busca lança o primeiro produto encontrado
- `Alt + ←` / `Alt + →` troca de mesa
- `Esc` limpa a busca (e fecha a janela de ajustes)

> Ao ativar o **Modo Caixa**, se o operador estiver em uma tela que foi
> escondida, o sistema volta sozinho para a Frente de Caixa.
