# Comanda Pro — Ativação e Bloqueio com Firebase (Plano Gratuito)

O Comanda Pro opera com todos os dados operacionais (comandas, mesas, pedidos, produtos e financeiro) salvos no `localStorage` do computador local.
Para controle de acesso, liberação e bloqueio de clientes, o sistema consulta a coleção `licencas` diretamente no **Cloud Firestore** no **Plano Spark (100% Gratuito do Firebase)**, sem necessidade de cartão de crédito ou Cloud Functions pagas.

---

## 1. Como Funciona

1. **Localmente:** Os clientes operam o PDV offline/localmente com rapidez sem custos de servidor.
2. **Checagem de Licença:** Ao abrir o sistema ou a cada 5 minutos, o Comanda Pro consulta o Firestore usando a chave de acesso do restaurante (ex: `CP-CLIENTE-01` ou CNPJ).
3. **Bloqueio em Tempo Real:** Se você marcar `ativa: false` ou `bloqueada: true` no Firebase Console, o sistema trava a tela do cliente imediatamente com aviso de bloqueio.
4. **Vencimento Automático:** Se a data do campo `validade` tiver passado, o sistema bloqueia o acesso solicitando renovação.
5. **Tolerância Offline:** Se a internet cair durante o expediente, caixas já ativados continuam funcionando por até 24 horas.

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
3. Adicione os campos:
   - `ativa` (tipo: `boolean`): `true`
   - `cliente` (tipo: `string`): `"Restaurante Exemplo"`
   - `validade` (tipo: `timestamp` ou `string` ISO): `2026-11-30T23:59:59Z`

### Como Bloquear um Cliente Imediatamente
Basta alterar no documento do cliente:
- `ativa`: `false`
- `motivoBloqueio`: `"Mensalidade pendente. Entre em contato com a Conta Bahia."`

Na próxima verificação (ou ao recarregar a página), o Comanda Pro bloqueia a tela e exibe a mensagem configurada.

### Como Renovar um Cliente
Basta atualizar o campo `validade` para o próximo mês (ex: `2026-12-31T23:59:59Z`) e garantir que `ativa: true`.

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
