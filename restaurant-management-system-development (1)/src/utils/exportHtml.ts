import { AppConfig, Product } from '../types';
import { formatCurrency, formatDateTime } from './formatters';

export const exportMenuHtml = (products: Product[], config: AppConfig) => {
  const emp = config.dadosEmpresa;
  const sectors = Array.from(new Set(products.map((p) => p.setor))).sort();

  const grouped: Record<string, Product[]> = {};
  sectors.forEach((sec) => {
    grouped[sec] = products.filter((p) => p.setor === sec);
  });

  const nowStr = formatDateTime(new Date());

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Cardápio Digital - ${emp.nomeFantasia || emp.razaoSocial}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #27272a; background: #fafafa; padding: 30px 15px; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { text-align: center; border-bottom: 2px dashed #e4e4e7; padding-bottom: 24px; margin-bottom: 32px; }
    .logo-badge { display: inline-block; background: #ea580c; color: #fff; font-weight: 700; font-size: 14px; padding: 6px 14px; border-radius: 9999px; letter-spacing: 1px; margin-bottom: 12px; text-transform: uppercase; }
    h1 { font-size: 28px; font-weight: 800; color: #09090b; margin-bottom: 6px; }
    .company-sub { font-size: 14px; color: #71717a; line-height: 1.5; }
    .export-date { margin-top: 10px; font-size: 12px; color: #a1a1aa; font-style: italic; }
    .sector-block { margin-bottom: 36px; }
    .sector-title { font-size: 20px; font-weight: 700; color: #ea580c; border-left: 4px solid #ea580c; padding-left: 12px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .item-row { display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0; border-bottom: 1px solid #f4f4f5; }
    .item-info { flex: 1; padding-right: 20px; }
    .item-name { font-size: 16px; font-weight: 600; color: #18181b; }
    .item-ean { font-size: 11px; color: #a1a1aa; font-family: monospace; }
    .item-price { font-size: 16px; font-weight: 700; color: #15803d; white-space: nowrap; }
    .footer { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e4e4e7; font-size: 12px; color: #71717a; }
    @media print {
      body { background: #fff; padding: 0; }
      .container { box-shadow: none; padding: 15px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-badge">Cardápio Oficial 2026</span>
      <h1>${emp.nomeFantasia || emp.razaoSocial}</h1>
      <p class="company-sub">
        ${emp.razaoSocial} &bull; CNPJ: ${emp.cnpj}<br>
        ${emp.endereco}, ${emp.numero} - ${emp.bairro}, ${emp.cidade}/${emp.uf} &bull; CEP: ${emp.cep}<br>
        Telefone: ${emp.telefone} | WhatsApp: ${emp.whatsapp}
      </p>
      <p class="export-date">Emitido em: ${nowStr}</p>
    </div>

    ${sectors
      .map(
        (sector) => `
      <div class="sector-block">
        <h2 class="sector-title">${sector}</h2>
        ${grouped[sector]
          .map(
            (p) => `
          <div class="item-row">
            <div class="item-info">
              <span class="item-name">${p.descricao}</span>
              <span class="item-ean"> (Cód: ${p.ean || p.id})</span>
            </div>
            <div class="item-price">${formatCurrency(p.precoVenda)}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
      )
      .join('')}

    <div class="footer">
      <p>Todos os direitos reservados: Conta Bahia Contabilidade - 71 2136-6312</p>
      <p>Comanda Pro &copy; 2026 - Versão 2.0</p>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    `Cardapio_${emp.nomeFantasia.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.html`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
