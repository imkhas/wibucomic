import urllib.request
import re

url = "https://chapmanganato.com/manga-of952256" # Solo Leveling
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)

print(f"Testing Manganato Chapters URL: {url}")
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        print(f"HTML Length: {len(html)}")
        
        # Manganato chapters are in a ul with class "row-content-chapter"
        # Each li has an a with class "chapter-name"
        matches = list(re.finditer(r'<a[^>]+class="chapter-name[^>]+href="([^"]+)"[^>]*>([\s\S]*?)</a>', html))
        print(f"Found {len(matches)} chapters")
        for i, m in enumerate(matches[:10]):
            title = re.sub('<[^>]*>', '', m.group(2)).strip()
            print(f"Chapter {i}: {title} -> {m.group(1)}")
            
        # Also check for pages in one of the chapters
        if len(matches) > 0:
            ch_url = matches[0].group(1)
            print(f"\nTesting Pages for {ch_url}")
            creq = urllib.request.Request(ch_url, headers=headers)
            with urllib.request.urlopen(creq) as cresp:
                chtml = cresp.read().decode('utf-8')
                # Manganato pages are in .container-chapter-reader
                # Each img has class "img-loading" or data-src
                pmatches = list(re.finditer(r'<img[^>]+src="([^"]+)"[^>]+alt="[^"]+"[^>]*>', chtml))
                # Often it is data-src
                pmatches_ds = list(re.finditer(r'data-src="([^"]+)"', chtml))
                print(f"Found {len(pmatches)} images via src")
                print(f"Found {len(pmatches_ds)} images via data-src")
                for i, m in enumerate(pmatches_ds[:5]):
                    print(f"Page {i}: {m.group(1)}")
                    
except Exception as e:
    print(f"Error: {e}")
