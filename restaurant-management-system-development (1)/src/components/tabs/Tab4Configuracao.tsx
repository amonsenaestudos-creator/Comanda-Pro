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
} from 'lucide-react';
import { AppConfig } from '../../types';
import { maskCnpjCpf, maskPhone, maskCep } from '../../utils/formatters';

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
  const [formData, setFormData] = useState<AppConfig>(config);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-600" />
              <span>Configurações do Sistema & Integração BrasilAPI</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Personalize alíquotas fiscais, taxas de comissão de cartões, dados cadastrais e mensagem de rodapé.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
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
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Configurações e alíquotas salvas com sucesso no banco de dados local!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section 1: Dados da Empresa & Consulta BrasilAPI */}
        <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-5">
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
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
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
          <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-5">
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
          <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-5">
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

        {/* Section 3: Mensagem Rodapé do Comprovante de Pagamentos */}
        <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-5">
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
            className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md transition"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Todas as Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
