import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Truck,
  Smartphone,
  Building,
  UserPlus,
  Trash2,
  Edit2,
  Search,
  ArrowRight,
  X,
  Save,
} from 'lucide-react';
import {
  AppIntegration,
  Customer,
  Deliverer,
  Employee,
  Supplier,
} from '../../types';
import { maskCnpjCpf, maskPhone, maskCep } from '../../utils/formatters';

interface Tab10CadastrosProps {
  customers: Customer[];
  deliverers: Deliverer[];
  apps: AppIntegration[];
  suppliers: Supplier[];
  employees: Employee[];
  onSaveCustomers: (data: Customer[]) => void;
  onSaveDeliverers: (data: Deliverer[]) => void;
  onSaveApps: (data: AppIntegration[]) => void;
  onSaveSuppliers: (data: Supplier[]) => void;
  onSaveEmployees: (data: Employee[]) => void;
  onNavigateTab: (tabId: number) => void;
}

type CadastroType = 'clientes' | 'entregadores' | 'aplicativos' | 'fornecedores' | 'colaboradores';

export const Tab10Cadastros: React.FC<Tab10CadastrosProps> = ({
  customers,
  deliverers,
  apps,
  suppliers,
  employees,
  onSaveCustomers,
  onSaveDeliverers,
  onSaveApps,
  onSaveSuppliers,
  onSaveEmployees,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<CadastroType>('clientes');
  const [searchTerm, setSearchTerm] = useState('');

  // Generic Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formCustomer, setFormCustomer] = useState<Partial<Customer>>({});
  const [formDeliverer, setFormDeliverer] = useState<Partial<Deliverer>>({});
  const [formApp, setFormApp] = useState<Partial<AppIntegration>>({});
  const [formSupplier, setFormSupplier] = useState<Partial<Supplier>>({});
  const [formEmployee, setFormEmployee] = useState<Partial<Employee>>({});

  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeSubTab === 'clientes') {
      setFormCustomer({
        id: `cli-${Date.now()}`,
        nome: '',
        telefone: '',
        endereco: '',
        cep: '',
        cpfCnpj: '',
      });
    } else if (activeSubTab === 'entregadores') {
      setFormDeliverer({
        id: `ent-${Date.now()}`,
        nome: '',
        telefone: '',
        endereco: '',
        cep: '',
        cpf: '',
        veiculo: 'Moto Honda CG 160',
      });
    } else if (activeSubTab === 'aplicativos') {
      setFormApp({
        id: `app-${Date.now()}`,
        razaoSocial: '',
        telefone: '',
        endereco: '',
        cep: '',
        cpfCnpj: '',
        taxaComissao: 12.0,
      });
    } else if (activeSubTab === 'fornecedores') {
      setFormSupplier({
        id: `sup-${Date.now()}`,
        razaoSocial: '',
        telefone: '',
        endereco: '',
        cep: '',
        cpfCnpj: '',
        contato: '',
      });
    } else if (activeSubTab === 'colaboradores') {
      setFormEmployee({
        id: `emp-${Date.now()}`,
        nome: '',
        telefone: '',
        endereco: '',
        cep: '',
        cpf: '',
        funcao: 'Garçom / Atendimento',
        dataAdmissao: new Date().toISOString().slice(0, 10),
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    if (activeSubTab === 'clientes') setFormCustomer({ ...item });
    else if (activeSubTab === 'entregadores') setFormDeliverer({ ...item });
    else if (activeSubTab === 'aplicativos') setFormApp({ ...item });
    else if (activeSubTab === 'fornecedores') setFormSupplier({ ...item });
    else if (activeSubTab === 'colaboradores') setFormEmployee({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente remover o registro "${name}"?`)) {
      if (activeSubTab === 'clientes') onSaveCustomers(customers.filter((c) => c.id !== id));
      else if (activeSubTab === 'entregadores') onSaveDeliverers(deliverers.filter((d) => d.id !== id));
      else if (activeSubTab === 'aplicativos') onSaveApps(apps.filter((a) => a.id !== id));
      else if (activeSubTab === 'fornecedores') onSaveSuppliers(suppliers.filter((s) => s.id !== id));
      else if (activeSubTab === 'colaboradores') onSaveEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeSubTab === 'clientes') {
      if (!formCustomer.nome?.trim()) return alert('Informe o nome do cliente!');
      const data: Customer = {
        id: editingId || `cli-${Date.now()}`,
        nome: formCustomer.nome.trim(),
        telefone: formCustomer.telefone || '',
        endereco: formCustomer.endereco || '',
        cep: formCustomer.cep || '',
        cpfCnpj: formCustomer.cpfCnpj || '',
      };
      onSaveCustomers(
        editingId ? customers.map((c) => (c.id === editingId ? data : c)) : [...customers, data]
      );
    } else if (activeSubTab === 'entregadores') {
      if (!formDeliverer.nome?.trim()) return alert('Informe o nome do entregador!');
      const data: Deliverer = {
        id: editingId || `ent-${Date.now()}`,
        nome: formDeliverer.nome.trim(),
        telefone: formDeliverer.telefone || '',
        endereco: formDeliverer.endereco || '',
        cep: formDeliverer.cep || '',
        cpf: formDeliverer.cpf || '',
        veiculo: formDeliverer.veiculo,
      };
      onSaveDeliverers(
        editingId ? deliverers.map((d) => (d.id === editingId ? data : d)) : [...deliverers, data]
      );
    } else if (activeSubTab === 'aplicativos') {
      if (!formApp.razaoSocial?.trim()) return alert('Informe a Razão Social do aplicativo!');
      const data: AppIntegration = {
        id: editingId || `app-${Date.now()}`,
        razaoSocial: formApp.razaoSocial.trim(),
        telefone: formApp.telefone || '',
        endereco: formApp.endereco || '',
        cep: formApp.cep || '',
        cpfCnpj: formApp.cpfCnpj || '',
        taxaComissao: Number(formApp.taxaComissao || 0),
      };
      onSaveApps(
        editingId ? apps.map((a) => (a.id === editingId ? data : a)) : [...apps, data]
      );
    } else if (activeSubTab === 'fornecedores') {
      if (!formSupplier.razaoSocial?.trim()) return alert('Informe a Razão Social do fornecedor!');
      const data: Supplier = {
        id: editingId || `sup-${Date.now()}`,
        razaoSocial: formSupplier.razaoSocial.trim(),
        telefone: formSupplier.telefone || '',
        endereco: formSupplier.endereco || '',
        cep: formSupplier.cep || '',
        cpfCnpj: formSupplier.cpfCnpj || '',
        contato: formSupplier.contato,
      };
      onSaveSuppliers(
        editingId ? suppliers.map((s) => (s.id === editingId ? data : s)) : [...suppliers, data]
      );
    } else if (activeSubTab === 'colaboradores') {
      if (!formEmployee.nome?.trim()) return alert('Informe o nome do colaborador!');
      const data: Employee = {
        id: editingId || `emp-${Date.now()}`,
        nome: formEmployee.nome.trim(),
        telefone: formEmployee.telefone || '',
        endereco: formEmployee.endereco || '',
        cep: formEmployee.cep || '',
        cpf: formEmployee.cpf || '',
        funcao: formEmployee.funcao || 'Atendente',
        dataAdmissao: formEmployee.dataAdmissao || new Date().toISOString().slice(0, 10),
      };
      onSaveEmployees(
        editingId ? employees.map((e) => (e.id === editingId ? data : e)) : [...employees, data]
      );
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              <span>Módulo Geral de Cadastros & Entidades</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Gerencie Clientes, Entregadores, Aplicativos de Delivery, Fornecedores e Colaboradores da equipe.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Verde: Novo Cadastro */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Registro</span>
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
            onClick={() => onNavigateTab(9)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Delivery & Cozinha <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(4)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Configurações da Empresa <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 5 Sub-Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-2 flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveSubTab('clientes')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'clientes'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('entregadores')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'entregadores'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Entregadores ({deliverers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('aplicativos')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'aplicativos'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Aplicativos ({apps.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('fornecedores')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'fornecedores'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Fornecedores ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('colaboradores')}
          className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeSubTab === 'colaboradores'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Colaboradores ({employees.length})</span>
        </button>
      </div>

      {/* Search Input Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Filtrar ${activeSubTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
          />
        </div>
      </div>

      {/* Listing Content by Category */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 overflow-hidden">
        {/* SubTab 1: Clientes */}
        {activeSubTab === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Nome Completo</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Endereço</th>
                  <th className="py-2.5 px-4">CEP</th>
                  <th className="py-2.5 px-4">CPF / CNPJ</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {customers
                  .filter(
                    (c) =>
                      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      c.telefone.includes(searchTerm) ||
                      c.cpfCnpj.includes(searchTerm)
                  )
                  .map((c) => (
                    <tr key={c.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-bold text-zinc-900">{c.nome}</td>
                      <td className="py-3 px-4 font-mono text-zinc-700">{c.telefone}</td>
                      <td className="py-3 px-4 text-zinc-600">{c.endereco}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{c.cep}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{c.cpfCnpj}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.nome)}
                            className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SubTab 2: Entregadores */}
        {activeSubTab === 'entregadores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Nome do Entregador</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Veículo / Placa</th>
                  <th className="py-2.5 px-4">Endereço</th>
                  <th className="py-2.5 px-4">CEP</th>
                  <th className="py-2.5 px-4">CPF</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {deliverers
                  .filter((d) => d.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((d) => (
                    <tr key={d.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-orange-600" />
                        <span>{d.nome}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700">{d.telefone}</td>
                      <td className="py-3 px-4 font-semibold text-zinc-800">{d.veiculo || 'Moto'}</td>
                      <td className="py-3 px-4 text-zinc-600">{d.endereco}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{d.cep}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{d.cpf}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(d)}
                            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id, d.nome)}
                            className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SubTab 3: Aplicativos */}
        {activeSubTab === 'aplicativos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Razão Social / Plataforma</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Taxa Comissão (%)</th>
                  <th className="py-2.5 px-4">Endereço</th>
                  <th className="py-2.5 px-4">CEP</th>
                  <th className="py-2.5 px-4">CNPJ</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {apps
                  .filter((a) => a.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-orange-600" />
                        <span>{a.razaoSocial}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700">{a.telefone}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">{a.taxaComissao}%</td>
                      <td className="py-3 px-4 text-zinc-600">{a.endereco}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{a.cep}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{a.cpfCnpj}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(a)}
                            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id, a.razaoSocial)}
                            className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SubTab 4: Fornecedores */}
        {activeSubTab === 'fornecedores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Razão Social Fornecedor</th>
                  <th className="py-2.5 px-4">Contato</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Endereço</th>
                  <th className="py-2.5 px-4">CEP</th>
                  <th className="py-2.5 px-4">CNPJ</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {suppliers
                  .filter((s) => s.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                        <Building className="w-4 h-4 text-orange-600" />
                        <span>{s.razaoSocial}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-700">{s.contato || '-'}</td>
                      <td className="py-3 px-4 font-mono text-zinc-700">{s.telefone}</td>
                      <td className="py-3 px-4 text-zinc-600">{s.endereco}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{s.cep}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{s.cpfCnpj}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.razaoSocial)}
                            className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SubTab 5: Colaboradores */}
        {activeSubTab === 'colaboradores' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-100 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
                <tr>
                  <th className="py-2.5 px-4">Nome do Colaborador</th>
                  <th className="py-2.5 px-4">Função / Cargo</th>
                  <th className="py-2.5 px-4">Telefone</th>
                  <th className="py-2.5 px-4">Admissão</th>
                  <th className="py-2.5 px-4">Endereço</th>
                  <th className="py-2.5 px-4">CEP</th>
                  <th className="py-2.5 px-4">CPF</th>
                  <th className="py-2.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {employees
                  .filter((e) => e.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50">
                      <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-orange-600" />
                        <span>{e.nome}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded">
                          {e.funcao}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-700">{e.telefone}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{e.dataAdmissao}</td>
                      <td className="py-3 px-4 text-zinc-600">{e.endereco}</td>
                      <td className="py-3 px-4 font-mono text-zinc-500">{e.cep}</td>
                      <td className="py-3 px-4 font-mono text-zinc-600">{e.cpf}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(e)}
                            className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id, e.nome)}
                            className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-zinc-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="font-bold text-sm text-zinc-900 uppercase">
                {editingId ? 'Editar' : 'Novo'} Cadastro de {activeSubTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3 mt-4 text-xs">
              {/* Fields for Clientes */}
              {activeSubTab === 'clientes' && (
                <>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Nome Completo:</label>
                    <input
                      type="text"
                      required
                      value={formCustomer.nome || ''}
                      onChange={(e) => setFormCustomer({ ...formCustomer, nome: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Telefone:</label>
                      <input
                        type="text"
                        value={formCustomer.telefone || ''}
                        onChange={(e) =>
                          setFormCustomer({
                            ...formCustomer,
                            telefone: maskPhone(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CPF / CNPJ:</label>
                      <input
                        type="text"
                        value={formCustomer.cpfCnpj || ''}
                        onChange={(e) =>
                          setFormCustomer({
                            ...formCustomer,
                            cpfCnpj: maskCnpjCpf(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formCustomer.endereco || ''}
                      onChange={(e) => setFormCustomer({ ...formCustomer, endereco: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">CEP:</label>
                    <input
                      type="text"
                      value={formCustomer.cep || ''}
                      onChange={(e) =>
                        setFormCustomer({ ...formCustomer, cep: maskCep(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}

              {/* Fields for Entregadores */}
              {activeSubTab === 'entregadores' && (
                <>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Nome Completo:</label>
                    <input
                      type="text"
                      required
                      value={formDeliverer.nome || ''}
                      onChange={(e) => setFormDeliverer({ ...formDeliverer, nome: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Telefone:</label>
                      <input
                        type="text"
                        value={formDeliverer.telefone || ''}
                        onChange={(e) =>
                          setFormDeliverer({
                            ...formDeliverer,
                            telefone: maskPhone(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Veículo / Placa:</label>
                      <input
                        type="text"
                        value={formDeliverer.veiculo || ''}
                        onChange={(e) =>
                          setFormDeliverer({ ...formDeliverer, veiculo: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CPF:</label>
                      <input
                        type="text"
                        value={formDeliverer.cpf || ''}
                        onChange={(e) =>
                          setFormDeliverer({
                            ...formDeliverer,
                            cpf: maskCnpjCpf(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CEP:</label>
                      <input
                        type="text"
                        value={formDeliverer.cep || ''}
                        onChange={(e) =>
                          setFormDeliverer({ ...formDeliverer, cep: maskCep(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formDeliverer.endereco || ''}
                      onChange={(e) =>
                        setFormDeliverer({ ...formDeliverer, endereco: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* Fields for Aplicativos */}
              {activeSubTab === 'aplicativos' && (
                <>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Razão Social:</label>
                    <input
                      type="text"
                      required
                      value={formApp.razaoSocial || ''}
                      onChange={(e) => setFormApp({ ...formApp, razaoSocial: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Telefone:</label>
                      <input
                        type="text"
                        value={formApp.telefone || ''}
                        onChange={(e) =>
                          setFormApp({ ...formApp, telefone: maskPhone(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Comissão (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formApp.taxaComissao || 0}
                        onChange={(e) =>
                          setFormApp({
                            ...formApp,
                            taxaComissao: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CNPJ:</label>
                      <input
                        type="text"
                        value={formApp.cpfCnpj || ''}
                        onChange={(e) =>
                          setFormApp({ ...formApp, cpfCnpj: maskCnpjCpf(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CEP:</label>
                      <input
                        type="text"
                        value={formApp.cep || ''}
                        onChange={(e) =>
                          setFormApp({ ...formApp, cep: maskCep(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formApp.endereco || ''}
                      onChange={(e) => setFormApp({ ...formApp, endereco: e.target.value })}
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* Fields for Fornecedores */}
              {activeSubTab === 'fornecedores' && (
                <>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Razão Social:</label>
                    <input
                      type="text"
                      required
                      value={formSupplier.razaoSocial || ''}
                      onChange={(e) =>
                        setFormSupplier({ ...formSupplier, razaoSocial: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Contato Responsável:</label>
                      <input
                        type="text"
                        value={formSupplier.contato || ''}
                        onChange={(e) =>
                          setFormSupplier({ ...formSupplier, contato: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Telefone:</label>
                      <input
                        type="text"
                        value={formSupplier.telefone || ''}
                        onChange={(e) =>
                          setFormSupplier({
                            ...formSupplier,
                            telefone: maskPhone(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CNPJ:</label>
                      <input
                        type="text"
                        value={formSupplier.cpfCnpj || ''}
                        onChange={(e) =>
                          setFormSupplier({
                            ...formSupplier,
                            cpfCnpj: maskCnpjCpf(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CEP:</label>
                      <input
                        type="text"
                        value={formSupplier.cep || ''}
                        onChange={(e) =>
                          setFormSupplier({ ...formSupplier, cep: maskCep(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formSupplier.endereco || ''}
                      onChange={(e) =>
                        setFormSupplier({ ...formSupplier, endereco: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {/* Fields for Colaboradores */}
              {activeSubTab === 'colaboradores' && (
                <>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Nome Completo:</label>
                    <input
                      type="text"
                      required
                      value={formEmployee.nome || ''}
                      onChange={(e) =>
                        setFormEmployee({ ...formEmployee, nome: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Função / Cargo:</label>
                      <input
                        type="text"
                        required
                        value={formEmployee.funcao || ''}
                        onChange={(e) =>
                          setFormEmployee({ ...formEmployee, funcao: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Data Admissão:</label>
                      <input
                        type="date"
                        value={formEmployee.dataAdmissao || ''}
                        onChange={(e) =>
                          setFormEmployee({ ...formEmployee, dataAdmissao: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">Telefone:</label>
                      <input
                        type="text"
                        value={formEmployee.telefone || ''}
                        onChange={(e) =>
                          setFormEmployee({
                            ...formEmployee,
                            telefone: maskPhone(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-zinc-700 block mb-1">CPF:</label>
                      <input
                        type="text"
                        value={formEmployee.cpf || ''}
                        onChange={(e) =>
                          setFormEmployee({
                            ...formEmployee,
                            cpf: maskCnpjCpf(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">Endereço:</label>
                    <input
                      type="text"
                      value={formEmployee.endereco || ''}
                      onChange={(e) =>
                        setFormEmployee({ ...formEmployee, endereco: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">CEP:</label>
                    <input
                      type="text"
                      value={formEmployee.cep || ''}
                      onChange={(e) =>
                        setFormEmployee({ ...formEmployee, cep: maskCep(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}

              {/* Submit toolbar */}
              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Registro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
