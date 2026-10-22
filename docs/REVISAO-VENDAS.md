# Revisão do Comanda Pro — vendas, impressão e interface

Data: 18/10/2026. Revisão de código e testes automatizados; **não é uma garantia de ausência de todos os defeitos**.

## Incremento: PDV completo (referência de restaurante moderno)

**Interface mais próxima das referências** (dashboard de delivery + tela de PDV):
- Faixa de cartões de estatística no caixa: **Vendas hoje**, **Comandas abertas**, **Itens na comanda** e **Ticket médio** (estilo "Total Sale").
- Seletor segmentado de **atendimento: Mesa / Balcão / Delivery** (equivalente a Dine In / Takeaway / Delivery).
- Réguas de **comandas abertas** estilo abas: número da comanda (`#123`), mesa, cliente, valor e status (Em andamento / Enviado à cozinha / Conta pedida).
- Painel da comanda com **cliente, telefone, endereço de entrega**, **cupom de desconto** (ex.: `SABOR10`), subtotal e botão grande **Processar Pagamento**.
- Cabeçalho passou a mostrar o **total vendido no dia**.

**Funções de PDV adicionadas** (o sistema agora cobre a operação completa):
- **Comandas avulsas de Balcão e Delivery** com número sequencial próprio, cliente/telefone/endereço, envio incremental à cozinha e fechamento normal (a venda remove a comanda).
- **Cupons de desconto** cadastrados em Configuração (código + %, ativar/excluir), aplicados no PDV e levados para o pagamento.
- **Mover comanda** entre mesas (itens, cliente, atendente e envios acompanham).
- **Dividir comanda**: itens marcados viram uma nova comanda de Balcão.
- **Cancelamento de item já enviado à cozinha**: o KDS registra o cancelamento com motivo (auditoria visível na aba Cozinha & Delivery).
- **Pedir conta** direto do PDV; **numeração de comanda** sequencial compartilhada entre mesas e comandas avulsas.
- Estoque considera itens reservados em **todas** as comandas (mesas + avulsas).
- Relatórios/Financeiro/Resumo exibem a origem amigável (`Balcão #3`, `Delivery #12`) em vez de identificadores internos.

**Validação**: `npm test` (22 testes — 7 novos cobrindo balcão, delivery, cupom, mover, dividir, cancelamento na cozinha e numeração), `npm run typecheck`, `npm run build` e `npm audit` (0 vulnerabilidades).

**Limites**: cupom é percentual simples (sem regras de validade/usos); dividir gera comanda de Balcão (não fraciona por pagadores na mesma mesa — use as parcelas do checkout); cancelamento de item enviado é registro de auditoria, não estorna produção automaticamente.

## Problemas encontrados e corrigidos

| Área | Falha anterior | Correção |
| --- | --- | --- |
| Impressão | Cupom dentro de `.no-print`, cujo `display:none` também ocultava os filhos | Modal em portal direto no `body`; CSS isola o cupom e remove limites de rolagem na impressão |
| Bobina | Largura fixa de 80 mm, embora a interface anunciasse 58/80 mm | Seletor de 58 ou 80 mm, com preferência salva; quebra de descrições longas |
| Reimpressão | Usava a data atual, não a data original da venda | Data original transmitida ao comprovante; observações preservadas |
| F2 / menu Pagamentos | Apenas trocava de aba; não preparava a mesa atual | Navegação monta o checkout da mesa selecionada |
| Valores | Tolerância de um centavo permitia concluir venda incompleta | Comparação em centavos; validação do total e de cada pagamento |
| Parcelas | Alterações de taxas/desconto podiam deixar pagamentos incompatíveis | Parcelas são limpas quando o cálculo muda; pagamentos não passam para outra comanda |
| Dinheiro | Aceitava parcela acima do saldo e reduzia silenciosamente o valor; troco podia sobreviver sem parcela em dinheiro | Parcela deve corresponder ao saldo; dinheiro entregue tem campo próprio e validação |
| Configuração | `valor || padrão` substituía taxa/imposto/desconto zero | Zero respeitado com `??`; atalhos de desconto obedecem ao limite |
| PIX | SVG decorativo e payload sem CRC/comprimentos corretos | QR Code gerado do payload BR Code, com TLV, CRC16 e valor da parcela |
| Conclusão | Estado era atualizado sem verificar gravação, estoque não era baixado | Validação de comanda, pagamento e estoque; gravação conjunta de venda/estoque/mesa antes da confirmação |
| Duplicidade | Identificadores usavam apenas os últimos dígitos do relógio | UUID; bloqueio de clique repetido e validação de venda já existente |
| Estoque | Lançamentos ignoravam disponibilidade | Verifica produtos reservados nas mesas; baixa só ao concluir a venda |
| Cozinha | Cada envio repetia a comanda completa | Por mesa/linha, registra a quantidade enviada e envia só os acréscimos |
| Observações | Item sem observação podia ser somado a item com observação | Agrupamento somente com a mesma observação normalizada |
| Mesas | Liberação manual apagava itens não pagos | Bloqueio da liberação enquanto existirem itens; cancelamento continua explícito no PDV |
| Histórico | “Novo dia” apagava todas as vendas | Substituído por download de backup, sem apagar histórico |
| Datas | Filtro comparava data UTC com dia local | Filtro usa o dia local, inclusive para vendas noturnas |
| Instalação | Inicialização fabricava vendas, pedidos de cozinha e mesas ocupadas | Instalação nova começa sem movimentação; registros já existentes são preservados |
| Armazenamento | Falhas eram apenas registradas no console | Alerta ao operador; venda não confirma se a gravação conjunta falhar |
| Abas simultâneas | Uma aba podia sobrescrever silenciosamente a outra | Detecta mudança externa, bloqueia a área operacional e pede recarga; não substitui suporte multiusuário |
| Dependências | Audit reportava 2 vulnerabilidades de alta severidade relacionadas a gRPC | Override de versão corrigida; auditoria local passou sem vulnerabilidades |

