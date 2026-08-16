const fs = require('fs');
let content = fs.readFileSync('src/components/ERPSearchBar.tsx', 'utf8');

// 1. Add SearchCategory
content = content.replace(
  "type SearchCategory = 'ALL' | 'BENEFICIARIES' | 'PROJECTS' | 'STAFF' | 'DOMAINS';",
  `type SearchCategory = 'ALL' | 'BENEFICIARIES' | 'PROJECTS' | 'STAFF' | 'DOMAINS' | 'DOCUMENTS';

const MOCK_DOCUMENTS = [
  { id: 'doc-1', title_ar: 'الخطة الاستراتيجية 2026', title_en: 'Strategic Plan 2026', type: 'PDF', size: '2.4 MB', date: '2026-01-15', domain: 'NEB-01', author: 'أحمد علي' },
  { id: 'doc-2', title_ar: 'تقرير الأداء المالي للربع الثاني', title_en: 'Q2 Financial Performance Report', type: 'XLSX', size: '1.1 MB', date: '2026-04-10', domain: 'NEB-10', author: 'سارة محمد' },
  { id: 'doc-3', title_ar: 'سياسة المشتريات المحدثة', title_en: 'Updated Procurement Policy', type: 'DOCX', size: '850 KB', date: '2025-11-20', domain: 'NEB-14', author: 'إبراهيم حسن' },
  { id: 'doc-4', title_ar: 'عقد الشراكة مع منظمة الصحة العالمية', title_en: 'WHO Partnership Agreement', type: 'PDF', size: '4.2 MB', date: '2026-03-05', domain: 'NEB-08', author: 'فاطمة عبدالله' },
  { id: 'doc-5', title_ar: 'مخطط سير العمل الميداني', title_en: 'Field Operations Workflow', type: 'PNG', size: '1.5 MB', date: '2026-05-12', domain: 'NEB-05', author: 'عمر زيد' },
];`
);

// 2. Add document to selectedType state
content = content.replace(
  "const [selectedType, setSelectedType] = useState<'beneficiary' | 'project' | 'user' | 'domain' | null>(null);",
  "const [selectedType, setSelectedType] = useState<'beneficiary' | 'project' | 'user' | 'domain' | 'document' | null>(null);"
);

// 3. Add searchDocuments array and update allResults
content = content.replace(
  `  // Combine results according to category filter
  const allResults = [
    ...(category === 'ALL' || category === 'DOMAINS' ? searchDomains : []),
    ...(category === 'ALL' || category === 'BENEFICIARIES' ? searchBeneficiaries : []),
    ...(category === 'ALL' || category === 'PROJECTS' ? searchProjects : []),
    ...(category === 'ALL' || category === 'STAFF' ? searchUsers : []),
  ];`,
  `  // Search Documents (Smart Indexing Mock)
  const searchDocuments = MOCK_DOCUMENTS.filter(d => {
    if (activeDomainCode !== 'ALL' && activeDomainCode !== d.domain) return false;
    if (!cleanQuery) return true;
    return (
      (d.title_ar || '').toLowerCase().includes(cleanQuery) ||
      (d.title_en || '').toLowerCase().includes(cleanQuery) ||
      (d.type || '').toLowerCase().includes(cleanQuery) ||
      (d.author || '').toLowerCase().includes(cleanQuery)
    );
  }).map(d => ({ ...d, searchType: 'document' as const }));

  // Combine results according to category filter
  const allResults = [
    ...(category === 'ALL' || category === 'DOMAINS' ? searchDomains : []),
    ...(category === 'ALL' || category === 'BENEFICIARIES' ? searchBeneficiaries : []),
    ...(category === 'ALL' || category === 'PROJECTS' ? searchProjects : []),
    ...(category === 'ALL' || category === 'STAFF' ? searchUsers : []),
    ...(category === 'ALL' || category === 'DOCUMENTS' ? searchDocuments : []),
  ];`
);

