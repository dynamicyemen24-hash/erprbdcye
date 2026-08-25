import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Users, Plus, ChevronLeft, ChevronRight, 
  Filter, CheckCircle2, CalendarRange, Briefcase, DollarSign, X, HelpCircle, Sparkles
} from 'lucide-react';
import { WidgetFrame } from '../enterprise/widgets/WidgetFrame';

interface Project {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  end_date: string | null;
}

interface CollaborativeCalendarWidgetProps {
  lang: 'ar' | 'en';
  projects: Project[];
}

interface CalendarEvent {
  id: string;
  title_ar: string;
  title_en: string;
  date: string; // YYYY-MM-DD
  category: 'PROJECT_DEADLINE' | 'FIELD_VISIT' | 'SPONSORSHIP_PAYMENT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  location_ar?: string;
  location_en?: string;
  responsible_ar: string;
  responsible_en: string;
}

function CollaborativeCalendarWidgetInner({ lang, projects }: CollaborativeCalendarWidgetProps) {
  // Real current date
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddEventModal, setShowAddEventModal] = useState(false);

  // Form State
  const [newEventTitleAr, setNewEventTitleAr] = useState('');
  const [newEventTitleEn, setNewEventTitleEn] = useState('');
  const [newEventDate, setNewEventDate] = useState(todayStr);
  const [newEventCategory, setNewEventCategory] = useState<'PROJECT_DEADLINE' | 'FIELD_VISIT' | 'SPONSORSHIP_PAYMENT'>('FIELD_VISIT');
  const [newEventPriority, setNewEventPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newEventLocationAr, setNewEventLocationAr] = useState('');
  const [newEventLocationEn, setNewEventLocationEn] = useState('');
  const [newEventRespAr, setNewEventRespAr] = useState('');
  const [newEventRespEn, setNewEventRespEn] = useState('');

  // User-created events start empty; real project deadlines stream in via props
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Combine static events with actual dynamic project deadlines from props
  const combinedEvents = useMemo(() => {
    const projectDeadlines: CalendarEvent[] = (projects || [])
      .filter(p => p.end_date)
      .map(p => ({
        id: `proj-dl-${p.id}`,
        title_ar: `الموعد النهائي لمشروع: ${p.name_ar}`,
        title_en: `Project Closing Deadline: ${p.name_en}`,
        date: p.end_date!.substring(0, 10),
        category: 'PROJECT_DEADLINE',
        priority: 'MEDIUM',
        location_ar: 'موقع تنفيذ المشروع الميداني',
        location_en: 'Field Execution Project Site',
        responsible_ar: 'مدير عمليات القطاع الموحد',
        responsible_en: 'Unified Sector Operations Director'
      }));

    // Filter out potential duplicates in ID
    const uniqueStatic = events.filter(e => !projectDeadlines.some(pd => pd.date === e.date && pd.title_en === e.title_en));
    return [...uniqueStatic, ...projectDeadlines];
  }, [events, projects]);

  // Calendar Helpers
  const monthNamesAr = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeekAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const daysOfWeekEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Generate days array for the grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: { dayNumber: number; dateString: string; isCurrentMonth: boolean }[] = [];
    
    // Previous month filling
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthTotalDays - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${y}-${String(m).padStart(2, '0')}-${String(prevDay).padStart(2, '0')}`;
      days.push({ dayNumber: prevDay, dateString, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateString, isCurrentMonth: true });
    }

    // Next month filling
    const remainingGridSlots = 42 - days.length; // standard 6-row grid
    for (let i = 1; i <= remainingGridSlots; i++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ dayNumber: i, dateString, isCurrentMonth: false });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Filters application
  const filteredEvents = useMemo(() => {
    return combinedEvents.filter(e => {
      if (filterType === 'ALL') return true;
      return e.category === filterType;
    });
  }, [combinedEvents, filterType]);

  // Index events by date for super-fast O(1) day renders
  const eventsByDate = useMemo(() => {
    const map: { [key: string]: CalendarEvent[] } = {};
    filteredEvents.forEach(e => {
      if (!map[e.date]) {
        map[e.date] = [];
      }
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  // Get events on selected date
  const selectedDateEvents = useMemo(() => {
    return eventsByDate[selectedDateStr] || [];
  }, [eventsByDate, selectedDateStr]);

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitleAr || !newEventTitleEn) return;

    const newEvent: CalendarEvent = {
      id: `custom-event-${Date.now()}`,
      title_ar: newEventTitleAr,
      title_en: newEventTitleEn,
      date: newEventDate,
      category: newEventCategory,
      priority: newEventPriority,
      location_ar: newEventLocationAr || undefined,
      location_en: newEventLocationEn || undefined,
      responsible_ar: newEventRespAr || (lang === 'ar' ? 'مجهول' : 'Anonymous'),
      responsible_en: newEventRespEn || 'Anonymous'
    };

    setEvents(prev => [...prev, newEvent]);
    setSelectedDateStr(newEventDate);
    
    // Auto sync view calendar to newly added event month
    const parsedDate = new Date(newEventDate);
    setCurrentYear(parsedDate.getFullYear());
    setCurrentMonth(parsedDate.getMonth());

    // Reset Form
    setNewEventTitleAr('');
    setNewEventTitleEn('');
    setNewEventLocationAr('');
    setNewEventLocationEn('');
    setNewEventRespAr('');
    setNewEventRespEn('');
    setShowAddEventModal(false);
  };

  return (
    <WidgetFrame
      id="collaborative_operations_calendar"
      title={lang === 'ar' ? 'التقويم الموحد للمشاريع والزيارات الميدانية' : 'Collaborative Operations Calendar'}
      subtitle={lang === 'ar' ? 'متابعة تشاركية للمواعيد النهائية وجداول صرف الكفالات الميدانية' : 'Coordinating field agendas, project deadlines, and financial payouts'}
      icon={CalendarRange}
      defaultHeight={520}
      headerActions={
        <div className="flex items-center gap-2">
          {/* Calendar Categories Filter Buttons */}
          <div className="flex bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-zinc-800/50">
            {[
              { id: 'ALL', label_ar: 'الكل', label_en: 'All' },
              { id: 'PROJECT_DEADLINE', label_ar: 'المواعيد', label_en: 'Deadlines' },
              { id: 'FIELD_VISIT', label_ar: 'الزيارات', label_en: 'Visits' },
              { id: 'SPONSORSHIP_PAYMENT', label_ar: 'الكفالات', label_en: 'Sponsorships' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setFilterType(cat.id)}
                className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-md transition-all ${
                  filterType === cat.id
                    ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {lang === 'ar' ? cat.label_ar : cat.label_en}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddEventModal(true)}
            className="flex items-center gap-1 text-[11px] font-black bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة فعالية' : 'Add Event'}</span>
          </button>
        </div>
      }
    >
      {({ width, height }) => (
        <div className="flex flex-col lg:flex-row gap-5 h-full relative">
          
          {/* Left Panel: Grid Calendar (Takes 65% width) */}
          <div className="w-full lg:w-[65%] flex flex-col justify-between border border-slate-100 dark:border-zinc-800/80 rounded-xl bg-slate-50/20 dark:bg-zinc-900/10 p-3 select-none">
            
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                  {lang === 'ar' 
                    ? `${monthNamesAr[currentMonth]} ${currentYear}` 
                    : `${monthNamesEn[currentMonth]} ${currentYear}`}
                </span>
                {currentYear === today.getFullYear() && currentMonth === today.getMonth() && (
                  <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded ml-1">
                    {lang === 'ar' ? 'الشهر الحالي' : 'Current Month'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-950 cursor-pointer text-slate-600 dark:text-zinc-400"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setCurrentYear(today.getFullYear());
                    setCurrentMonth(today.getMonth());
                    setSelectedDateStr(todayStr);
                  }}
                  className="px-2 py-1 text-[10px] font-extrabold border border-slate-200 dark:border-zinc-800 rounded-md hover:bg-white dark:hover:bg-zinc-950 cursor-pointer text-slate-600 dark:text-zinc-400"
                >
                  {lang === 'ar' ? 'اليوم' : 'Today'}
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-950 cursor-pointer text-slate-600 dark:text-zinc-400"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Calendar Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
              {(lang === 'ar' ? daysOfWeekAr : daysOfWeekEn).map((day, idx) => (
                <div key={idx}>{day}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1 flex-1 min-h-[220px]">
              {calendarDays.map((cell, idx) => {
                const isSelected = selectedDateStr === cell.dateString;
                const cellEvents = eventsByDate[cell.dateString] || [];
                const hasEvents = cellEvents.length > 0;
                
                // Colors indicator based on event categories inside cell
                let ringColor = 'border-transparent';
                if (hasEvents) {
                  const categories = cellEvents.map(e => e.category);
                  if (categories.includes('PROJECT_DEADLINE')) ringColor = 'ring-1 ring-amber-500/60';
                  else if (categories.includes('SPONSORSHIP_PAYMENT')) ringColor = 'ring-1 ring-emerald-500/60';
                  else ringColor = 'ring-1 ring-blue-500/60';
                }

                const isCurrentSimulatedDay = cell.dateString === todayStr;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateStr(cell.dateString)}
                    className={`relative p-1.5 rounded-lg border flex flex-col justify-between items-center cursor-pointer transition-all duration-200 min-h-[44px] ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-100/30 dark:bg-zinc-900/10 text-slate-300 dark:text-zinc-700 border-transparent'
                        : isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : isCurrentSimulatedDay
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-950/30 text-emerald-800 dark:text-emerald-400'
                            : 'bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 border-slate-100 dark:border-zinc-900'
                    } ${ringColor}`}
                  >
                    {/* Day number */}
                    <span className="text-xs font-black select-none">{cell.dayNumber}</span>

                    {/* Dot indicators or mini metrics inside day cell */}
                    {hasEvents && (
                      <div className="flex gap-0.5 mt-1 overflow-x-hidden max-w-full justify-center">
                        {cellEvents.slice(0, 3).map((ev, evIdx) => {
                          let dotColor = 'bg-blue-500';
                          if (ev.category === 'PROJECT_DEADLINE') dotColor = 'bg-amber-500';
                          if (ev.category === 'SPONSORSHIP_PAYMENT') dotColor = 'bg-emerald-500';
                          return (
                            <span 
                              key={evIdx} 
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor}`}
                            />
                          );
                        })}
                        {cellEvents.length > 3 && (
                          <span className={`text-[7px] font-black leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>+</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Panel: Daily agenda listing & Event details (Takes 35% width) */}
          <div className="w-full lg:w-[35%] flex flex-col justify-between min-h-[220px]">
            
            <div className="space-y-3">
              {/* Agenda Header with selected day formatted */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                    {lang === 'ar' ? 'أجندة العمليات الميدانية' : 'Field Action Agenda'}
                  </span>
                </div>
                <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/50 px-2 py-0.5 rounded">
                  {selectedDateStr}
                </span>
              </div>

              {/* Day Agenda Listing */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedDateEvents.length === 0 ? (
                  <div className="text-center py-10">
                    <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-zinc-800 mx-auto mb-2" />
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold leading-relaxed">
                      {lang === 'ar' 
                        ? 'لا توجد مواعيد مبرمجة أو زيارات ميدانية معلنة لهذا اليوم.' 
                        : 'No events, deadlines, or visits scheduled on this day.'}
                    </p>
                    <button
                      onClick={() => {
                        setNewEventDate(selectedDateStr);
                        setShowAddEventModal(true);
                      }}
                      className="mt-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {lang === 'ar' ? '+ إضافة موعد للجمعية اليوم' : '+ Schedule Event for Today'}
                    </button>
                  </div>
                ) : (
                  selectedDateEvents.map((ev) => {
                    let catName = lang === 'ar' ? 'مهمة ميدانية' : 'Field Task';
                    let catBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30';
                    let catIcon = <MapPin className="w-3.5 h-3.5 shrink-0" />;

                    if (ev.category === 'PROJECT_DEADLINE') {
                      catName = lang === 'ar' ? 'موعد نهائي' : 'Project Deadline';
                      catBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-500 border-amber-100 dark:border-amber-900/30';
                      catIcon = <Briefcase className="w-3.5 h-3.5 shrink-0" />;
                    } else if (ev.category === 'SPONSORSHIP_PAYMENT') {
                      catName = lang === 'ar' ? 'صرف كفالات' : 'Cash Payout';
                      catBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
                      catIcon = <DollarSign className="w-3.5 h-3.5 shrink-0" />;
                    }

                    return (
                      <div 
                        key={ev.id} 
                        className={`p-3 border rounded-xl hover:shadow-xs transition-all ${catBg}`}
                      >
                        <div className="flex justify-between items-start gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border bg-white/60 dark:bg-zinc-950/30">
                            {catName}
                          </span>
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            ev.priority === 'HIGH' 
                              ? 'bg-rose-100 text-rose-700' 
                              : ev.priority === 'MEDIUM' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {ev.priority}
                          </span>
                        </div>

                        <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-2 leading-relaxed">
                          {lang === 'ar' ? ev.title_ar : ev.title_en}
                        </h4>

                        <div className="mt-2.5 space-y-1 text-[10px] text-slate-500 dark:text-zinc-400 font-bold">
                          {(ev.location_ar || ev.location_en) && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{lang === 'ar' ? ev.location_ar : ev.location_en}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span>
                              {lang === 'ar' ? `المسؤول: ${ev.responsible_ar}` : `Lead: ${ev.responsible_en}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Micro Standard Sphere Compliance Notification */}
            <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/30 dark:border-emerald-950/20 rounded-xl text-[10px] text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-4">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                {lang === 'ar' 
                  ? 'يتم مزامنة تقويم العمليات مع غرف التنسيق الموحدة للشؤون الإنسانية (OCHA).' 
                  : 'Schedules synchronized with humanitarian field coordination (OCHA) agendas.'}
              </span>
            </div>

          </div>

          {/* C. Add Event Collaborative Sliding Panel Modal */}
          {showAddEventModal && (
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-zinc-950/80 backdrop-blur-xs z-50 rounded-xl flex items-center justify-center p-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 w-full max-w-md rounded-xl p-5 shadow-xl animate-scale-in">
                
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-100">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-black">
                      {lang === 'ar' ? 'جدولة فعالية تشاركية جديدة' : 'Schedule New Field Event'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowAddEventModal(false)}
                    className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddEventSubmit} className="space-y-3.5">
                  
                  {/* Category Selection */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'تصنيف الفعالية التشاركية' : 'Coordinating Category'}
                    </label>
                    <select
                      value={newEventCategory}
                      onChange={(e) => setNewEventCategory(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                    >
                      <option value="FIELD_VISIT">{lang === 'ar' ? 'زيارة ميدانية وتدقيق جودة' : 'Field Visit & Survey'}</option>
                      <option value="PROJECT_DEADLINE">{lang === 'ar' ? 'الموعد النهائي لتسليم المرحلة' : 'Project Deadline'}</option>
                      <option value="SPONSORSHIP_PAYMENT">{lang === 'ar' ? 'صرف وتسليم كفالة الأيتام' : 'Sponsorship Cash Payout'}</option>
                    </select>
                  </div>

                  {/* Date and Priority row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'التاريخ المجدول' : 'Target Date'}
                      </label>
                      <input
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'مستوى الأولوية' : 'Priority'}
                      </label>
                      <select
                        value={newEventPriority}
                        onChange={(e) => setNewEventPriority(e.target.value as any)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      >
                        <option value="HIGH">{lang === 'ar' ? 'مرتفعة (خط حرج)' : 'High (Critical)'}</option>
                        <option value="MEDIUM">{lang === 'ar' ? 'متوسطة' : 'Medium'}</option>
                        <option value="LOW">{lang === 'ar' ? 'منخفضة' : 'Low'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Title Fields (Arabic / English) */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'عنوان الفعالية (العربية)' : 'Event Title (Arabic)'}
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: التدقيق الفني الميداني لبئر الروضة..."
                      value={newEventTitleAr}
                      onChange={(e) => setNewEventTitleAr(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                      {lang === 'ar' ? 'عنوان الفعالية (الإنجليزية)' : 'Event Title (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Field Technical Audit for Al-Rawdah..."
                      value={newEventTitleEn}
                      onChange={(e) => setNewEventTitleEn(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      required
                    />
                  </div>

                  {/* Location Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'الموقع الجغرافي (عربي)' : 'Location (Arabic)'}
                      </label>
                      <input
                        type="text"
                        placeholder="مارب، الروضة"
                        value={newEventLocationAr}
                        onChange={(e) => setNewEventLocationAr(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'الموقع الجغرافي (إنجليزي)' : 'Location (English)'}
                      </label>
                      <input
                        type="text"
                        placeholder="Marib, Rawdah"
                        value={newEventLocationEn}
                        onChange={(e) => setNewEventLocationEn(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      />
                    </div>
                  </div>

                  {/* Responsible Officer row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'المشرف المسؤول (عربي)' : 'Lead Officer (Arabic)'}
                      </label>
                      <input
                        type="text"
                        placeholder="م. طارق الوصابي"
                        value={newEventRespAr}
                        onChange={(e) => setNewEventRespAr(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                        {lang === 'ar' ? 'المشرف المسؤول (إنجليزي)' : 'Lead Officer (English)'}
                      </label>
                      <input
                        type="text"
                        placeholder="Eng. Tareq Al-Wasabi"
                        value={newEventRespEn}
                        onChange={(e) => setNewEventRespEn(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-slate-800 dark:text-zinc-300"
                      />
                    </div>
                  </div>

                  {/* Form Submission buttons */}
                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800 pt-3.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEventModal(false)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-lg cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                    >
                      {lang === 'ar' ? 'تأكيد وحفظ الموعد' : 'Schedule Event'}
                    </button>
                  </div>

                </form>

              </div>
            </div>
          )}

        </div>
      )}
    </WidgetFrame>
  );
}

export default React.memo(CollaborativeCalendarWidgetInner);
export { CollaborativeCalendarWidgetInner as CollaborativeCalendarWidget };
