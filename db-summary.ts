import fs from 'fs';

interface TableReport {
  name: string;
  type: string;
  rowCount: number;
  columns: any[];
  sampleData: any[];
  error: string | null;
}

interface Report {
  tables: TableReport[];
  errors: string[];
}

function summarize() {
  if (!fs.existsSync('./db_schema_output.json')) {
    console.error("db_schema_output.json does not exist.");
    return;
  }

  const raw = fs.readFileSync('./db_schema_output.json', 'utf8');
  const data: Report = JSON.parse(raw);

  let out = "";
  const log = (...args: any[]) => {
    out += args.join(" ") + "\n";
  };

  log(`Total Tables and Views processed: ${data.tables.length}`);

  const baseTables = data.tables.filter(t => t.type === 'BASE TABLE');
  const views = data.tables.filter(t => t.type === 'VIEW');

  log(`Base Tables: ${baseTables.length}`);
  log(`Views: ${views.length}`);

  log("\n--- BASE TABLES WITH ROWS ---");
  const withRows = baseTables.filter(t => t.rowCount > 0);
  withRows.forEach(t => {
    log(`- ${t.name}: ${t.rowCount} rows`);
  });

  log("\n--- EMPTY BASE TABLES ---");
  const emptyTables = baseTables.filter(t => t.rowCount === 0);
  log(`There are ${emptyTables.length} empty base tables.`);

  log("\n--- KEY SETTINGS & BASIC TABLES SCHEMAS ---");
  const keyTableNames = [
    'organizations',
    'organization_settings',
    'system_settings',
    'currencies',
    'branches',
    'users',
    'roles',
    'programs'
  ];

  for (const tName of keyTableNames) {
    const table = data.tables.find(t => t.name === tName);
    if (table) {
      log(`\n=========================================`);
      log(`Table: ${table.name} (${table.rowCount} rows)`);
      log(`=========================================`);
      log("Columns:");
      table.columns.forEach(c => {
        log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      if (table.rowCount > 0) {
        log("Sample Rows (Up to 2):");
        log(JSON.stringify(table.sampleData.slice(0, 2), null, 2));
      }
    } else {
      log(`Key table '${tName}' not found in public schema.`);
    }
  }

  fs.writeFileSync('./db_summary.txt', out);
  console.log("Summary saved to ./db_summary.txt");
}

summarize();