## Interface

Adotada a organização das referências de restaurante: cardápio à esquerda e comanda à direita em telas grandes, categorias com ícones, cartões com ilustrações vetoriais leves, preço em destaque e botão de pagamento no resumo da comanda. Em celular os painéis se empilham. Tema claro/escuro, fontes e densidade existentes foram preservados. Não foram usadas fotos externas fictícias dos produtos.

## Validação executada

Na pasta `restaurant-management-system-development (1)`:

```sh
npm ci
npm test
npm run typecheck
npm run build
npm audit
```

Os testes cobrem cálculos, PIX/CRC, pagamento incompleto/excessivo, dinheiro insuficiente, estoque, dados obsoletos, clique duplicado, troca de comanda, portal/bobina/data do cupom, F2 até persistência e recarga, falha de armazenamento, envio incremental à cozinha e inicialização sem movimentações fictícias. O workflow de qualidade executa testes, TypeScript, build e auditoria de produção.

## Como testar a impressora de verdade

1. Na comanda, clique em **Imprimir comanda**; ou conclua uma venda de teste para abrir o comprovante.
2. Escolha **58 mm** ou **80 mm** no modal.
3. Na janela do navegador, selecione a impressora correta e configure o **mesmo papel no driver**, margens mínimas/nenhuma, escala 100%, sem cabeçalhos/rodapés. O driver controla comprimento e corte da bobina; CSS não configura o hardware.
4. Teste descrições compridas, observações, acentos, vários itens e pagamentos mistos. Confirme que todo o cupom sai, sem cortar o total.
5. Reimprima pelo histórico e confira data, número da venda, total e troco.

Não houve acesso à impressora física nem teste visual em navegador real nesta sessão. Os testes de interface usam DOM simulado. Antes de usar em produção, valide o equipamento e o banco/aplicativo que lerá o QR Code.

## Pendências e limites importantes

- **Dados são locais ao navegador/origem.** Não existe sincronização de caixa, estoque e mesas entre computadores. Use uma aba por caixa; o alerta entre abas é proteção básica, não uma transação distribuída. Firebase continua usado para a licença, não para guardar as vendas.
- **Backup:** o botão baixa JSON contendo as chaves locais. Ainda não há assistente de importação/restauração. Guarde o arquivo com segurança, pois contém dados de clientes. Falhas/quota de `localStorage` nos demais cadastros geram alerta, mas não possuem rollback transacional completo.
- **Migração:** `comandapro_operations_v1` passa a ser a fonte principal de produtos/mesas/vendas; as chaves antigas são mantidas como espelhos para compatibilidade. Voltar ao código antigo e depois reatualizar requer conferência/migração dos dados para não reusar um snapshot desatualizado. Não altere essas chaves sem backup.
- Dados demonstrativos que já tenham sido salvos antes desta revisão **não foram apagados**, pois não há como distingui-los com segurança dos dados do usuário. Produtos, empresa e cadastros de exemplo ainda devem ser revisados antes de operar.
- O fluxo de **Cozinha & Delivery ainda é de produção**: marcar um delivery como concluído não registra automaticamente recebimento/venda no financeiro. A integração completa entre pedidos externos e checkout é pendência identificada, não resolvida nesta revisão. As opções iFood/UberEats são rótulos, não integrações de pagamento.
- Remover/reduzir item já enviado à cozinha não cancela a produção automaticamente. Avise a cozinha; o controle incremental impede reenvio, mas não substitui um fluxo de cancelamento auditado.
- O PIX gerado é estático: a chave e os dados do recebedor precisam estar corretos. **Não há confirmação bancária automática**; confira o recebimento antes de lançar a parcela. A configuração inicial possui dados de exemplo.
- Comprovante é **não fiscal**. O sistema não emite NFC-e e não possui autenticação de operadores, permissões financeiras ou livro de auditoria de cancelamentos.
- Consultas externas de CNPJ/CEP, licença real e aplicativos de entrega não foram testados neste ambiente com acesso de rede restrito.

Não publique nem substitua a instalação em uso antes de fazer backup e testar uma jornada completa de operação.
