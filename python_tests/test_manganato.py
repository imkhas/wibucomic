import urllib.request
import re

# Try MangaKakalot as it's often more stable for scraping
query = "solo"
url = f"https://mangakakalot.com/search/story/{query}"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

print(f"Testing URL: {url}")
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        
        # Search for story links
        # URL pattern: https://mangakakalot.com/manga/slug or https://mangakakalot.com/read-slug
        matches = list(re.finditer(r'href="([^"]+/(?:manga|read)-[^"]+)"[^>]*>([\s\S]*?)</a>', html))
        print(f"Found {len(matches)} potential story links")
        for i, m in enumerate(matches[:15]):
            title = re.sub('<[^>]*>', '', m.group(2)).strip()
            if title and "solo" in title.lower():
                print(f"Result {i}: {title} -> {m.group(1)}")
                
        # Look for container
        if "panel-search-story" in html:
            print("Found panel-search-story container.")
        elif "daily-update" in html:
            print("Found daily-update (might be homepage).")
except Exception as e:
    print(f"Error: {e}")
