with open('src/components/UnifiedContextRibbon.tsx', 'r') as f:
    content = f.read()

target = '''</button>
      </div>
      )}
    </div>
  );
};

export default UnifiedContextRibbon;'''
replacement = '''</button>
        </div>
      </div>
      )}
    </div>
  );
};

export default UnifiedContextRibbon;'''

new_content = content.replace(target, replacement)
with open('src/components/UnifiedContextRibbon.tsx', 'w') as f:
    f.write(new_content)