// 4. Update Icons
content = content.replace(
  `                        <div className={\`p-2.5 rounded-xl border shrink-0 \${
                          bType === 'domain' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                          bType === 'beneficiary' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900 text-rose-600' :
                          bType === 'project' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-blue-600' :
                          'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900 text-sky-600'
                        }\`}>
                          {bType === 'domain' && React.createElement(item.icon || Grid, { className: 'w-5 h-5 text-amber-500' })}
                          {bType === 'beneficiary' && <Users className="w-5 h-5" />}
                          {bType === 'project' && <Briefcase className="w-5 h-5" />}
                          {bType === 'user' && <UserCheck className="w-5 h-5" />}
                        </div>`,
  `                        <div className={\`p-2.5 rounded-xl border shrink-0 \${
                          bType === 'domain' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                          bType === 'beneficiary' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900 text-rose-600' :
                          bType === 'project' ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-blue-600' :
                          bType === 'document' ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900 text-purple-600' :
                          'bg-sky-50 dark:bg-sky-950/30 border-sky-100 dark:border-sky-900 text-sky-600'
                        }\`}>
                          {bType === 'domain' && React.createElement(item.icon || Grid, { className: 'w-5 h-5 text-amber-500' })}
                          {bType === 'beneficiary' && <Users className="w-5 h-5" />}
                          {bType === 'project' && <Briefcase className="w-5 h-5" />}
                          {bType === 'user' && <UserCheck className="w-5 h-5" />}
                          {bType === 'document' && <FileText className="w-5 h-5" />}
                        </div>`
);

// 5. Update text blocks
content = content.replace(
  `                              {bType === 'domain' ? \`⚡ Nexora Domain \${item.code}\` :
                               bType === 'beneficiary' ? (lang === 'ar' ? 'مستفيد' : 'Beneficiary') :
                               bType === 'project' ? (lang === 'ar' ? 'مشروع ميداني' : 'Project') :
                               (lang === 'ar' ? 'موظف' : 'Staff')}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 font-bold">
                              {bType === 'domain' && item.code}
                              {bType === 'beneficiary' && item.beneficiary_code}
                              {bType === 'project' && item.code}
                              {bType === 'user' && (item.position_code || 'STAFF')}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate leading-snug">
                            {bType === 'domain' && (lang === 'ar' ? item.titleAr : item.titleEn)}
                            {bType === 'beneficiary' && highlightMatch(item.full_name_ar, cleanQuery)}
                            {bType === 'project' && highlightMatch(lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar), cleanQuery)}
                            {bType === 'user' && highlightMatch(lang === 'ar' ? (item.name_ar || item.name) : item.name, cleanQuery)}
                          </h4>`,
  `                              {bType === 'domain' ? \`⚡ Nexora Domain \${item.code}\` :
                               bType === 'beneficiary' ? (lang === 'ar' ? 'مستفيد' : 'Beneficiary') :
                               bType === 'project' ? (lang === 'ar' ? 'مشروع ميداني' : 'Project') :
                               bType === 'document' ? (lang === 'ar' ? 'مستند/مرفق' : 'Document') :
                               (lang === 'ar' ? 'موظف' : 'Staff')}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-400 font-bold">
                              {bType === 'domain' && item.code}
                              {bType === 'beneficiary' && item.beneficiary_code}
                              {bType === 'project' && item.code}
                              {bType === 'user' && (item.position_code || 'STAFF')}
                              {bType === 'document' && item.type}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-900 dark:text-zinc-100 truncate leading-snug">
                            {bType === 'domain' && (lang === 'ar' ? item.titleAr : item.titleEn)}
                            {bType === 'beneficiary' && highlightMatch(item.full_name_ar, cleanQuery)}
                            {bType === 'project' && highlightMatch(lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar), cleanQuery)}
                            {bType === 'user' && highlightMatch(lang === 'ar' ? (item.name_ar || item.name) : item.name, cleanQuery)}
                            {bType === 'document' && highlightMatch(lang === 'ar' ? item.title_ar : (item.title_en || item.title_ar), cleanQuery)}
                          </h4>`
);

