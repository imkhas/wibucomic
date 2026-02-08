import urllib.request
import re

url = "https://mangareader.to/search?keyword=solo+leveling"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')
    
    # Look for the search results container
    # <div class="manga_list-sbs">
    pos = html.find('manga_list-sbs')
    if pos != -1:
        print("Found manga_list-sbs container.")
        snippet = html[pos:pos+5000]
        matches = list(re.finditer(r'<h3 class="manga-name">\s*<a href="([^"]+)" title="([^"]+)">', snippet))
        for i, m in enumerate(matches):
            print(f"Result {i}: {m.group(2)} -> {m.group(1)}")
    else:
        print("manga_list-sbs not found.")
