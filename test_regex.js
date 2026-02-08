const html = `
    <div class="col-4 col-md-2">
        <div class="tab-thumb c-image-hover">
            <a href="https://www.mangaread.org/manga/solo-leveling-ragnarok/" title="Solo Leveling: Ragnarok">
                <img width="240" height="320" src="..." />
            </a>
        </div>
    </div>
`;

const regex = /<div class="tab-thumb c-image-hover">\s*<a href="([^"]+)" title="([^"]+)">/g;
let match;
while ((match = regex.exec(html)) !== null) {
    console.log('Match found!');
    console.log('Path:', match[1]);
    console.log('Title:', match[2]);
}

if (!regex.test(html)) {
    // note: regex.test advances index if global, but I loop above.
    // If loop didn't run, check manually.
}
