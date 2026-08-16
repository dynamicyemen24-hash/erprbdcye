const fs = require('fs');
let content = fs.readFileSync('src/features/sync/OfflineSyncView.tsx', 'utf8');

content = content.replace('syncData.localCount', 'syncData.pendingTasksCount');
content = content.replace('syncData.remoteCount', '0');

fs.writeFileSync('src/features/sync/OfflineSyncView.tsx', content);
