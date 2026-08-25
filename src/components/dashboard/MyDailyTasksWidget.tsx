import React, { useState, useEffect } from 'react';
import { 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  GripVertical, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Trash2, 
  CheckSquare, 
  Check,
  Layers, 
  Tag, 
  ChevronDown, 
  ChevronUp,
  Circle,
  PlayCircle
} from 'lucide-react';
import { triggerHaptic } from '../../helpers/hapticSwipe';

export interface DailyTask {
  id: string;
  titleAr: string;
  titleEn: string;
  projectAr?: string;
  projectEn?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  dueTime?: string;
  assignedToEmail?: string;
  categoryAr?: string;
  categoryEn?: string;
}

interface MyDailyTasksWidgetProps {
  lang: 'ar' | 'en';
  currentUser?: any;
}

const DEFAULT_TASKS: DailyTask[] = [
  {
    id: 'dt-1',
    titleAr: 'اعتماد صرف الموازنة التشغيلية لمشروع سلة الإغاثة - تعز',
    titleEn: 'Approve operational budget disbursement for Relief Basket - Taiz',
    projectAr: 'مشروع الإغاثة العاجلة',
    projectEn: 'Emergency Relief Project',
    priority: 'high',
    status: 'todo',
    dueDate: 'اليوم',
    dueTime: '14:00',
    categoryAr: 'اعتمادات مالية',
    categoryEn: 'Financial Approvals'
  },
  {
    id: 'dt-2',
    titleAr: 'مراجعة وتقييم تقرير الكفالات الشهري لـ 150 يتيم في مأرب',
    titleEn: 'Review monthly sponsorship report for 150 orphans in Marib',
    projectAr: 'برنامج كفالة الأيتام',
    projectEn: 'Orphan Sponsorship Program',
    priority: 'high',
    status: 'in_progress',
    dueDate: 'اليوم',
    dueTime: '16:30',
    categoryAr: 'رعاية اجتماعية',
    categoryEn: 'Social Welfare'
  },
  {
    id: 'dt-3',
    titleAr: 'رفع التقرير الدوري للمانحين (UNOCHA / WFP)',
    titleEn: 'Submit periodic donor compliance report (UNOCHA / WFP)',
    projectAr: 'شراكات المانحين الدوليين',
    projectEn: 'International Donor Partnerships',
    priority: 'medium',
    status: 'todo',
    dueDate: 'اليوم',
    dueTime: '17:00',
    categoryAr: 'تقارير وشراكات',
    categoryEn: 'Reports & Partnerships'
  },
  {
    id: 'dt-4',
    titleAr: 'المصادقة على أذونات التوريد للمستودع المركزي - الحدبدة',
    titleEn: 'Validate central warehouse supply vouchers - Hodeidah',
    projectAr: 'سلاسل الإمداد واللوجستية',
    projectEn: 'Supply Chain & Logistics',
    priority: 'medium',
    status: 'in_progress',
    dueDate: 'اليوم',
    dueTime: '18:00',
    categoryAr: 'لوجستيات',
    categoryEn: 'Logistics'
  },
  {
    id: 'dt-5',
    titleAr: 'عقد اجتماع التنسيق الميداني مع فرق المسح الميداني',
    titleEn: 'Hold field coordination sync with field survey team',
    projectAr: 'مسح المستفيدين 2026',
    projectEn: 'Beneficiary Assessment 2026',
    priority: 'low',
    status: 'completed',
    dueDate: 'اليوم',
    dueTime: '11:00',
    categoryAr: 'اجتماعات ميدانية',
    categoryEn: 'Field Meetings'
  }
];

