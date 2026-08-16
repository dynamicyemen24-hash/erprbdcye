const fs = require('fs');
let code = fs.readFileSync('src/components/UnifiedContextRibbon.tsx', 'utf8');

const target = `          </button>
      </div>
      )}
    </div>
  );
};

export default UnifiedContextRibbon;`;

const replacement = `          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default UnifiedContextRibbon;`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/UnifiedContextRibbon.tsx', code);
