with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("\\n\\nasync function seedExchangeRatesIfEmpty", "\n\nasync function seedExchangeRatesIfEmpty")

with open('server.ts', 'w') as f:
    f.write(content)