// 6. Update Subtext
content = content.replace(
  `                            {bType === 'user' && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {item.email} | {item.phone}
                              </span>
                            )}
                          </p>`,
  `                            {bType === 'user' && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-zinc-400" />
                                {item.email} | {item.phone}
                              </span>
                            )}
                            {bType === 'document' && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3 text-zinc-400" />
                                {item.size} | {item.author} | {item.date}
                              </span>
                            )}
                          </p>`
);

// 7. Update layout badge
content = content.replace(
  `                      {selectedType === 'domain' && (lang === 'ar' ? 'مجال مؤسسي' : 'Enterprise Domain')}
                      {selectedType === 'beneficiary' && (lang === 'ar' ? 'سجل مستفيد' : 'Beneficiary Record')}
                      {selectedType === 'project' && (lang === 'ar' ? 'بطاقة مشروع' : 'Project Card')}
                      {selectedType === 'user' && (lang === 'ar' ? 'ملف موظف' : 'Staff Profile')}
                    </span>`,
  `                      {selectedType === 'domain' && (lang === 'ar' ? 'مجال مؤسسي' : 'Enterprise Domain')}
                      {selectedType === 'beneficiary' && (lang === 'ar' ? 'سجل مستفيد' : 'Beneficiary Record')}
                      {selectedType === 'project' && (lang === 'ar' ? 'بطاقة مشروع' : 'Project Card')}
                      {selectedType === 'user' && (lang === 'ar' ? 'ملف موظف' : 'Staff Profile')}
                      {selectedType === 'document' && (lang === 'ar' ? 'مستند/مرفق' : 'Document')}
                    </span>`
);

// 8. Add document layout
const layoutStr = `                  {/* PREVIEW LAYOUT 3: USER STAFF */}
                  {selectedType === 'user' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1 text-center">
                        <div className="w-12 h-12 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-2">
                          {selectedItem.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">{lang === 'ar' ? (selectedItem.name_ar || selectedItem.name) : selectedItem.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500">
                          {selectedItem.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'user')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'الذهاب إلى سجل الموظفين' : 'Navigate to Users'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {/* PREVIEW LAYOUT 4: DOCUMENT */}
                  {selectedType === 'document' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1">
                        <p className="text-[10px] text-zinc-400 font-extrabold">{lang === 'ar' ? 'اسم المستند / المرفق' : 'Document Name'}</p>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">
                          {lang === 'ar' ? selectedItem.title_ar : (selectedItem.title_en || selectedItem.title_ar)}
                        </h4>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                            {selectedItem.type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {selectedItem.size}
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'المؤلف / المالك' : 'Author'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-bold">{selectedItem.author}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'المجال المرتبط' : 'Domain'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{selectedItem.domain}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-1.5">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {lang === 'ar' ? 'تاريخ الفهرسة' : 'Index Date'}
                          </span>
                          <span className="text-slate-800 dark:text-zinc-200 font-mono font-bold">{selectedItem.date}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'document')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'فتح المستند لمعاينته' : 'Open Document'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}`;

content = content.replace(
  `                  {/* PREVIEW LAYOUT 3: USER STAFF */}
                  {selectedType === 'user' && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-3.5 rounded-xl space-y-1 text-center">
                        <div className="w-12 h-12 bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-full flex items-center justify-center font-black text-lg mx-auto mb-2">
                          {selectedItem.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100">{lang === 'ar' ? (selectedItem.name_ar || selectedItem.name) : selectedItem.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500">
                          {selectedItem.email}
                        </p>
                      </div>

                      <button
                        onClick={() => handleItemClick(selectedItem, 'user')}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer mt-4"
                      >
                        <span>{lang === 'ar' ? 'الذهاب إلى سجل الموظفين' : 'Navigate to Users'}</span>
                        {lang === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  )}`,
  layoutStr
);

fs.writeFileSync('src/components/ERPSearchBar.tsx', content);
console.log('Patched successfully');
