import React, { useState, useMemo, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const initialData = [
  {
    id: '1',
    clientName: 'Apto 124 - Jardins',
    architectName: 'Studio MK27',
    hasDesign: true,
    serviceDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    estimatedDays: 4,
    status: 'elaboracao',
    isReady: true,
    notes: 'Reunião inicial produtiva. Deseja móveis planejados em tons neutros, amadeirados leves para toda a suíte master e sala de estar integrada.',
    progressNotes: 'Medidas confirmadas in loco. Arquiteto enviou o arquivo final em DWG. Iniciando a modelagem do painel ripado da sala.'
  },
  {
    id: '2',
    clientName: 'Casa Alphaville',
    architectName: 'Cliente Direto',
    hasDesign: false,
    serviceDate: new Date().toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    estimatedDays: 10,
    status: 'briefing',
    isReady: false,
    notes: 'Cliente não possui projeto técnico estruturado. Será necessário fazer levantamento in loco das medidas da cozinha gourmet e área da ilha.',
    progressNotes: 'Agendado visita de medição técnica para próxima terça-feira às 14h.'
  },
  {
    id: '3',
    clientName: 'Consultório Odonto',
    architectName: 'Arq. Beatriz Linhares',
    hasDesign: true,
    serviceDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    presentationDate: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString().split('T')[0], 
    estimatedDays: 3,
    status: 'elaboracao',
    isReady: false,
    notes: 'Arquiteta parceira enviou DWG completo. Exigência de gaveteiros com corrediças ocultas e click system em todas as frentes de armário clínico.',
    progressNotes: 'Modelagem 3D finalizada. Estrutura de gaveteiros detalhada. Iniciando o plano de corte para precificação fina de ferragens Blum.'
  }
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const calculateDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / MS_PER_DAY);
};

