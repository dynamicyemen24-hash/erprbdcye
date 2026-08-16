const fs = require('fs');
const content = fs.readFileSync('src/App.tsx', 'utf8');

const renderTabStart = content.indexOf('const renderTabContent = () => {');
const beforeRenderTab = content.substring(0, renderTabStart);

const renderTabJSX = `const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            stats={dashboardStats}
            loading={loading}
            onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
            lang={lang}
            onRefresh={fetchAllData}
            programs={programs}
            projects={projects}
            beneficiaries={beneficiaries}
            sponsorships={sponsorships}
            approvalRequests={approvalRequests}
            users={users}
            currencies={currencies}
            systemAlerts={systemAlerts}
            currentUser={currentUser}
          />
        );
      case 'programs':
        return <ProgramsView lang={lang} programs={programs} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'projects':
        return <ProjectsView lang={lang} projects={projects} programs={programs} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'activities':
        return <ActivitiesView lang={lang} programs={programs} projects={projects} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'beneficiaries':
        return <BeneficiariesView lang={lang} beneficiaries={beneficiaries} projects={projects} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'sponsorships':
        return <SponsorshipsView lang={lang} sponsorships={sponsorships} beneficiaries={beneficiaries} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'finance':
        return <FinanceView lang={lang} loading={loading} onRefresh={fetchAllData} />;
      case 'approvals':
        return <ApprovalWorkflowView lang={lang} requests={approvalRequests} users={users} loading={loading} onRefresh={fetchAllData} />;
      case 'reports':
        return <ReportsView lang={lang} stats={dashboardStats} loading={loading} />;
      case 'users':
        return <UsersView lang={lang} users={users} loading={loading} onRefresh={fetchAllData} currentUser={currentUser} />;
      case 'currencies':
        return <CurrenciesView lang={lang} currencies={currencies} loading={loading} onRefresh={fetchAllData} />;
      case 'settings':
        return <SettingsView lang={lang} organizations={organizations} settings={settings} loading={loading} onRefresh={fetchAllData} />;
      case 'audit':
        return <AuditLogsView lang={lang} users={users} loading={loading} />;
      case 'backup':
        return <BackupView lang={lang} />;
      case 'domains':
        return (
          <DomainCenterView 
            lang={lang}
            onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          />
        );
      case 'docs':
        return (
          <DocumentationView 
            lang={lang}
            onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          />
        );
      case 'scenarios':
        return (
          <OperationalScenariosView 
            lang={lang}
            onNavigate={(tab) => handleSelectTab(tab as ActiveTab)}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-bold p-8">
            {lang === 'ar' ? 'جاري تطوير هذه الوحدة...' : 'Module under development...'}
          </div>
        );
    }
  };
`;

const afterMainReturnStr = 'return (\n    <div className="h-screen max-h-screen bg-slate-50 dark:bg-zinc-950 font-sans flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900 text-slate-800 dark:text-zinc-100 transition-colors duration-200 overflow-hidden">';
const mainReturnStart = content.indexOf(afterMainReturnStr);
if (mainReturnStart === -1) {
  console.log("Could not find mainReturnStart", afterMainReturnStr.substring(0, 40));
}
const mainReturnJSX = content.substring(mainReturnStart);

fs.writeFileSync('src/App.tsx', beforeRenderTab + renderTabJSX + "\n  " + mainReturnJSX);
