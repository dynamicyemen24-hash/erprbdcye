with open('src/components/UnifiedContextRibbon.tsx', 'r') as f:
    content = f.read()
content = content.replace('          </button>\n      </div>\n      )}\n    </div>\n  );\n};\n\nexport default UnifiedContextRibbon;', '          </button>\n        </div>\n      </div>\n      )}\n    </div>\n  );\n};\n\nexport default UnifiedContextRibbon;')
with open('src/components/UnifiedContextRibbon.tsx', 'w') as f:
    f.write(content)
