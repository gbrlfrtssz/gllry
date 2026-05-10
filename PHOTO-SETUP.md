# Photo Setup

The gallery is back to using local folders and `photo-manifest.js`.

## Folder structure

Put your images in these folders:

- `assets/photos/beach`
- `assets/photos/nature`
- `assets/photos/street`
- `assets/photos/black-and-white`
- `assets/photos/people`

Your `About` portrait stays local too:

- `assets/about/profile.jpg`

## How the gallery works

- `All categories`: shows 3 random photos from each category, total 15
- `Beach`, `Nature`, `Street`, `Black and White`, `People`: shows 15 random photos from the selected folder

## After adding or removing photos

Run:

- `01-refresh-photo-manifest.bat`

That updates `photo-manifest.js` so the site can see the files.

If everything looks right locally and you want to publish it to GitHub Pages, then run:

- `02-publish-gallery.bat`

## Notes

- File names can be numbers like `1.jpg`, `25.webp`, `348921.png`
- You do not need Unsplash for the gallery anymore
