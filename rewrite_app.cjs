const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

// Find the index of the main return
const returnIndex = content.indexOf('return (', content.indexOf('const renderTabContent'));
if (returnIndex === -1) {
    console.error("Could not find main return");
    process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);

const newJSX = `return (
    <div className="h-screen max-h-screen bg-slate-50 dark:bg-zinc-950 font-sans flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900 text-slate-800 dark:text-zinc-100 transition-colors duration-200 overflow-hidden">
      
      {/* 1. TOP HEADER */}
      <header className="h-14 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 shadow-sm z-40">
        
        {/* System Identity (Fixed) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAppLauncherModal(true)}
            className="p-1.5 bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg border border-slate-200 dark:border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
            title={lang === 'ar' ? 'مصفوفة التطبيقات (التطبيقات المؤسسية)' : 'Enterprise App Matrix'}
          >
            <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-sm font-black text-slate-800 dark:text-zinc-100 tracking-wider flex items-center gap-1.5">
              <span className="text-emerald-600 dark:text-emerald-500 font-extrabold">NexoraOS™</span>
              <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">Enterprise OS</span>
            </h1>
          </div>
        </div>

        {/* Central Search */}
        <div className="flex-1 max-w-xl mx-4">
          <ERPSearchBar 
            lang={lang}
            beneficiaries={beneficiaries}
            projects={projects}
            users={users}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        </div>

        {/* Subscriber Identity (Organization) */}
        <div className="flex items-center gap-4 shrink-0">
          
          {/* Quick Tools */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-900 p-1 rounded-lg border border-slate-200 dark:border-zinc-800">
            <button 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
              className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-md text-slate-500 hover:text-amber-500 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
              className="px-2 py-1 hover:bg-white rounded-md text-xs font-black text-slate-600 font-mono transition-colors"
            >
              {lang === 'ar' ? 'EN' : 'AR'}
            </button>
            <button 
              onClick={fetchAllData}
              disabled={loading}
              className="p-1.5 hover:bg-white rounded-md text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <RefreshCw className={\`w-3.5 h-3.5 \${loading ? 'animate-spin text-amber-500' : ''}\`} />
            </button>
          </div>

          <div className="hidden sm:flex flex-col items-end rtl:items-start text-right rtl:text-left">
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">{lang === 'ar' ? 'المشترك المعتمد' : 'Licensed To'}</span>
            <span className="text-xs font-black text-amber-600 dark:text-amber-500">
              {lang === 'ar' ? 'جمعية رُحماء بينهم' : 'Rohamā\\'a Baynahum'}
            </span>
          </div>
          
          <div className="h-9 px-2 bg-white rounded-lg flex items-center justify-center border border-slate-200 dark:border-zinc-800 shadow-sm shrink-0">
            <img 
              src="/LogoRohamaab.png" 
              alt="شعار المؤسسة" 
              className="h-7 w-auto object-contain"
            />
          </div>
          
          {/* User Profile Avatar Pill */}
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
             {currentUser?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT (Columns) */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* A. RIGHT SIDEBAR (Systems & Operations) */}
        {/* Rendered visually on the right in RTL */}
        <aside className={\`flex flex-col bg-white dark:bg-zinc-950 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-zinc-800 transition-all duration-300 z-10 shadow-sm \${isSystemsDockPinned ? 'w-64' : 'w-16'}\`}>
          {/* Dock Pinned toggle inside header of sidebar */}
          <div className="h-12 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-3 shrink-0">
            {isSystemsDockPinned && (
              <span className="text-xs font-black text-slate-700 dark:text-zinc-300 truncate">
                {lang === 'ar' ? 'الأنظمة والعمليات' : 'Systems & Ops'}
              </span>
            )}
            <button
              onClick={() => setIsSystemsDockPinned(!isSystemsDockPinned)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 transition-colors mx-auto"
              title={lang === 'ar' ? 'توسيع/طي الأنظمة' : 'Toggle Systems Panel'}
            >
              {isSystemsDockPinned ? <ChevronRight className="w-4 h-4 rtl:rotate-180" /> : <Layers className="w-4 h-4" />}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <SystemsDockPanel
              lang={lang}
              activeTab={activeTab}
              onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
              isDockPinned={isSystemsDockPinned}
              onToggleDockPin={() => setIsSystemsDockPinned(!isSystemsDockPinned)}
            />
          </div>
        </aside>

        {/* B. CENTER WORKSPACE */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-zinc-900/30 overflow-hidden relative">
          
          {/* Tabs Bar */}
          <div className="h-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-2 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
            {openTabs.map((tabKey) => {
              const config = TAB_CONFIG[tabKey] || TAB_CONFIG['dashboard'];
              const IconComponent = config.icon;
              const isActive = activeTab === tabKey;
              return (
                <div
                  key={tabKey}
                  onClick={() => handleSelectTab(tabKey)}
                  className={\`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-t-2 border-x border-b-0 text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap shrink-0 group \${
                    isActive
                      ? 'bg-slate-50 dark:bg-zinc-900 border-t-emerald-500 border-x-slate-200 dark:border-x-zinc-800 text-emerald-700 dark:text-emerald-400 font-extrabold translate-y-[1px] relative z-10'
                      : 'bg-slate-100 dark:bg-zinc-800/80 border-t-transparent border-x-transparent text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }\`}
                >
                  <IconComponent className={\`w-3.5 h-3.5 \${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'}\`} />
                  <span>{lang === 'ar' ? config.title_ar : config.title_en}</span>
                  
                  <span className={\`px-1.5 py-0.5 rounded text-[9px] font-mono font-black \${
                    isActive 
                       ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
                       : 'bg-slate-200 dark:bg-zinc-700/80 text-slate-500 dark:text-zinc-400'
                  }\`}>
                    {config.code}
                  </span>
                  
                  {openTabs.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCloseTab(tabKey, e); }}
                      className={\`p-0.5 rounded-md transition-colors opacity-70 group-hover:opacity-100 \${
                        isActive ? 'hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'hover:bg-slate-300 dark:hover:bg-zinc-600 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200'
                      }\`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar p-3 md:p-6 w-full">
            {loading ? (
              <SkeletonLoader lang={lang} />
            ) : (
              renderTabContent()
            )}
          </div>
        </main>

        {/* C. LEFT SIDEBAR (Helper Tools) */}
        {/* Rendered visually on the left in RTL */}
        {/* We will make this collapsible as well, let's use a local state but since it's not present, we will just hardcode it to a small width or add a basic toggle if needed. For now, a fixed collapsible pane. */}
        <aside className="w-16 hover:w-56 flex flex-col bg-white dark:bg-zinc-950 border-r rtl:border-r-0 rtl:border-l border-slate-200 dark:border-zinc-800 transition-all duration-300 z-10 shadow-sm group shrink-0 overflow-hidden">
           
           <div className="h-12 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-center group-hover:justify-start group-hover:px-4 shrink-0">
             <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
             <span className="text-xs font-black text-slate-700 dark:text-zinc-300 ml-2 rtl:mr-2 rtl:ml-0 opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                {lang === 'ar' ? 'الأدوات المساعدة' : 'Helper Tools'}
             </span>
           </div>

           <div className="flex-1 flex flex-col gap-2 p-2">
              <button
                onClick={() => setShowCopilotDrawer(true)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-full group/btn"
                title={lang === 'ar' ? 'مساعد الذكاء الاصطناعي Nexora AI Copilot' : 'Nexora AI Copilot'}
              >
                <Brain className="w-5 h-5 shrink-0 text-emerald-600 group-hover/btn:animate-pulse" />
                <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
                   Copilot AI
                </span>
              </button>

              <button
                onClick={() => setShowDocsModal(true)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors w-full"
                title={lang === 'ar' ? 'الوثائق التشغيلية' : 'System Docs'}
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
                   {lang === 'ar' ? 'دليل الاستخدام' : 'User Manual'}
                </span>
              </button>

              <button
                onClick={() => setShowScenariosModal(true)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition-colors w-full"
                title={lang === 'ar' ? 'السيناريوهات التشغيلية (SOP)' : 'Playbooks'}
              >
                <PlayCircle className="w-5 h-5 shrink-0 text-amber-500" />
                <span className="text-xs font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap">
                   {lang === 'ar' ? 'السيناريوهات (SOP)' : 'SOP Playbooks'}
                </span>
              </button>
           </div>
        </aside>

      </div>

      {/* 3. BOTTOM BAR */}
      <footer className="h-8 bg-zinc-900 text-zinc-400 flex items-center justify-between px-4 shrink-0 text-[10px] font-bold z-40 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className={\`w-2 h-2 rounded-full \${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}\`}></div>
            <span className={dbConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {dbConnected 
                ? (lang === 'ar' ? 'متصل بقاعدة البيانات الآمنة (Neon Postgres)' : 'Connected to Secure Neon DB') 
                : (lang === 'ar' ? 'خطأ في الاتصال' : 'Connection Error')}
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-2 border-l rtl:border-l-0 rtl:border-r border-zinc-800 px-3 py-0.5 font-mono">
            <span>{lang === 'ar' ? 'إجمالي السجلات:' : 'Total Records:'}</span>
            <span className="text-amber-400">{totalRecordsCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span>v2.4.0-Enterprise</span>
          <span className="text-zinc-700">|</span>
          <span className="font-mono">
            © 2026 {lang === 'ar' ? 'جمعية رُحماء بينهم' : 'Rohamā\\'a Foundation'}
          </span>
        </div>
      </footer>

      {/* MODALS */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="h-14 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'دليل المستخدم الشامل' : 'Comprehensive User Manual'}</span>
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900">
              <DocumentationView lang={lang} onNavigate={(tab) => { setShowDocsModal(false); handleSelectTab(tab as ActiveTab); }} />
            </div>
          </div>
        </div>
      )}

      {showScenariosModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="h-14 px-6 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>{lang === 'ar' ? 'دليل السيناريوهات التشغيلية مع أدوار المستخدمين' : 'Operational Playbooks & Role Scenarios'}</span>
                  </h3>
                </div>
              </div>
              <button onClick={() => setShowScenariosModal(false)} className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-zinc-900">
              <OperationalScenariosView lang={lang} onNavigate={(tab) => { setShowScenariosModal(false); handleSelectTab(tab as ActiveTab); }} />
            </div>
          </div>
        </div>
      )}

      <NexoraAICopilotDrawer
        isOpen={showCopilotDrawer}
        onClose={() => setShowCopilotDrawer(false)}
        lang={lang}
        contextData={{
          programsCount: programs.length,
          projectsCount: projects.length,
          beneficiariesCount: beneficiaries.length,
          sponsorshipsCount: sponsorships.length,
          totalBudget: totalProgramBudget,
          pendingApprovals: pendingApprovalsCount,
          activeRole: activeRolePerspective,
          organization: organizationId,
          fiscalYear
        }}
      />

      <AppMatrixLauncherModal
        isOpen={showAppLauncherModal}
        onClose={() => setShowAppLauncherModal(false)}
        onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
        lang={lang}
        onOpenCopilot={() => { setShowAppLauncherModal(false); setShowCopilotDrawer(true); }}
        onOpenDocs={() => { setShowAppLauncherModal(false); setShowDocsModal(true); }}
        onOpenScenarios={() => { setShowAppLauncherModal(false); setShowScenariosModal(true); }}
        counts={{
          programs: programs.length,
          projects: projects.length,
          beneficiaries: beneficiaries.length,
          sponsorships: sponsorships.length,
          users: users.length,
          currencies: currencies.length,
          pendingApprovals: pendingApprovalsCount
        }}
      />
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', beforeReturn + newJSX);
