#!/bin/bash
# Backup App.tsx
cp src/App.tsx src/App.tsx.bak

# Create a temporary file with the replacement
cat << 'REPLACEMENT' > temp_replacement.tsx
        {/* C. LEFT UTILITY RAIL (Helper Tools) */}
        <LeftUtilityRail
          lang={lang}
          setShowCopilotDrawer={setShowCopilotDrawer}
          setShowDocsModal={setShowDocsModal}
          setShowScenariosModal={setShowScenariosModal}
          setShowHelpersModal={setShowHelpersModal}
        />
      </div>

      {/* LAYER 5: GLOBAL OPERATIONAL FOOTER */}
      <GlobalOperationalFooter
        lang={lang}
        dbConnected={dbConnected}
        totalRecordsCount={totalRecordsCount}
        orgName={orgName}
      />
REPLACEMENT

# Delete lines 543 to 625, insert replacement
head -n 542 src/App.tsx > new_App.tsx
cat temp_replacement.tsx >> new_App.tsx
tail -n +626 src/App.tsx >> new_App.tsx

mv new_App.tsx src/App.tsx
