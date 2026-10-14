import React, { useState, useRef } from 'react';
import {
  Package,
  Plus,
  FileSpreadsheet,
  FileDown,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  Tag,
  ArrowRight,
  Layers,
  X,
  Save,
} from 'lucide-react';
import { AppConfig, Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { exportMenuHtml } from '../../utils/exportHtml';

interface Tab5EstoqueProps {
  products: Product[];
  sectors: string[];
  config: AppConfig;
  onSaveProducts: (products: Product[]) => void;
  onSaveSectors: (sectors: string[]) => void;
  onNavigateTab: (tabId: number) => void;
}

export const Tab5Estoque: React.FC<Tab5EstoqueProps> = ({
  products,
  sectors,
  config,
  onSaveProducts,
  onSaveSectors,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('TODOS');
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Modal Product (New or Edit)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    ean: '',
    descricao: '',
    unidade: 'UN',
    precoVenda: 0,
    custo: 0,
    setor: 'Alimentos',
    estoque: 50,
  });

  // Sector Manager Modal
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [newSectorName, setNewSectorName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ean.includes(searchTerm);
    const matchesSector = filterSector === 'TODOS' || p.setor === filterSector;
    return matchesSearch && matchesSector;
  });

  // Handle open create modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      ean: `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      descricao: '',
      unidade: 'UN',
      precoVenda: 0,
      custo: 0,
      setor: sectors[0] || 'Alimentos',
      estoque: 50,
    });
    setIsProductModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ ...p });
    setIsProductModalOpen(true);
  };

  // Handle save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.descricao?.trim()) {
      alert('Informe a descrição do produto!');
      return;
    }
    if (!productForm.precoVenda || productForm.precoVenda <= 0) {
      alert('Informe um preço de venda válido!');
      return;
    }

    if (editingProduct) {
      // Update
      const updated = products.map((p) =>
        p.id === editingProduct.id ? ({ ...p, ...productForm } as Product) : p
      );
      onSaveProducts(updated);
    } else {
      // Create
      const newProd: Product = {
        id: productForm.id || `prod-${Date.now()}`,
        ean: productForm.ean || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        descricao: productForm.descricao.trim(),
        unidade: productForm.unidade || 'UN',
        precoVenda: Number(productForm.precoVenda),
        custo: Number(productForm.custo || 0),
        setor: productForm.setor || 'Alimentos',
        estoque: Number(productForm.estoque || 0),
      };
      onSaveProducts([...products, newProd]);
    }

    setIsProductModalOpen(false);
  };

  // Handle delete product
  const handleDeleteProduct = (id: string, desc: string) => {
    if (window.confirm(`Deseja realmente remover o produto "${desc}"?`)) {
      onSaveProducts(products.filter((p) => p.id !== id));
    }
  };

  // CSV Import handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length <= 1) {
          alert('Arquivo CSV vazio ou sem linhas de dados.');
          return;
        }

        // Expected CSV format: Codigo ean; descricao mercadoria; unidade; preco venda; setor
        let countImported = 0;
        const newItems: Product[] = [];

        // Check if first line is header
        const startIndex = lines[0].toLowerCase().includes('ean') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[;,]/).map((p) => p.trim());
          if (parts.length >= 4) {
            const ean = parts[0];
            const descricao = parts[1];
            const unidade = parts[2] || 'UN';
            const precoVenda = parseFloat(parts[3].replace(',', '.')) || 0;
            const setor = parts[4] || 'Alimentos';

            if (descricao && precoVenda > 0) {
              newItems.push({
                id: `prod-csv-${Date.now()}-${i}`,
                ean: ean || `78900000000${i}`,
                descricao,
                unidade,
                precoVenda,
                custo: Number((precoVenda * 0.4).toFixed(2)),
                setor,
                estoque: 50,
              });
              countImported++;
            }
          }
        }

        if (countImported > 0) {
          onSaveProducts([...products, ...newItems]);
          setImportNotification(`${countImported} mercadorias importadas com sucesso via CSV!`);
          setTimeout(() => setImportNotification(null), 4000);
        } else {
          alert('Nenhum produto válido encontrado. Verifique a estrutura do arquivo.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo CSV. Verifique a formatação.');
      }
    };
    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadSampleCsv = () => {
    const sampleContent =
      'Codigo ean;descricao mercadoria;unidade;preco venda;setor\n' +
      '7891000200010;Hambúrguer Gourmet Costela Especial;UN;39.90;Hambúrgueres\n' +
      '7891000200027;Cerveja Long Neck Heineken 330ml;UN;12.00;Bebidas\n' +
      '7891000200034;Batata Frita com Queijo e Bacon;UN;27.50;Porções\n' +
      '7891000200041;Açaí Copo 300ml Tradicional;UN;18.00;Açaí\n' +
      '7891000200058;Suco de Abacaxi com Hortelã 500ml;UN;11.00;Sucos\n' +
      '7891000200065;Bolo Vulcão de Ninho com Nutella;UN;24.00;Doces\n';

    const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_mercadorias_comandapro.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Sector additions
  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newSectorName.trim();
    if (!clean) return;
    if (sectors.includes(clean)) {
      alert('Este setor já existe!');
      return;
    }
    onSaveSectors([...sectors, clean]);
    setNewSectorName('');
  };

  const handleRemoveSector = (sec: string) => {
    if (sectors.length <= 1) {
      alert('Mantenha pelo menos um setor cadastrado.');
      return;
    }
    if (window.confirm(`Deseja excluir o setor "${sec}"?`)) {
      onSaveSectors(sectors.filter((s) => s !== sec));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Estoques, Cardápio & Base de Dados</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Importação por planilha CSV, exportação de cardápio digital em HTML e controle de inventário.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden CSV input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Botão Verde: Novo Produto */}
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>

            {/* Botão Azul: Importar CSV */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importar CSV</span>
            </button>

            {/* Botão Amarelo: Exportar Cardápio HTML */}
            <button
              onClick={() => exportMenuHtml(products, config)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-950 flex items-center gap-1.5 shadow-xs transition"
            >
              <FileDown className="w-4 h-4 text-zinc-950" />
              <span>Exportar Cardápio HTML</span>
            </button>

            {/* Botão Setores */}
            <button
              onClick={() => setIsSectorModalOpen(true)}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center gap-1.5 transition"
            >
              <Layers className="w-4 h-4" />
              <span>Setores ({sectors.length})</span>
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
            <button
              onClick={() => onNavigateTab(1)}
              className="hover:text-orange-600 underline flex items-center gap-0.5"
            >
              PDV <ArrowRight className="w-3 h-3" />
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onNavigateTab(8)}
              className="hover:text-orange-600 underline flex items-center gap-0.5"
            >
              Mesas <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={handleDownloadSampleCsv}
            className="text-orange-600 hover:underline font-medium flex items-center gap-1"
          >
            <span>Baixar modelo CSV de exemplo</span>
          </button>
        </div>
      </div>

      {importNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{importNotification}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descrição ou código EAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800 font-medium"
            >
              <option value="TODOS">Todos os Setores / Categorias</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 text-right text-xs text-zinc-500 font-mono">
            {filteredProducts.length} itens cadastrados
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/70 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Código EAN</th>
                <th className="py-2.5 px-3">Descrição Mercadoria</th>
                <th className="py-2.5 px-3">Setor / Categoria</th>
                <th className="py-2.5 px-3 text-center">Unidade</th>
                <th className="py-2.5 px-3 text-right">Preço Venda</th>
                <th className="py-2.5 px-3 text-right">Custo Est.</th>
                <th className="py-2.5 px-3 text-right">Estoque</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-400">
                    Nenhum produto cadastrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50/20 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-zinc-600 text-[11px]">
                      {p.ean}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-zinc-900">
                      {p.descricao}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {p.setor}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-600">
                      {p.unidade}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700 font-mono text-sm">
                      {formatCurrency(p.precoVenda)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-500 font-mono">
                      {p.custo ? formatCurrency(p.custo) : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-zinc-800">
                      {p.estoque} UN
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Editar Mercadoria"
                          className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.descricao)}
                          title="Excluir Mercadoria"
                          className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-zinc-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  {editingProduct ? 'Editar Mercadoria do Cardápio' : 'Cadastrar Nova Mercadoria'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Descrição da Mercadoria / Prato:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: X-Burger Artesanal com Fritas"
                  value={productForm.descricao || ''}
                  onChange={(e) =>
                    setProductForm({ ...productForm, descricao: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-bold text-zinc-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Código de Barras EAN:
                  </label>
                  <input
                    type="text"
                    value={productForm.ean || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, ean: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Setor / Categoria:
                  </label>
                  <select
                    value={productForm.setor || sectors[0]}
                    onChange={(e) =>
                      setProductForm({ ...productForm, setor: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-semibold"
                  >
                    {sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Preço de Venda (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={productForm.precoVenda || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        precoVenda: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-bold font-mono text-emerald-700 text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Custo Estimado (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.custo || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        custo: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-zinc-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Estoque Atual:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.estoque || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        estoque: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg font-mono text-zinc-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Mercadoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sectors Management */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5 border border-zinc-200">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  Gerenciar Setores / Categorias
                </h3>
              </div>
              <button
                onClick={() => setIsSectorModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Sector Form */}
            <form onSubmit={handleAddSector} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Nome do novo setor..."
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
              >
                + Adicionar
              </button>
            </form>

            {/* Sectors list */}
            <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-zinc-100 text-xs">
              {sectors.map((sec) => (
                <div
                  key={sec}
                  className="py-2 flex items-center justify-between hover:bg-zinc-50 px-2 rounded"
                >
                  <span className="font-semibold text-zinc-800">{sec}</span>
                  <button
                    onClick={() => handleRemoveSector(sec)}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded"
                    title="Remover setor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setIsSectorModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
