import urllib.request
import re

query = "solo"
url = f"https://bato.to/search?word={query}"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

print(f"Testing Bato.to URL: {url}")
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        
        # Look for search results
        # Pattern: <a class="item-title" href="/series/104434/solo-leveling">Solo Leveling</a>
        matches = list(re.finditer(r'<a[^>]+class="item-title"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>', html))
        print(f"Found {len(matches)} potential series links")
        for i, m in enumerate(matches[:10]):
            title = re.sub('<[^>]*>', '', m.group(2)).strip()
            print(f"Result {i}: {title} -> {m.group(1)}")
            
        # Look for a container if no results found generic
        if len(matches) == 0:
            if "series-list" in html:
                print("Found series-list container.")
            else:
                print("series-list not found.")
except Exception as e:
    print(f"Error: {e}")
