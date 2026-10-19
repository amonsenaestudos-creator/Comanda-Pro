import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Percent,
  MessageSquare,
  Save,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Shield,
  MonitorSmartphone,
  Eye,
  EyeOff,
  Plus,
  TicketPercent,
} from 'lucide-react';
import { AppConfig, CaixaAppearance, CupomDesconto } from '../../types';
import { maskCnpjCpf, maskPhone, maskCep } from '../../utils/formatters';
import { AppearanceControls } from '../AppearanceControls';
import { TAB_LABELS } from '../Sidebar';
import { CAIXA_TABS, HIDABLE_TABS, resolveAppearance, resolveHiddenTabs } from '../../utils/storage';

interface Tab4ConfiguracaoProps {
  config: AppConfig;
  onSaveConfig: (updated: AppConfig) => void;
  onNavigateTab: (tabId: number) => void;
}

export const Tab4Configuracao: React.FC<Tab4ConfiguracaoProps> = ({
  config,
  onSaveConfig,
  onNavigateTab,
}) => {
  const [formData, setFormData] = useState<AppConfig>(() => ({
    ...config,
    aparencia: resolveAppearance(config.aparencia),
  }));

  const aparencia = resolveAppearance(formData.aparencia);
  const abasOcultasEfetivas = resolveHiddenTabs(aparencia);

  /** Aparência salva e aplica na hora (sem precisar clicar em Salvar). */
  const handleAppearanceChange = (patch: Partial<CaixaAppearance>) => {
    const next: AppConfig = {
      ...formData,
      aparencia: { ...aparencia, ...patch },
    };
    setFormData(next);
    onSaveConfig(next);
  };

  /** Cupons: salvos na hora, sem precisar clicar em Salvar. */
  const handleAppearanceChangeCupons = (cupons: CupomDesconto[]) => {
    const next: AppConfig = { ...formData, cupons };
    setFormData(next);
    onSaveConfig(next);
  };

  const toggleAbaOculta = (tabId: number) => {
    const list = aparencia.abasOcultas || [];
    const nextList = list.includes(tabId)
      ? list.filter((id) => id !== tabId)
      : [...list, tabId];
    handleAppearanceChange({ abasOcultas: nextList });
  };
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Formulário de novo cupom de desconto
  const [novoCupom, setNovoCupom] = useState({ codigo: '', percentual: 10 });

  // BrasilAPI CNPJ lookup
  const handleConsultarBrasilApi = async () => {
    const rawCnpj = formData.dadosEmpresa.cnpj.replace(/\D/g, '');
    if (rawCnpj.length !== 14) {
      setCnpjFeedback({
        type: 'error',
        message: 'Por favor, digite um CNPJ válido com 14 dígitos para consultar na BrasilAPI.',
      });
      return;
    }

    setIsSearchingCnpj(true);
    setCnpjFeedback(null);

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`);
      if (!response.ok) {
        throw new Error(`Erro na API BrasilAPI (Status ${response.status})`);
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        dadosEmpresa: {
          ...prev.dadosEmpresa,
          cnpj: maskCnpjCpf(data.cnpj || rawCnpj),
          razaoSocial: data.razao_social || prev.dadosEmpresa.razaoSocial,
          nomeFantasia: data.nome_fantasia || data.razao_social || prev.dadosEmpresa.nomeFantasia,
          endereco: data.logradouro || prev.dadosEmpresa.endereco,
          numero: data.numero || prev.dadosEmpresa.numero,
          complemento: data.complemento || prev.dadosEmpresa.complemento,
          bairro: data.bairro || prev.dadosEmpresa.bairro,
          cidade: data.municipio || prev.dadosEmpresa.cidade,
          uf: data.uf || prev.dadosEmpresa.uf,
          cep: maskCep(data.cep || prev.dadosEmpresa.cep),
          telefone: data.ddd_telefone_1 ? maskPhone(data.ddd_telefone_1) : prev.dadosEmpresa.telefone,
        },
      }));

      setCnpjFeedback({
        type: 'success',
        message: `Dados da empresa "${data.razao_social || 'Localizada'}" importados com sucesso via BrasilAPI!`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha na conexão com BrasilAPI';
      setCnpjFeedback({
        type: 'error',
        message: `Não foi possível consultar na BrasilAPI (${errorMessage}). Verifique a conexão ou se o CNPJ está ativo.`,
      });
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleApplyExampleCnpj = (cnpjExample: string) => {
    setFormData((prev) => ({
      ...prev,
      dadosEmpresa: {
        ...prev.dadosEmpresa,
        cnpj: cnpjExample,
      },
    }));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="cp-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Configurações do Sistema</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Ajuste a tela do caixa (tema, tamanho da letra, atalhos e o que aparece no menu) e,
              abaixo, os dados da empresa, taxas fiscais e o rodapé do cupom.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
          <button
            onClick={() => onNavigateTab(1)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Frente de Caixa <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(5)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Estoques & Cardápio <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(6)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Módulo Financeiro <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(8)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Salão de Mesas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Configurações e alíquotas salvas com sucesso no banco de dados local!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ===== Seção: Tela do Caixa (aparência, atalhos e menu) ===== */}
        <div className="cp-card p-5">
          <div className="flex items-center justify-between pb-3 border-b cp-line mb-4 gap-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <MonitorSmartphone className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm cp-text">
                Tela do Caixa &mdash; aparência, atalhos e menu
              </h3>
            </div>
            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
              aplica na hora, não precisa salvar
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 cp-inset rounded-xl p-4">
              <AppearanceControls
                aparencia={aparencia}
                onChange={handleAppearanceChange}
              />
            </div>

            {/* Prévia viva + controle das telas do menu */}
            <div className="space-y-4">
              <div className="cp-inset rounded-xl p-3">
                <p className="cp-label cp-faint font-bold mb-2">Prévia da tela do caixa</p>
                <div className="cp-card p-3 space-y-2">
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <div className="cp-label cp-faint font-bold">Mesa / Comanda</div>
                      <div className="cp-text font-black text-2xl leading-none">07</div>
                    </div>
                    <div className="text-right">
                      <div className="cp-label cp-faint font-bold">Total</div>
                      <div className="cp-total cp-accent font-black font-mono">R$ 132,00</div>
                    </div>
                  </div>

                  <div className="cp-row flex items-center gap-2 pt-1.5">
                    <span className="cp-soft border cp-line rounded-lg px-1.5 py-0.5 cp-num font-black cp-text">
                      2
                    </span>
                    <span className="cp-item cp-text font-semibold flex-1 truncate">
                      X-Burger Artesanal com Fritas
                    </span>
                    <span className="cp-num cp-text font-black font-mono">R$ 69,80</span>
                  </div>

                  <div className="flex gap-2">
                    <div className="cp-tile flex-1">
                      <div className="cp-item cp-text font-bold leading-tight">Coca-Cola Lata</div>
                      <div className="cp-price cp-text font-black font-mono">R$ 7,50</div>
                    </div>
                    <div className="cp-tile flex-1">
                      <div className="cp-item cp-text font-bold leading-tight">Suco de Laranja</div>
                      <div className="cp-price cp-text font-black font-mono">R$ 10,00</div>
                    </div>
                  </div>

                  <div className="cp-btn bg-emerald-600 text-white w-full">
                    <span>Pagar</span>
                  </div>
                </div>
              </div>

              <div className="cp-inset rounded-xl p-3">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <p className="text-xs font-bold cp-text">Telas do menu lateral</p>
                  {(aparencia.abasOcultas.length > 0 || aparencia.modoCaixa) && (
                    <button
                      type="button"
                      onClick={() => handleAppearanceChange({ abasOcultas: [], modoCaixa: false })}
                      className="text-[10px] font-bold text-orange-600 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Mostrar todas
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  {[...HIDABLE_TABS]
                    .sort((a, b) => a - b)
                    .map((tabId) => {
                      const escondida = abasOcultasEfetivas.includes(tabId);
                      const info = TAB_LABELS[tabId] || { label: `Aba ${tabId}`, sublabel: '' };
                      return (
                        <button
                          key={tabId}
                          type="button"
                          onClick={() => toggleAbaOculta(tabId)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition ${
              escondida
               ? 'cp-soft cp-faint border-transparent'
               : 'cp-card cp-text hover:border-orange-300'
                          }`}
                        >
                          {escondida ? (
                            <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block cp-small font-bold truncate">{info.label}</span>
                            <span className="block text-[9px] cp-faint truncate">{info.sublabel}</span>
                          </span>
                          <span className="text-[9px] font-mono cp-faint shrink-0">#{tabId}</span>
                        </button>
                      );
                    })}
                </div>
                <p className="text-[10px] cp-faint mt-2 leading-snug">
                  Com o <strong>Modo Caixa</strong> ligado, ficam no menu só:
                  <br />
                  {CAIXA_TABS.map((id) => TAB_LABELS[id]?.label || `Aba ${id}`).join(' &bull; ')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Dados da Empresa & Consulta BrasilAPI */}
        <div className="cp-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Dados Cadastrais da Empresa (Consulta Automática BrasilAPI)
              </h3>
            </div>
            <span className="text-[11px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">
              API Oficial: brasilapi.com.br
            </span>
          </div>

          {/* BrasilAPI Lookup Field */}
          <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-xl mb-4">
            <label className="text-xs font-bold text-zinc-800 block mb-1">
              CNPJ da Empresa (Digite e clique em Consultar BrasilAPI):
            </label>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={formData.dadosEmpresa.cnpj}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dadosEmpresa: {
                        ...formData.dadosEmpresa,
                        cnpj: maskCnpjCpf(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-bold font-mono bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-zinc-900"
                />
              </div>

              {/* Botão Azul / Amarelo Consulta BrasilAPI */}
              <button
                type="button"
                onClick={handleConsultarBrasilApi}
                disabled={isSearchingCnpj}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isSearchingCnpj ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando BrasilAPI...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Consultar BrasilAPI</span>
                  </>
                )}
              </button>
            </div>

            {/* CNPJ Quick Test Suggestions */}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-600">
              <span className="font-semibold">Exemplos para testar:</span>
              <button
                type="button"
                onClick={() => handleApplyExampleCnpj('06.990.590/0001-23')}
                className="text-orange-700 hover:underline font-mono bg-white px-1.5 py-0.5 rounded border border-orange-200"
              >
                06.990.590/0001-23
              </button>
              <button
                type="button"
                onClick={() => handleApplyExampleCnpj('33.000.167/0001-01')}
                className="text-orange-700 hover:underline font-mono bg-white px-1.5 py-0.5 rounded border border-orange-200"
              >
                33.000.167/0001-01 (Petrobras)
              </button>
            </div>

            {cnpjFeedback && (
              <div
                className={`mt-2 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
         cnpjFeedback.type === 'success'
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {cnpjFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{cnpjFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Detailed Form inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Razão Social:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.razaoSocial}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, razaoSocial: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Nome Fantasia:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.nomeFantasia}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, nomeFantasia: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-bold text-zinc-900"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Telefone de Contato:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.telefone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: {
                      ...formData.dadosEmpresa,
                      telefone: maskPhone(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                WhatsApp Delivery:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.whatsapp}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: {
                      ...formData.dadosEmpresa,
                      whatsapp: maskPhone(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Redes Sociais / Instagram:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.instagram}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, instagram: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                CEP:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.cep}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: {
                      ...formData.dadosEmpresa,
                      cep: maskCep(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-zinc-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="font-semibold text-zinc-700 block mb-1">
                Endereço / Logradouro:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.endereco}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, endereco: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Número & Complemento:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nº"
                  value={formData.dadosEmpresa.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dadosEmpresa: { ...formData.dadosEmpresa, numero: e.target.value },
                    })
                  }
                  className="w-20 px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
                />
                <input
                  type="text"
                  placeholder="Compl."
                  value={formData.dadosEmpresa.complemento}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dadosEmpresa: { ...formData.dadosEmpresa, complemento: e.target.value },
                    })
                  }
                  className="flex-1 px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Bairro:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.bairro}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, bairro: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                Município / Cidade:
              </label>
              <input
                type="text"
                value={formData.dadosEmpresa.cidade}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, cidade: e.target.value },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>

            <div>
              <label className="font-semibold text-zinc-700 block mb-1">
                UF (Estado):
              </label>
              <input
                type="text"
                maxLength={2}
                value={formData.dadosEmpresa.uf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dadosEmpresa: { ...formData.dadosEmpresa, uf: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg uppercase text-zinc-800 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Taxas de Comissão de Cartão & Aplicativos + Desconto Máximo + Impostos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card & App Commissions */}
          <div className="cp-card p-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 mb-4">
              <Percent className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Porcentual de Comissão de Cartões & Aplicativos (%)
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-700">
                  Cartão Crédito (%):
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxasComissao.cartaoCredito}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxasComissao: {
                        ...formData.taxasComissao,
                        cartaoCredito: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-700">
                  Cartão Débito (%):
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxasComissao.cartaoDebito}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxasComissao: {
                        ...formData.taxasComissao,
                        cartaoDebito: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-700">
                  PIX Taxa Operadora (%):
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxasComissao.pix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxasComissao: {
                        ...formData.taxasComissao,
                        pix: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-700">
                  Aplicativos de Entrega / iFood (%):
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxasComissao.aplicativos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxasComissao: {
                        ...formData.taxasComissao,
                        aplicativos: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Regras de Desconto & Tributos */}
          <div className="cp-card p-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 mb-4">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Parâmetros de Desconto & Alíquota Fiscal
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Porcentual Máximo de Desconto (%):
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Limite permitido para o operador conceder
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.descontoMaximoPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descontoMaximoPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Alíquota Estimada de Imposto (%):
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Usada no cálculo de tributos sobre vendas
                  </span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.aliquotaImpostoPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aliquotaImpostoPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Taxa Padrão de Serviço do Salão (%):
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Percentual sugerido para garçons
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.taxaServicoPadraoPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxaServicoPadraoPercent: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-2.5 py-1 text-right font-mono font-bold bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-zinc-700 block">
                    Chave PIX Oficial:
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Para QR-Code de recebimento
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.chavePix}
                  onChange={(e) =>
                    setFormData({ ...formData, chavePix: e.target.value })
                  }
                  className="w-48 px-2.5 py-1 text-right font-mono text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2b: Cupons de Desconto Promocionais */}
        <div className="cp-card p-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 mb-4">
            <TicketPercent className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-sm text-zinc-900">
              Cupons de Desconto (PDV)
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Códigos que o caixa aplica na frente de caixa (ex.: campanhas e
            aniversariantes). O desconto entra na venda como percentual.
          </p>

          {/* Lista de cupons */}
          <div className="space-y-2 mb-4">
            {(formData.cupons || []).length === 0 && (
              <p className="text-xs text-zinc-400 italic">
                Nenhum cupom cadastrado.
              </p>
            )}
            {(formData.cupons || []).map((cupom) => (
              <div
                key={cupom.codigo}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold text-zinc-900 uppercase">
                    {cupom.codigo}
                  </span>
                  <span className="text-zinc-500">(-{cupom.percentual}%)</span>
                  {!cupom.ativo && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
                      INATIVO
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleAppearanceChangeCupons(
                        formData.cupons!.map((c) =>
                          c.codigo === cupom.codigo ? { ...c, ativo: !c.ativo } : c
                        )
                      )
                    }
                    className={`px-2 py-1 rounded font-bold border transition ${
                      cupom.ativo
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200'
                    }`}
                    title={cupom.ativo ? 'Desativar cupom' : 'Ativar cupom'}
                  >
                    {cupom.ativo ? 'Ativo' : 'Inativo'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAppearanceChangeCupons(
                        formData.cupons!.filter((c) => c.codigo !== cupom.codigo)
                      )
                    }
                    className="px-2 py-1 rounded font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition"
                    title="Excluir cupom"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Novo cupom */}
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const codigo = novoCupom.codigo.trim().toUpperCase();
              if (!codigo) {
                alert('Informe o código do cupom.');
                return;
              }
              if (novoCupom.percentual <= 0 || novoCupom.percentual > 100) {
                alert('O percentual deve estar entre 0,1% e 100%.');
                return;
              }
              if ((formData.cupons || []).some((c) => c.codigo.toUpperCase() === codigo)) {
                alert('Já existe um cupom com este código.');
                return;
              }
              handleAppearanceChangeCupons([
                ...(formData.cupons || []),
                { codigo, percentual: novoCupom.percentual, ativo: true },
              ]);
              setNovoCupom({ codigo: '', percentual: 10 });
            }}
          >
            <div className="flex-1 min-w-[10rem]">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                Código do cupom
              </label>
              <input
                type="text"
                maxLength={20}
                placeholder="Ex.: FELIZ2026"
                value={novoCupom.codigo}
                onChange={(e) =>
                  setNovoCupom({ ...novoCupom, codigo: e.target.value })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono uppercase bg-zinc-50 border border-zinc-300 rounded-lg"
              />
            </div>
            <div className="w-28">
              <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                Desconto (%)
              </label>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.5"
                value={novoCupom.percentual}
                onChange={(e) =>
                  setNovoCupom({
                    ...novoCupom,
                    percentual: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono text-right bg-zinc-50 border border-zinc-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cupom</span>
            </button>
          </form>
        </div>

        {/* Section 3: Mensagem Rodapé do Comprovante de Pagamentos */}
        <div className="cp-card p-5">
          <div className="flex items-center space-x-2 pb-3 border-b border-zinc-200 mb-3">
            <MessageSquare className="w-5 h-5 text-orange-600" />
            <h3 className="font-bold text-sm text-zinc-900">
              Mensagem Rodapé do Comprovante de Pagamentos
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mb-2">
            Texto impresso ao final do cupom térmico e conferência de conta de cada mesa:
          </p>
          <textarea
            rows={3}
            value={formData.mensagemRodape}
            onChange={(e) =>
              setFormData({ ...formData, mensagemRodape: e.target.value })
            }
            className="w-full p-3 text-xs font-mono bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Save button bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
