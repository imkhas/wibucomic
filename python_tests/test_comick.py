import urllib.request
import json

def test_comick_api():
    query = "solo"
    url = f"https://api.comick.io/v1.0/search?q={query}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    print(f"Testing ComicK Search: {url}")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"Found {len(data)} results")
            for item in data[:5]:
                print(f"- {item.get('title')} (slug: {item.get('slug')}, hid: {item.get('hid')})")
            
            if len(data) > 0:
                hid = data[0].get('hid')
                print(f"\nTesting ComicK Chapters for hid: {hid}")
                # Endpoint for chapters: /comic/{hid}/chapters
                # Or /comic/{slug}/chapters
                chapters_url = f"https://api.comick.io/comic/{hid}/chapters?lang=en&limit=100"
                req_ch = urllib.request.Request(chapters_url, headers=headers)
                with urllib.request.urlopen(req_ch) as resp_ch:
                    ch_data = json.loads(resp_ch.read().decode('utf-8'))
                    chapters = ch_data.get('chapters', [])
                    print(f"Found {len(chapters)} chapters")
                    for ch in chapters[:5]:
                        print(f"  Ch {ch.get('chap')}: {ch.get('title')} (hid: {ch.get('hid')})")
                        
                    if len(chapters) > 0:
                        ch_hid = chapters[0].get('hid')
                        print(f"\nTesting ComicK Pages for chapter hid: {ch_hid}")
                        pages_url = f"https://api.comick.io/chapter/{ch_hid}?tachiyomi=true"
                        req_pg = urllib.request.Request(pages_url, headers=headers)
                        with urllib.request.urlopen(req_pg) as resp_pg:
                            pg_data = json.loads(resp_pg.read().decode('utf-8'))
                            # tachiyomi=true often gives simpler image list
                            images = pg_data.get('chapter', {}).get('images', [])
                            print(f"Found {len(images)} pages")
                            for img in images[:5]:
                                print(f"    Page: {img.get('url')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_comick_api()
