import urllib.request
import re

query = "Na+Honjaman+Level-Up"
url = f"https://mangapill.com/search?q={query}"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')
    
    # MangaPill search results are usually in a div with grid classes
    # I'll look for "Search Manga" and then the first grid container after it
    search_pos = html.find('Search Manga')
    if search_pos != -1:
        snippet = html[search_pos:search_pos+5000]
        # Look for the first <div class="my-3 grid ...
        grid_pos = snippet.find('grid')
        if grid_pos != -1:
            print("Found grid container near search results.")
            grid_snippet = snippet[grid_pos:grid_pos+2000]
            matches = list(re.finditer(r'href="(/manga/[^"]+)"[^>]*>([\s\S]*?)</a>', grid_snippet))
            for i, m in enumerate(matches):
                title = re.sub('<[^>]*>', '', m.group(2)).strip()
                if title:
                    print(f"Result {i}: {title} -> {m.group(1)}")
        else:
            print("No grid container found in snippet.")
    else:
        print("'Search Manga' not found in HTML.")