function MyDailyTasksWidgetInner({ lang, currentUser }: MyDailyTasksWidgetProps) {
  const isRtl = lang === 'ar';
  const userEmail = currentUser?.email || 'admin@rohamaab.org';
  const userName = currentUser?.name || (isRtl ? 'المدير التنفيذي' : 'Executive Director');

  const [tasks, setTasks] = useState<DailyTask[]>(() => {
    try {
      const saved = localStorage.getItem(`nexora_daily_tasks_${userEmail}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_TASKS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<'todo' | 'in_progress' | 'completed' | null>(null);

  // New task inline modal / form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  useEffect(() => {
    try {
      localStorage.setItem(`nexora_daily_tasks_${userEmail}`, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks, userEmail]);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
    triggerHaptic('light');
  };

  const handleDragOver = (e: React.DragEvent, status: 'todo' | 'in_progress' | 'completed') => {
    e.preventDefault();
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverStatus(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'completed') => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDragOverStatus(null);
    setDraggedTaskId(null);

    if (taskId) {
      updateTaskStatus(taskId, targetStatus);
      triggerHaptic('medium');
    }
  };

  const updateTaskStatus = (taskId: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: DailyTask = {
      id: `dt-${Date.now()}`,
      titleAr: newTitle.trim(),
      titleEn: newTitle.trim(),
      projectAr: newProject.trim() || (isRtl ? 'مهام التشغيل اليومية' : 'Daily Operational Tasks'),
      projectEn: newProject.trim() || 'Daily Operational Tasks',
      priority: newPriority,
      status: 'todo',
      dueDate: isRtl ? 'اليوم' : 'Today',
      dueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      categoryAr: isRtl ? 'متابعات سريعة' : 'Quick Actions',
      categoryEn: 'Quick Actions'
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTitle('');
    setNewProject('');
    setIsAddingTask(false);
    triggerHaptic('medium');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    triggerHaptic('light');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = searchQuery === '' || 
      (t.titleAr && t.titleAr.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.titleEn && t.titleEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.projectAr && t.projectAr.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shadow-xs">
            <ListTodo className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                {isRtl ? 'مهامي اليومية والتشغيلية' : 'My Daily Operational Tasks'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                {userName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {isRtl 
                ? 'إدارة وسحب وإفلات المهام اليومية الفردية لمتابعة الإنجاز والاعتمادات' 
                : 'Interactive drag-and-drop daily task board for real-time tracking.'}
            </p>
          </div>
        </div>

        {/* Progress & Add Task Button */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {isRtl ? 'نسبة الإنجاز اليومي' : 'Daily Progress'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-24 h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{completionPercentage}%</span>
            </div>
          </div>

          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة مهمة جديدة' : 'Add New Task'}</span>
          </button>
        </div>
      </div>

      {/* Add Task Form Collapsible */}
      {isAddingTask && (
        <form onSubmit={handleAddNewTask} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            {isRtl ? 'إضافة مهمة جديدة إلى قائمة اليوم' : 'Add New Daily Task'}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder={isRtl ? 'عنوان المهمة المطلوب تنفيذها...' : 'Task title...'}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="md:col-span-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder={isRtl ? 'اسم المشروع / القطاع (اختياري)' : 'Project / Sector (optional)'}
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">{isRtl ? 'الأولوية:' : 'Priority:'}</span>
              {(['low', 'medium', 'high'] as const).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                    newPriority === p
                      ? p === 'high' ? 'bg-rose-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                      : 'bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {p === 'high' ? (isRtl ? 'عالية جداً' : 'High') : p === 'medium' ? (isRtl ? 'متوسطة' : 'Medium') : (isRtl ? 'عادية' : 'Low')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 text-slate-700 dark:text-zinc-300 text-xs font-bold rounded-lg"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
              >
                {isRtl ? 'حفظ المهمة' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 dir-rtl:right-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={isRtl ? 'بحث في المهام اليومية...' : 'Search daily tasks...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 dir-rtl:pr-9 dir-rtl:pl-3 py-1.5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isRtl ? 'الأولوية:' : 'Priority:'}
          </span>
          {(['all', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                priorityFilter === p
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
              }`}
            >
              {p === 'all' ? (isRtl ? 'الكل' : 'All') : p === 'high' ? (isRtl ? 'عالية' : 'High') : p === 'medium' ? (isRtl ? 'متوسطة' : 'Medium') : (isRtl ? 'عادية' : 'Low')}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Drag & Drop Columns (3 Column Board) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
        {/* COLUMN 1: TO DO (المعلقة) */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'todo')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'todo')}
          className={`bg-slate-50/70 dark:bg-zinc-950/70 border rounded-2xl p-3.5 transition-colors min-h-[220px] flex flex-col ${
            dragOverStatus === 'todo'
              ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Circle className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isRtl ? 'مهام معلقة' : 'To Do'}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {todoTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {todoTasks.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-400 text-[11px] italic border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                {isRtl ? 'لا توجد مهام معلقة. اسحب مهام إلى هنا' : 'No tasks pending. Drag tasks here.'}
              </div>
            ) : (
              todoTasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  lang={lang}
                  onDragStart={handleDragStart}
                  onMoveStatus={(newStatus) => updateTaskStatus(task.id, newStatus)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: IN PROGRESS (قيد التنفيذ) */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'in_progress')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'in_progress')}
          className={`bg-slate-50/70 dark:bg-zinc-950/70 border rounded-2xl p-3.5 transition-colors min-h-[220px] flex flex-col ${
            dragOverStatus === 'in_progress'
              ? 'border-blue-500 bg-blue-500/5 ring-2 ring-blue-500/20'
              : 'border-slate-200 dark:border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isRtl ? 'قيد التنفيذ' : 'In Progress'}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {inProgressTasks.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-400 text-[11px] italic border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                {isRtl ? 'لا توجد مهام قيد التنفيذ حالياً' : 'No tasks in progress.'}
              </div>
            ) : (
              inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  lang={lang}
                  onDragStart={handleDragStart}
                  onMoveStatus={(newStatus) => updateTaskStatus(task.id, newStatus)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: COMPLETED (المكتملة) */}
        <div 
          onDragOver={(e) => handleDragOver(e, 'completed')}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'completed')}
          className={`bg-slate-50/70 dark:bg-zinc-950/70 border rounded-2xl p-3.5 transition-colors min-h-[220px] flex flex-col ${
            dragOverStatus === 'completed'
              ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/20'
              : 'border-slate-200 dark:border-zinc-800/80'
          }`}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {isRtl ? 'مكتملة' : 'Completed'}
              </h4>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {completedTasks.length}
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {completedTasks.length === 0 ? (
              <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-slate-400 text-[11px] italic border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-center">
                {isRtl ? 'اسحب المهمة المكتملة إلى هنا' : 'Drag completed tasks here.'}
              </div>
            ) : (
              completedTasks.map(task => (
                <TaskCard 
                  key={task.id}
                  task={task}
                  lang={lang}
                  onDragStart={handleDragStart}
                  onMoveStatus={(newStatus) => updateTaskStatus(task.id, newStatus)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(MyDailyTasksWidgetInner);
export { MyDailyTasksWidgetInner as MyDailyTasksWidget };

// Single Task Card Component
interface TaskCardProps {
  key?: string;
  task: DailyTask;
  lang: 'ar' | 'en';
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onMoveStatus: (newStatus: 'todo' | 'in_progress' | 'completed') => void;
  onDelete: () => void;
}

function TaskCard({ task, lang, onDragStart, onMoveStatus, onDelete }: TaskCardProps) {
  const isRtl = lang === 'ar';

  const priorityColor = 
    task.priority === 'high' 
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' 
      : task.priority === 'medium'
      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700';

  const priorityLabel = 
    task.priority === 'high' ? (isRtl ? 'عالية' : 'High') : task.priority === 'medium' ? (isRtl ? 'متوسطة' : 'Medium') : (isRtl ? 'عادية' : 'Low');

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs hover:shadow-md transition group cursor-grab active:cursor-grabbing relative overflow-hidden"
    >
      {/* Top row: Priority & Drag handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${priorityColor}`}>
            {priorityLabel}
          </span>
          {task.categoryAr && (
            <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {isRtl ? task.categoryAr : task.categoryEn}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
          <button 
            onClick={onDelete}
            title={isRtl ? 'حذف المهمة' : 'Delete Task'}
            className="p-1 hover:text-rose-500 text-slate-400 transition"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Task Title */}
      <h5 className={`text-xs font-bold text-slate-900 dark:text-white leading-snug mb-2 ${task.status === 'completed' ? 'line-through text-slate-400 dark:text-zinc-500' : ''}`}>
        {isRtl ? task.titleAr : task.titleEn}
      </h5>

      {/* Project Tag & Due Time */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800/60 text-[10px] text-slate-500">
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[130px]">
          {isRtl ? task.projectAr : task.projectEn}
        </span>
        {task.dueTime && (
          <span className="flex items-center gap-1 font-mono text-slate-400 shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            {task.dueTime}
          </span>
        )}
      </div>

      {/* Quick Move Action Buttons (for non-drag mobile/touch convenience) */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/40 flex items-center justify-between">
        <span className="text-[9px] text-slate-400 font-medium">
          {isRtl ? 'تغيير الحالة السريع:' : 'Quick Status:'}
        </span>
        <div className="flex items-center gap-1">
          {task.status !== 'todo' && (
            <button
              onClick={() => onMoveStatus('todo')}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-white text-slate-600 dark:text-zinc-400 text-[9px] font-bold rounded transition"
            >
              {isRtl ? 'معلقة' : 'To Do'}
            </button>
          )}
          {task.status !== 'in_progress' && (
            <button
              onClick={() => onMoveStatus('in_progress')}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-500 hover:text-white text-slate-600 dark:text-zinc-400 text-[9px] font-bold rounded transition"
            >
              {isRtl ? 'تنفيذ' : 'In Progress'}
            </button>
          )}
          {task.status !== 'completed' && (
            <button
              onClick={() => onMoveStatus('completed')}
              className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-white text-slate-600 dark:text-zinc-400 text-[9px] font-bold rounded transition flex items-center gap-1"
            >
              <Check className="w-2.5 h-2.5" />
              {isRtl ? 'إكتمل' : 'Done'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
