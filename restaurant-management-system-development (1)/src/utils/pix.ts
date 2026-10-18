const field = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;
export function crc16(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = ((crc << 1) ^ ((crc & 0x8000) ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const normalize = (value: string, limit: number) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 $%*+\-./:]/g, '').slice(0, limit);
export function buildPixPayload(key: string, name: string, city: string, amount: number): string {
  if (!key.trim() || key.trim().length > 77) throw new Error('Configure uma chave PIX válida antes de cobrar.');
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) throw new Error('Valor PIX inválido.');
  const payload = field('00', '01') + field('26', field('00', 'br.gov.bcb.pix') + field('01', key.trim())) +
    field('52', '0000') + field('53', '986') + field('54', amount.toFixed(2)) + field('58', 'BR') +
    field('59', normalize(name, 25) || 'ESTABELECIMENTO') + field('60', normalize(city, 15) || 'CIDADE') +
    field('62', field('05', '***')) + '6304';
  return payload + crc16(payload);
}
