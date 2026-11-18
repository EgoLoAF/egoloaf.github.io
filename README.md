# EgoLoAF project page

Static research project website for **EgoLoAF: Learning Humanoid Loco-Manipulation from Egocentric Demonstrations with Hand–Object Affordances**.

Website: https://yuhengna.github.io/EgoLoAF/

## Preview locally

Run `python3 -m http.server 8080` in this directory and open http://localhost:8080/.
No dependencies or build step are required.

## Update the page

- `index.html`: paper information, authors, abstract, dataset, results, and citation.
- `styles.css`: responsive presentation.
- `script.js`: task comparison, image enlargement, navigation, and citation copying.
- `assets/`: paper PDF, research figures, real experiment frames, and supplied logos.

Code and dataset resource buttons intentionally display **Coming soon**. They are not placeholder links. The video section intentionally has no video source; replace `.video-placeholder` with the project video when ready.

## Hosting

GitHub Pages serves the root of `main`. `.nojekyll` preserves the buildless static site. Keep asset paths relative so the site works at `/EgoLoAF/`.

## Asset provenance

Research figures and the paper are provided by the EgoLoAF authors. `assets/manifest.json` records figure and frame provenance. Institution logos retain their original branding; their sources are recorded in `assets/logos/sources.json`. No ownership of university marks is implied. The figures, paper, logos, and experiment imagery are not covered by a separate website code license.
