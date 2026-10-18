# Como consultar ou voltar a versões anteriores

## Primeiro: proteja o código E os dados

- No sistema atualizado: **Vendas & Fechamento → Backup do Caixa**. Confira se o JSON foi baixado.
- Git guarda **código**, não as vendas do `localStorage`. Um rollback não recupera vendas apagadas, licença nem configuração do Firebase.
- Anote o commit de partida: `git rev-parse HEAD`. Não use `reset --hard`, `clean -fd` ou force push para simplesmente testar uma versão.
- Nesta sessão, a branch é fixa: `arena/86b95eed-comanda-pro`. Os comandos abaixo não mudam de branch. Execute-os na raiz do repositório, não na subpasta do aplicativo.

## 1. Só olhar uma versão, sem mudar nada (mais seguro)

No GitHub: abra o repositório → lista **Commits** → escolha um commit → **Browse files / Procurar arquivos**. Você verá os arquivos naquela data. Pode baixar o ZIP dessa revisão e abri-lo em outra pasta para comparar; mantenha os dados reais separados.

Pelo terminal:

```sh
git log --oneline --graph -20
git show --stat 5fe18cd
git diff 5fe18cd HEAD -- "restaurant-management-system-development (1)/src"
```

Commits reais consultados nesta revisão:

| Commit | Descrição |
| --- | --- |
| `6b5b117` | Merge do PR #8; base desta sessão |
| `5fe18cd` | Aumenta legibilidade dos números no PDV |
| `66c1fa2` | Aceita a grafia `activa` na licença |
| `895163a` | Liberação pelo campo `ativa`, sem timestamp |
| `ce3d172` | Interface minimalista e remoção do modo demonstração |
| `d0123a8` | Melhorias anteriores do PDV, resumo e observações |

Os comandos de inspeção não incluem alterações ainda não commitadas. Use `git diff` para ver o trabalho local e `git log` para ver os commits da branch. Publicar commits na branch de trabalho ou abrir um pull request não publica esta revisão no Pages; a publicação depende da integração na `main` e do sucesso do deploy.

## 2. Recuperar apenas um arquivo antigo

Antes, se houver alterações locais, guarde-as:

```sh
git status --short
git stash push -u -m "Backup antes de recuperar versao antiga"
```

Então restaure **só o arquivo necessário**, confira o diff e teste:

```sh
git restore --source=5fe18cd -- "restaurant-management-system-development (1)/src/components/tabs/Tab1Pdv.tsx"
git diff
```

Isso pode exigir outras dependências da mesma época. Para descartar apenas essa tentativa, antes de commitá-la, use `git restore -- <caminho-do-arquivo>`. Depois, recupere o trabalho guardado com `git stash apply` — isso preserva o stash por segurança e pode gerar conflitos.

## 3. Restaurar o projeto inteiro a uma revisão antiga, mantendo o histórico

Use quando realmente quiser voltar o **código inteiro**. Confira os arquivos locais e guarde alterações com o stash anterior primeiro. Não execute se houver trabalho que ainda não foi protegido.

```sh
# Na raiz do repositório; continua na mesma branch
git restore --source=5fe18cd --staged --worktree -- .
git diff --cached --stat
cd "restaurant-management-system-development (1)"
npm ci
npm run build
```

Versões antigas podem não ter `npm test` ou `npm run typecheck`. Teste vendas, licença e impressão manualmente antes de publicar. `git restore` não remove arquivos não rastreados e não altera dados do navegador nem os secrets do deploy.

Se a versão estiver correta, volte à raiz, registre e publique **somente na branch da sessão**:

```sh
cd ..
git add -A
git commit -m "Restaura codigo da revisao 5fe18cd"
git push origin arena/86b95eed-comanda-pro
```

Depois, a integração/publicação deve ser feita por revisão de pull request. Não faça push direto na `main`. O workflow atual do Pages publica a partir da `main`; enviar só para a branch da sessão não troca o site em produção.

Se desistir **antes de commitar**, e somente se todas as alterações anteriores estiverem protegidas no stash:

```sh
git restore --source=HEAD --staged --worktree -- .
git stash apply
```

## 4. Desfazer uma mudança específica: revert

Para um commit comum (não merge), com a árvore limpa e alterações atuais protegidas, `git revert <hash>` cria um novo commit que desfaz aquela mudança, preservando o histórico. Exemplo: `git revert 5fe18cd` desfaz o aumento de números do PDV; **não** restaura todo o projeto àquela data. Pode haver conflitos com mudanças posteriores. Leia o diff antes de publicar.

Commits de merge, como `6b5b117`, exigem escolha explícita da linha principal (`-m`). Não use um revert de merge sem revisar os pais e o efeito sobre futuros merges. Em caso de conflito durante um revert, `git revert --abort` cancela a tentativa.

## Commits versus releases

**Commit** é um ponto do histórico. **Tag/release** é uma versão nomeada pelo projeto. Não havia tags na consulta feita nesta revisão. Para publicações futuras, é recomendável criar releases com notas e instruções de migração de dados, após testes e revisão.

**Importante:** voltar o código não garante compatibilidade com os dados locais mais novos. Guarde o backup e confira o relatório `REVISAO-VENDAS.md`, em especial a mudança de snapshot operacional.