const formatDate = (dateString) => {
  if (!dateString) return '--/--/----';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err) {
      console.error(err);
      setLoginError('Credenciais inválidas. Verifique seu e-mail e senha.');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('idelli_flow_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Erro ao carregar dados do localStorage:", e);
      }
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('idelli_flow_projects', JSON.stringify(projects));
  }, [projects]);
  const [activeView, setActiveView] = useState('list'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Drag and Drop State for Desktop
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null); 
  
  // Mobile active Kanban Column tab
  const [mobileActiveColumn, setMobileActiveColumn] = useState('briefing');
  
  // Menu dropdown toggles for quick status changing on mobile/touch
  const [activeStatusMenuId, setActiveStatusMenuId] = useState(null);

  const [formData, setFormData] = useState({
    clientName: '',
    architectName: '',
    hasDesign: true,
    serviceDate: new Date().toISOString().split('T')[0],
    presentationDate: '',
    estimatedDays: 1,
    status: 'briefing',
    isReady: false,
    notes: '',
    progressNotes: ''
  });

  const todayDateString = new Date().toISOString().split('T')[0];

  const Icons = {
    List: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>,
    Kanban: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>,
    Gantt: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>,
    Plus: () => <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>,
    Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Clock: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    Check: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>,
    ArrowUp: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"></path></svg>,
    ArrowDown: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"></path></svg>,
    ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>,
    Ellipsis: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>,
    Edit: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"></path></svg>
  };

  const columns = [
    { id: 'briefing', title: 'Briefing', accent: 'bg-[#800c30]', border: 'border-slate-200', bgHeader: 'bg-slate-50' },
    { id: 'elaboracao', title: 'Em Elaboração', accent: 'bg-[#a31441]', border: 'border-slate-200', bgHeader: 'bg-slate-50' },
    { id: 'apresentado', title: 'Apresentado', accent: 'bg-[#c22d5a]', border: 'border-slate-200', bgHeader: 'bg-slate-50' },
    { id: 'negociacao', title: 'Em Negociação', accent: 'bg-emerald-600', border: 'border-slate-200', bgHeader: 'bg-slate-50' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProject = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      estimatedDays: parseInt(formData.estimatedDays, 10),
      progressNotes: formData.progressNotes || ''
    };
    setProjects([...projects, newProject]);
    setIsModalOpen(false);
    setFormData({
      clientName: '',
      architectName: '',
      hasDesign: true,
      serviceDate: new Date().toISOString().split('T')[0],
      presentationDate: '',
      estimatedDays: 1,
      status: 'briefing',
      isReady: false,
      notes: '',
      progressNotes: ''
    });
  };

  const deleteProject = (id) => {
    setProjects(projects.filter(p => p.id !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const changeProjectStatus = (projectId, newStatus) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    setActiveStatusMenuId(null);
  };

  const toggleProjectReady = (projectId) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, isReady: !p.isReady } : p));
  };

  const updateProgressNotes = (projectId, notes) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, progressNotes: notes } : p));
  };

  const handleDragStartKanban = (e, project) => {
    setDraggedItem(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEndKanban = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragOverKanban = (e, columnId) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDropKanban = (e, targetStatus) => {
    e.preventDefault();
    if (!draggedItem) return;
    changeProjectStatus(draggedItem.id, targetStatus);
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const changePriority = (id, direction) => {
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) return;
    
    const newProjects = [...projects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < projects.length) {
      const temp = newProjects[index];
      newProjects[index] = newProjects[targetIndex];
      newProjects[targetIndex] = temp;
      setProjects(newProjects);
    }
  };

  const timelineData = useMemo(() => {
    if (projects.length === 0) {
      const base = new Date();
      return { minDate: base, maxDate: base, totalDays: 1, dateRange: [] };
    }

    let minDate = new Date(todayDateString);
    let maxDate = new Date(todayDateString);

    projects.forEach(p => {
      const sDate = new Date(p.serviceDate);
      const pDate = new Date(p.presentationDate);
      if (sDate < minDate) minDate = sDate;
      if (pDate > maxDate) maxDate = pDate;
    });

    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);

    const totalDays = calculateDaysBetween(minDate.toISOString().split('T')[0], maxDate.toISOString().split('T')[0]);
    
    const dateRange = [];
    const tempDate = new Date(minDate);
    for (let i = 0; i <= totalDays; i++) {
      dateRange.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }

    return { minDate, maxDate, totalDays, dateRange };
  }, [projects, todayDateString]);

  // VOLTA AO UX ANTERIOR: Resumo em formato de LINHAS elegantes e horizontais
  const renderListView = () => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="divide-y divide-slate-100">
        {projects.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400 font-medium text-sm">
            Nenhum projeto registrado no sistema. Adicione um novo lead para iniciar.
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              className={`p-5 sm:p-6 hover:bg-slate-50/40 transition-all duration-200 ${
                project.isReady ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
              }`}
            >
              {/* Linha Superior: Dados Principais e Ações estruturadas horizontalmente */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                
                {/* Lado Esquerdo: Identificação */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex flex-col">
                    <h4 
                      onClick={() => setSelectedProjectId(project.id)}
                      className="text-base sm:text-lg font-bold text-slate-800 leading-tight cursor-pointer hover:text-[#800c30] hover:underline transition-colors inline-flex items-center gap-2"
                    >
                      {project.clientName}
                      <span className="text-slate-400 hover:text-[#800c30] cursor-pointer text-xs" title="Ver Diário & Detalhes">
                        <Icons.Edit />
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Parceiro: <span className="text-[#800c30] font-bold">{project.architectName}</span>
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Informações essenciais e ações */}
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 shrink-0">
                  
                  {/* Projeto Técnico (Sim ou Não) */}
                  <div className="min-w-[100px]">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Proj. Técnico</span>
                    <span className={`text-sm font-semibold ${project.hasDesign ? 'text-[#800c30]' : 'text-slate-400'}`}>
                      {project.hasDesign ? 'Sim' : 'Não'}
                    </span>
                  </div>

                  {/* Status de Elaboração Interna */}
                  <div className="min-w-[140px]">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Modelagem / Orçamento</span>
                    <button 
                      onClick={() => toggleProjectReady(project.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        project.isReady 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${project.isReady ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {project.isReady ? 'Desenho Pronto' : 'Marcar Pronto'}
                    </button>
                  </div>

                  {/* Atendimento e Apresentação */}
                  <div className="min-w-[150px]">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">Datas do Fluxo</span>
                    <div className="text-xs text-slate-600 font-medium">
                      Atend: <span className="text-slate-800 font-semibold">{formatDate(project.serviceDate)}</span>
                      <span className="mx-2 text-slate-200">|</span> 
                      Apres: <span className="font-bold text-[#800c30]">{formatDate(project.presentationDate)}</span>
                    </div>
                  </div>

                  {/* Excluir Lead */}
                  <div className="flex items-center pl-2">
                    <button 
                      onClick={() => deleteProject(project.id)} 
                      className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-all"
                      title="Excluir Lead"
                    >
                      <Icons.Trash />
                    </button>
                  </div>

                </div>
              </div>

              {/* Linha Inferior: Notas de primeiro contato elegantes (rodapé) */}
              {project.notes && (
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                  <p className="text-slate-500 italic border-l-2 border-[#800c30] pl-3 max-w-full leading-relaxed">
                    "{project.notes}"
                  </p>
                  {project.progressNotes && (
                    <div className="mt-2.5 pl-3 flex items-baseline gap-1">
                      <span className="text-[9px] font-bold text-[#800c30] uppercase shrink-0">Último andamento:</span>
                      <p className="text-[10px] text-slate-600 truncate italic">
                        {project.progressNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderKanbanView = () => {
    const renderColumnContent = (columnId) => {
      const columnProjects = projects.filter(p => p.status === columnId);
      
      return (
        <div className="space-y-4 min-h-[300px] md:min-h-[500px]">
          {columnProjects.map((project) => {
            const daysRemaining = calculateDaysBetween(todayDateString, project.presentationDate);
            const isLate = daysRemaining < 0;
            const initials = project.clientName.slice(0, 2).toUpperCase();

            let urgencyStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
            if (isLate) {
              urgencyStyle = "bg-rose-50 text-rose-700 border-rose-100";
            } else if (daysRemaining <= 2) {
              urgencyStyle = "bg-amber-50 text-amber-700 border-amber-100";
            } else if (daysRemaining <= 5) {
              urgencyStyle = "bg-rose-50/50 text-[#800c30] border-[#800c30]/10";
            }

            return (
              <div 
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStartKanban(e, project)}
                onDragEnd={handleDragEndKanban}
                className={`group relative bg-white p-4 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md ${
                  project.isReady ? 'border-l-4 border-l-emerald-500 border-slate-200' : 'border-slate-200'
                } ${
                  draggedItem?.id === project.id ? 'opacity-30 border-dashed border-[#800c30]/40' : ''
                }`}
              >
                {/* Header do Card no Kanban */}
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-[#800c30] border border-slate-200 shrink-0">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <h4 
                        onClick={() => setSelectedProjectId(project.id)}
                        className="font-bold text-slate-800 text-sm truncate leading-tight group-hover:text-[#800c30] group-hover:underline cursor-pointer transition-colors"
                      >
                        {project.clientName}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {project.architectName}
                      </p>
                    </div>
                  </div>

                  {/* Ações e mudança de Status rápida */}
                  <div className="relative shrink-0 flex items-center gap-1">
                    <div className="hidden md:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => changePriority(project.id, 'up')}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100"
                        title="Subir Prioridade"
                      >
                        <Icons.ArrowUp />
                      </button>
                      <button 
                        onClick={() => changePriority(project.id, 'down')}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-100"
                        title="Descer Prioridade"
                      >
                        <Icons.ArrowDown />
                      </button>
                    </div>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStatusMenuId(activeStatusMenuId === project.id ? null : project.id);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Mudar Status"
                    >
                      <Icons.Ellipsis />
                    </button>

                    {activeStatusMenuId === project.id && (
                      <div className="absolute right-0 top-7 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-1 space-y-1">
                        <div className="text-[10px] text-slate-400 font-bold px-2 py-1 uppercase tracking-wider">Mover etapa</div>
                        {columns.map(col => (
                          <button
                            key={col.id}
                            disabled={project.status === col.id}
                            onClick={() => changeProjectStatus(project.id, col.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                              project.status === col.id 
                                ? 'bg-slate-100 text-[#800c30]' 
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            {col.title}
                            {project.status === col.id && <span className="w-1.5 h-1.5 rounded-full bg-[#800c30]" />}
                          </button>
                        ))}
                        <div className="border-t border-slate-100 my-1"></div>
                        <button 
                          onClick={() => {
                            deleteProject(project.id);
                            setActiveStatusMenuId(null);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center justify-between"
                        >
                          Excluir Lead <Icons.Trash />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas de Primeiro Contato Breves se existirem */}
                {project.notes && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic mb-1.5 bg-slate-50 p-2 rounded-lg leading-relaxed border-l border-slate-200">
                    "{project.notes}"
                  </p>
                )}

                {/* Ultimas Observações de Andamento compactadas */}
                {project.progressNotes && (
                  <div className="mb-3 px-2 py-1 bg-slate-50 rounded border border-slate-100">
                    <span className="text-[9px] text-[#800c30] font-bold block uppercase tracking-wider">Andamento:</span>
                    <p className="text-[10px] text-slate-600 line-clamp-2 italic leading-normal">
                      "{project.progressNotes}"
                    </p>
                  </div>
                )}

                {/* Footer do card com cronômetro de entrega */}
                <div className="space-y-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${urgencyStyle}`}>
                    <Icons.Clock />
                    {isLate ? `${Math.abs(daysRemaining)}d atrasado` : `${daysRemaining}d`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProjectReady(project.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        project.isReady 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <Icons.Check />
                      {project.isReady ? 'Pronto' : 'Fazer'}
                    </button>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      project.hasDesign 
                        ? 'bg-slate-100 text-[#800c30] border-slate-200' 
                        : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {project.hasDesign ? 'Com Planta' : 'Sem Planta'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {columnProjects.length === 0 && (
            <div className="flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl py-12 px-4 text-center">
              Sem projetos aqui
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        
        {/* Seletor Mobile do Kanban */}
        <div className="flex md:hidden bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto gap-1">
          {columns.map(column => {
            const count = projects.filter(p => p.status === column.id).length;
            const isTabActive = mobileActiveColumn === column.id;
            return (
              <button
                key={column.id}
                onClick={() => setMobileActiveColumn(column.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isTabActive 
                    ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-200' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {column.title}
                <span className="bg-slate-200 text-[10px] px-1.5 py-0.25 rounded-full text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Visualização Colunas (Computadores) */}
        <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {columns.map(column => {
            const isOver = dragOverColumn === column.id;
            const count = projects.filter(p => p.status === column.id).length;
            return (
              <div 
                key={column.id} 
                className={`rounded-2xl border bg-slate-50 flex flex-col transition-all duration-300 shadow-sm overflow-hidden border-slate-200 ${
                  isOver ? 'bg-slate-100 scale-[1.02] border-[#800c30]/50 ring-4 ring-[#800c30]/5' : ''
                }`}
                onDragOver={(e) => handleDragOverKanban(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDropKanban(e, column.id)}
              >
                <div className={`p-4 border-b border-slate-200 ${column.bgHeader} flex justify-between items-center`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3 h-3 rounded-full ${column.accent} shadow-sm`}></span>
                    <h3 className="font-bold text-slate-700 text-xs tracking-wide uppercase">{column.title}</h3>
                  </div>
                  <span className="bg-white text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-600 border border-slate-200 shadow-2xs">
                    {count}
                  </span>
                </div>
                <div className="p-4 space-y-4">
                  {renderColumnContent(column.id)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Visualização de coluna ativa no Mobile */}
        <div className="block md:hidden">
          {columns.map(column => {
            if (column.id !== mobileActiveColumn) return null;
            return (
              <div key={column.id} className="rounded-2xl border bg-slate-50 p-4 border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Projetos em {column.title}</span>
                  <span className="bg-white text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-600">{projects.filter(p => p.status === column.id).length}</span>
                </div>
                {renderColumnContent(column.id)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGanttView = () => {
    const { minDate, totalDays, dateRange } = timelineData;
    const todayIndex = calculateDaysBetween(minDate.toISOString().split('T')[0], todayDateString);
    const todayLeftPercentage = (todayIndex / totalDays) * 100;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        
        {/* Título e introdução */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#800c30]"></span>
              Cronograma & Dias Estimados
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Veja a distribuição dos dias estimados em relação ao prazo final de apresentação acordado.
            </p>
          </div>

          <span className="text-xs bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-slate-600 self-start sm:self-auto">
            Arraste os cartões no <span className="text-[#800c30] font-bold">Kanban</span> para reordenar a prioridade
          </span>
        </div>
        
        {/* Painel do Gantt */}
        <div className="w-full overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50 relative">
          <div className="min-w-[850px] relative pb-6 pt-10">
            
            {/* Linha de marcação no cabeçalho */}
            <div className="absolute top-0 left-[220px] right-4 h-10 border-b border-slate-200 flex justify-between pointer-events-none">
              {dateRange.map((date, idx) => {
                const isToday = date.toISOString().split('T')[0] === todayDateString;
                return (
                  <div key={idx} className="flex-1 border-r border-slate-100 text-[10px] font-bold text-slate-400 flex flex-col justify-end items-center pb-1">
                    <span className={isToday ? 'text-rose-500 font-extrabold' : ''}>
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                    {isToday && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5" />}
                  </div>
                );
              })}
            </div>

            {/* Marcador do dia Atual */}
            {todayLeftPercentage >= 0 && todayLeftPercentage <= 100 && (
              <div 
                className="absolute top-10 bottom-0 w-[2px] bg-rose-500/40 z-10 pointer-events-none"
                style={{ left: `calc(220px + (100% - 236px) * (${todayLeftPercentage} / 100))` }}
              />
            )}

            {/* Projetos distribuídos */}
            <div className="space-y-4 pt-4">
              {projects.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">Nenhum projeto ativo para analisar.</div>
              )}
              {projects.map((project) => {
                const startOffsetDays = calculateDaysBetween(minDate.toISOString().split('T')[0], project.serviceDate);
                const durationDays = calculateDaysBetween(project.serviceDate, project.presentationDate);
                const daysRemaining = calculateDaysBetween(todayDateString, project.presentationDate);
                
                const leftPercent = Math.max(0, (startOffsetDays / totalDays) * 100);
                const widthPercent = Math.max(10, Math.min(100 - leftPercent, (durationDays / totalDays) * 100));
                const isOverloaded = project.estimatedDays > durationDays;

                return (
                  <div key={project.id} className="flex items-center h-14">
                    
                    {/* Lateral Esquerda */}
                    <div className="w-[220px] pr-4 shrink-0 flex flex-col justify-center border-r border-slate-200 pl-4">
                      <div 
                        onClick={() => setSelectedProjectId(project.id)}
                        className="font-bold text-xs text-slate-700 truncate flex items-center gap-1.5 cursor-pointer hover:text-[#800c30] hover:underline"
                      >
                        {project.isReady && <span className="w-2 h-2 rounded-full bg-emerald-500" title="Projeto Pronto"></span>}
                        {project.clientName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">Arq: {project.architectName}</div>
                    </div>

                    {/* Barra de Cronograma */}
                    <div className="flex-1 relative h-full flex items-center pr-4">
                      <div 
                        className={`absolute h-10 rounded-lg border shadow-xs flex flex-col justify-center px-3 py-1.5 transition-all text-[11px] overflow-hidden ${
                          isOverloaded 
                            ? 'bg-rose-50 border-rose-300 text-rose-800' 
                            : project.isReady
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        style={{ 
                          left: `${leftPercent}%`, 
                          width: `${widthPercent}%`,
                          minWidth: '220px'
                        }}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold flex items-center gap-1">
                            {project.isReady && <span className="text-emerald-500 font-black">✓</span>}
                            {project.estimatedDays} dias est.
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.25 rounded font-extrabold ${daysRemaining < 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {daysRemaining < 0 ? 'Atrasado' : `Faltam ${daysRemaining}d`}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Legendas */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 text-[11px] text-slate-500 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-white border border-slate-200 shrink-0"></span>
            Capacidade OK (Tempo de modelagem menor que o prazo final)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-300 shrink-0"></span>
            Elaboração Pronta (Desenho feito, aguardando reunião)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-300 shrink-0"></span>
            Alerta de Sobrecarga (O tempo de trabalho estimado supera o total de dias até a apresentação)
          </div>
        </div>
      </div>
    );
  };

  const renderDetailsDrawer = () => {
    if (!selectedProjectId) return null;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop escurecido */}
        <div 
          onClick={() => setSelectedProjectId(null)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
        />
        
        {/* Painel que desliza */}
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col text-slate-700">
            
            {/* Header da Gaveta */}
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#800c30] font-extrabold uppercase tracking-widest block">Detalhes do Projeto</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1 leading-tight">{project.clientName}</h3>
                <p className="text-xs text-slate-500 font-medium">Parceiro: <span className="text-slate-700 font-bold">{project.architectName}</span></p>
              </div>
              <button 
                onClick={() => setSelectedProjectId(null)} 
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-xl font-bold"
                title="Fechar Detalhes"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Badges de Status rápidos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Estágio de Negócio</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-1 block">
                    {columns.find(c => c.id === project.status)?.title || project.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Etapa de Produção</span>
                  <span className={`text-xs font-extrabold mt-1 block ${project.isReady ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {project.isReady ? '● Pronto p/ Reunião' : '● Em Fila / Fazer'}
                  </span>
                </div>
              </div>

              {/* Informações de datas de planejamento */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Data de Atendimento:</span>
                  <span className="font-semibold text-slate-600">{formatDate(project.serviceDate)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Apresentação Marcada:</span>
                  <span className="font-bold text-[#800c30]">{formatDate(project.presentationDate)}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-3">
                  <span className="text-slate-400">Dias Estimados de Trabalho:</span>
                  <span className="font-bold text-slate-700">{project.estimatedDays} dias</span>
                </div>
              </div>

              {/* Campo Estático: Notas de Primeiro Contato */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Anotações do Primeiro Contato</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 text-xs italic leading-relaxed">
                  "{project.notes || 'Sem anotações registradas no primeiro contato.'}"
                </div>
              </div>

              {/* NOVO CAMPO: Observações Atualizadas (Diário de Bordo Ativo) */}
              <div className="border-t border-slate-200 pt-5">
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#800c30] block">Diário do Projeto / Andamento</label>
                  <span className="text-[9px] text-slate-400 italic">Salva automaticamente</span>
                </div>
                <textarea 
                  value={project.progressNotes || ''} 
                  onChange={(e) => updateProgressNotes(project.id, e.target.value)}
                  rows="6" 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#800c30] focus:ring-1 focus:ring-[#800c30] rounded-xl px-4 py-3 text-slate-700 text-xs leading-relaxed focus:outline-none transition-all resize-none placeholder:text-slate-300" 
                  placeholder="Registre aqui as mudanças no projeto, escolhas de MDF, retorno das reuniões de andamento, pendências com arquitetos..."
                />
              </div>

            </div>

            {/* Footer da Gaveta */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
              <button 
                onClick={() => setSelectedProjectId(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all text-center border border-slate-200"
              >
                Fechar Detalhes
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl my-8 animate-in zoom-in-95 duration-200 text-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#800c30]"></span>
            Adicionar Novo Lead
          </h2>
          <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome do Cliente</label>
            <input required type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] focus:ring-1 focus:ring-[#800c30] text-sm transition-all" placeholder="Ex: Apto 154 - Pinheiros" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Arquiteto (Parceiro)</label>
            <input required type="text" name="architectName" value={formData.architectName} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] focus:ring-1 focus:ring-[#800c30] text-sm transition-all" placeholder="Nome ou 'Cliente Direto'" />
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <input type="checkbox" id="hasDesign" name="hasDesign" checked={formData.hasDesign} onChange={handleInputChange} className="w-4 h-4 text-[#800c30] rounded bg-white border-slate-300 focus:ring-[#800c30]" />
            <label htmlFor="hasDesign" className="text-xs sm:text-sm font-semibold text-slate-600 cursor-pointer select-none">O parceiro já enviou planta ou projeto técnico?</label>
          </div>

          {/* Notas do Primeiro Contato */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Anotações do Primeiro Contato</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] text-sm transition-all placeholder:text-slate-400 resize-none" placeholder="Ex: Cliente quer móveis escuros, detalhes em LED e fita de borda zero..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data Atendimento</label>
              <input required type="date" name="serviceDate" value={formData.serviceDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Data Apresentação</label>
              <input required type="date" name="presentationDate" value={formData.presentationDate} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] text-sm transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tempo Estimado de Trabalho (Dias)</label>
            <div className="flex items-center gap-3">
              <input required type="number" min="1" name="estimatedDays" value={formData.estimatedDays} onChange={handleInputChange} className="w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:border-[#800c30] text-sm transition-all" />
              <span className="text-slate-500 text-xs font-medium">dias estimados para detalhar/orçar</span>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 flex gap-3 justify-end">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 transition-colors text-sm font-semibold">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#800c30] hover:bg-[#6b0928] text-white text-sm font-semibold shadow-md shadow-[#800c30]/10 transition-all">Criar Lead</button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderLoginView = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-[#800c30]/20 selection:text-[#800c30]">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#800c30]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#800c30] flex items-center justify-center shadow-lg shadow-[#800c30]/20 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-10.5h16.5m-16.5 3h16.5m-16.5 3h16.5M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">IDÉLLI Flow</h2>
            <p className="text-xs text-slate-400 mt-1.5 font-medium text-center">Gestão Inteligente de Projetos e Leads</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold leading-relaxed">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-mail Corporativo</label>
              <input 
                required 
                type="email" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                className="w-full bg-slate-900/50 border border-slate-700 focus:border-[#800c30] focus:ring-1 focus:ring-[#800c30] rounded-xl px-4 py-3 text-white text-sm transition-all outline-none" 
                placeholder="nome@idelli.com.br" 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Senha de Acesso</label>
              <input 
                required 
                type="password" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                className="w-full bg-slate-900/50 border border-slate-700 focus:border-[#800c30] focus:ring-1 focus:ring-[#800c30] rounded-xl px-4 py-3 text-white text-sm transition-all outline-none" 
                placeholder="••••••••" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 rounded-xl bg-[#800c30] hover:bg-[#6b0928] text-white text-sm font-bold shadow-lg shadow-[#800c30]/15 hover:shadow-xl transition-all"
            >
              Acessar Painel
            </button>
          </form>

          {/* Info Footer */}
          <div className="mt-8 text-center text-[10px] text-slate-500 font-semibold tracking-wide uppercase">
            Área Restrita • IDÉLLI Design
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-[#800c30] animate-spin mb-4" />
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Carregando IDÉLLI Flow...</span>
      </div>
    );
  }

  if (!user) {
    return renderLoginView();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-3 sm:p-6 lg:p-8">
      <div className="max-w-[1440px] mx-auto space-y-6">
        
        {/* Navigation & Header Panel */}
        <header className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#800c30] flex items-center gap-2">
              <svg className="w-8 h-8 text-[#800c30]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-10.5h16.5m-16.5 3h16.5m-16.5 3h16.5M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
              </svg>
              IDÉLLI Flow
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Gestão de leads, modelagem 3D & cronograma para móveis de alto padrão</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conectado como {user.email}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View selectors */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/50">
              <button 
                id="view-list-btn"
                onClick={() => setActiveView('list')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'list' ? 'bg-white text-[#800c30] shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icons.List />
                Lista
              </button>
              <button 
                id="view-kanban-btn"
                onClick={() => setActiveView('kanban')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'kanban' ? 'bg-white text-[#800c30] shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icons.Kanban />
                Kanban
              </button>
              <button 
                id="view-gantt-btn"
                onClick={() => setActiveView('gantt')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeView === 'gantt' ? 'bg-white text-[#800c30] shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Icons.Gantt />
                Cronograma
              </button>
            </div>
            
            {/* New Lead Action Button */}
            <button 
              id="new-lead-btn"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#800c30] hover:bg-[#6b0928] text-white text-xs font-bold shadow-md shadow-[#800c30]/15 hover:shadow-lg transition-all"
            >
              <Icons.Plus />
              Novo Lead
            </button>

            {/* Logout Action Button */}
            <button 
              id="logout-btn"
              onClick={handleLogout}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border border-slate-200/85 transition-all"
              title="Sair da Conta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dashboard KPI Statistics Section */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Leads Ativos</span>
              <span className="text-xl sm:text-2xl font-black text-slate-800 mt-1 block">{projects.length}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/65">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 18H9m1.089 1.128A11.387 11.387 0 015.089 18H4m1.089 1.128v-.109c0-1.113-.285-2.16-.786-3.07M4 19.128a9.38 9.38 0 01-2.625.372 9.337 9.337 0 01-4.121-.952 4.125 4.125 0 017.533-2.493M4 19.128v-.003c0-1.113.285-2.16.786-3.07M7 10a3 3 0 11-6 0 3 3 0 016 0zm11 0a3 3 0 11-6 0 3 3 0 016 0zm-6 2a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Modelados (Prontos)</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 mt-1 block">
                {projects.filter(p => p.isReady).length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center border border-emerald-100">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Briefing/Elaboração</span>
              <span className="text-xl sm:text-2xl font-black text-[#800c30] mt-1 block">
                {projects.filter(p => p.status === 'briefing' || p.status === 'elaboracao').length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#800c30]/5 flex items-center justify-center border border-[#800c30]/10">
              <svg className="w-5 h-5 text-[#800c30]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.246.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Prazo Crítico (&lt;3d)</span>
              <span className="text-xl sm:text-2xl font-black text-rose-600 mt-1 block">
                {projects.filter(p => calculateDaysBetween(todayDateString, p.presentationDate) <= 3).length}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
        </section>

        {/* View Content Renderer */}
        <main className="mt-6">
          {activeView === 'list' && renderListView()}
          {activeView === 'kanban' && renderKanbanView()}
          {activeView === 'gantt' && renderGanttView()}
        </main>
        
        {/* Modals and Drawer Drawers */}
        {renderDetailsDrawer()}
        {isModalOpen && renderModal()}
      </div>
    </div>
  );
}
