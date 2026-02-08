import urllib.request
import re

query = "solo"
url = f"https://mangapark.net/search?word={query}"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        
        # Look for search results
        # Pattern: <a class="group" ... href="/title/123-solo-leveling">
        # Or similar. Let's find any "/title/" links
        matches = list(re.finditer(r'href="(/title/[^"]+)"[^>]*>([\s\S]*?)</a>', html))
        print(f"Found {len(matches)} potential title links")
        for i, m in enumerate(matches[:15]):
            title = re.sub('<[^>]*>', '', m.group(2)).strip()
            if title and "solo" in title.lower():
                print(f"Result {i}: {title} -> {m.group(1)}")
            elif not title:
                # Sometimes title is in a child element
                print(f"Result {i}: (Empty title) -> {m.group(1)}")
except Exception as e:
    print(f"Error: {e}")
