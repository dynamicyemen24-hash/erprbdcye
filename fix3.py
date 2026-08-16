with open('src/components/UnifiedContextRibbon.tsx', 'r') as f:
    content = f.read()

import re
pattern = r'</button>\n      </div>\n      \)}\n    </div>\n  );\n};\n\nexport default UnifiedContextRibbon;'
replacement = '''</button>\n        </div>\n      </div>\n      )}\n    </div>\n  );\n};\n\nexport default UnifiedContextRibbon;'''

new_content = re.sub(pattern, replacement, content)
with open('src/components/UnifiedContextRibbon.tsx', 'w') as f:
    f.write(new_content)
