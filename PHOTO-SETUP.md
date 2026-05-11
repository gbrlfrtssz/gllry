# Photo Setup

Put your photos in these folders:

- `assets/photos/beach`
- `assets/photos/nature`
- `assets/photos/street`
- `assets/photos/black-and-white`
- `assets/photos/people`

Supported formats:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`
- `.avif`

After adding or removing photos, run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\refresh-photo-manifest.ps1
```

Or just double-click:

```text
01-refresh-photo-manifest.bat
```

That updates `photo-manifest.js`, which is what the site reads.

If you want to refresh the manifest and push everything to GitHub in one go, use:

```text
02-publish-gallery.bat
```

That file:

- refreshes `photo-manifest.js`
- stages the gallery files
- creates a git commit
- pushes to your current remote branch

Gallery behavior:

- `All categories`: 3 random photos from each category, total 15
- Single category selected: 15 random photos from that category

If one category has fewer than the requested amount, the site shows as many as are available.
