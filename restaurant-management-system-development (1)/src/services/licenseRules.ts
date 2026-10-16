/**
 * Regras de liberação do Comanda Pro — lógica pura, sem Firebase, para poder
 * ser testada isoladamente.
 *
 * Regra única pedida pela Conta Bahia:
 *   `ativa: true`  -> o caixa funciona
 *   `ativa: false` (ou campo ausente / qualquer outro valor) -> o caixa não funciona
 *
 * A data de `validade` NÃO é mais consultada: não existe bloqueio por timestamp
 * nem "renovação automática por vencimento". Quem libera e quem bloqueia é o
 * booleano do documento `licencas/{chave}`.
 *
 * GRAFIA ACEITA: o campo pode estar escrito `ativa` (pt-BR) ou `activa`
 * (pt-PT, grafia comum ao digitar no Firebase Console). Quando as duas existem
 * no mesmo documento, vale o campo `ativa` (grafia oficial do sistema).
 */

export interface LicenseDocData {
  ativa?: unknown;
  /** Grafia alternativa aceita (com "c"), usada como reserva quando `ativa` não existe. */
  activa?: unknown;
  bloqueada?: unknown;
  cliente?: unknown;
  nomeFantasia?: unknown;
  motivoBloqueio?: unknown;
}

export type LicenseVerdict =
  | { ok: true; restaurantName: string }
  | { ok: false; reason: string };

export const MOTIVO_CHAVE_NAO_ENCONTRADA =
  'Chave de licença não encontrada no servidor. Confira a chave ou peça a liberação à Conta Bahia.';

export const MOTIVO_LICENCA_DESATIVADA =
  'Esta licença está desativada (campo ativa/activa não está como true). Fale com a Conta Bahia para reativar este caixa.';

export const MOTIVO_LICENCA_BLOQUEADA =
  'Esta chave foi bloqueada pela administração. Entre em contato com a Conta Bahia.';

/** Aceita `true` e variações que digitadores costumam usar ("true", 1, "sim"). */
export function isVerdadeiro(valor: unknown): boolean {
  if (valor === true) return true;
  if (valor === 1) return true;
  if (typeof valor === 'string') {
    const limpo = valor.trim().toLowerCase();
    return limpo === 'true' || limpo === '1' || limpo === 'sim';
  }
  return false;
}

function textoOuVazio(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/**
 * Decide se o caixa pode funcionar olhando só os campos de liberação.
 * `motivoBloqueio`, quando existe, é a mensagem mostrada na tela de bloqueio.
 */
export function avaliarLicenca(data: LicenseDocData | null | undefined): LicenseVerdict {
  if (!data) {
    return { ok: false, reason: MOTIVO_CHAVE_NAO_ENCONTRADA };
  }

  const motivo = textoOuVazio(data.motivoBloqueio);

  // Chave explicitamente bloqueada (kill switch extra, mesmo com a licença ativa)
  if (isVerdadeiro(data.bloqueada)) {
    return { ok: false, reason: motivo || MOTIVO_LICENCA_BLOQUEADA };
  }

  // Aceita as duas grafias do campo. Se `ativa` existe no documento, ela manda;
  // `activa` (com "c") só entra quando `ativa` está ausente. Um campo valendo
  // `true` e o outro `false` no mesmo documento -> decide o `ativa` oficial.
  const flagLicenca = data.ativa !== undefined ? data.ativa : data.activa;

  if (!isVerdadeiro(flagLicenca)) {
    return { ok: false, reason: motivo || MOTIVO_LICENCA_DESATIVADA };
  }

  return {
    ok: true,
    restaurantName:
      textoOuVazio(data.cliente) || textoOuVazio(data.nomeFantasia) || 'Restaurante Licenciado',
  };
}
