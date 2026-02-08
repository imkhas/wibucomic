import urllib.request
import re

query = "solo"
url = f"https://mangafire.to/filter?keyword={query}"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

print(f"Testing MangaFire URL: {url}")
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        
        # Look for search results
        # Pattern: <a href="/manga/solo-leveling.jw9q" class="title">Solo Leveling</a>
        matches = list(re.finditer(r'<a[^>]+href="([^"]+/manga/[^"]+)"[^>]*class="title"[^>]*>([\s\S]*?)</a>', html))
        print(f"Found {len(matches)} potential series links")
        for i, m in enumerate(matches[:10]):
            title = re.sub('<[^>]*>', '', m.group(2)).strip()
            print(f"Result {i}: {title} -> {m.group(1)}")
            
        if len(matches) == 0:
            if "original-title" in html:
                print("Found original-title in HTML.")
            else:
                print("No obvious containers found.")
except Exception as e:
    print(f"Error: {e}")
