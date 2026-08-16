#!/bin/bash
# Backup App.tsx
cp src/App.tsx src/App.tsx.bak

# Create a temporary file with the replacement
cat << 'REPLACEMENT' > temp_replacement.tsx
      {/* LAYER 1: GLOBAL ENTERPRISE HEADER */}
      <GlobalEnterpriseHeader
        lang={lang}
        setLang={setLang}
        orgName={orgName}
        licenseText={licenseText}
        isOnline={isOnline}
        loading={loading}
        fetchAllData={fetchAllData}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        setShowAppLauncherModal={setShowAppLauncherModal}
        setShowAboutSystemModal={setShowAboutSystemModal}
        setIsCommandCenterOpen={setIsCommandCenterOpen}
        beneficiaries={beneficiaries}
        projects={projects}
        users={users}
        approvalRequests={approvalRequests}
        handleSelectTab={(tab) => handleSelectTab(tab as ActiveTab)}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        layoutDensity={layoutDensity}
        setLayoutDensity={setLayoutDensity}
        setIsShortcutsModalOpen={setIsShortcutsModalOpen}
        setShowExportModal={setShowExportModal}
        setShowScenariosModal={setShowScenariosModal}
        setShowHelpersModal={setShowHelpersModal}
        setShowDocsModal={setShowDocsModal}
        isSystemsDockPinned={isSystemsDockPinned}
        setIsSystemsDockPinned={setIsSystemsDockPinned}
        setPendingSecureTab={setPendingSecureTab}
      />
REPLACEMENT

# Delete lines 415 to 614, insert replacement at 415
head -n 414 src/App.tsx > new_App.tsx
cat temp_replacement.tsx >> new_App.tsx
tail -n +614 src/App.tsx >> new_App.tsx

mv new_App.tsx src/App.tsx
