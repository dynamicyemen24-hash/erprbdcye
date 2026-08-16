with open('index.html', 'r') as f:
    content = f.read()

if '<link rel="manifest" href="/manifest.json" />' not in content:
    content = content.replace(
        '</title>',
        '</title>\n    <link rel="manifest" href="/manifest.json" />\n    <meta name="theme-color" content="#059669" />'
    )

with open('index.html', 'w') as f:
    f.write(content)
