import urllib.request
import re

headers = {'User-Agent': 'Mozilla/5.0'}
url = "https://mangareader.to/read/solo-leveling-21/en/chapter-1"
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as response:
    html = response.read().decode('utf-8')
    # Look for pages: data-url="https://..."
    matches = list(re.finditer(r'data-url="([^"]+)"', html))
    if not matches:
        # Try background-image
        matches = list(re.finditer(r'url\((https://[^)]+)\)', html))
    if not matches:
        print("No pages found. HTML Snippet:")
        print(html[:5000])
    for match in matches:
        print(f"Page: {match.group(1)}")
