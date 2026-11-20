# EgoLoAF project page

Static research project website for **EgoLoAF: Learning Humanoid Loco-Manipulation from Egocentric Demonstrations with Hand–Object Affordances**.

Website: https://egoloaf.github.io/

## Preview locally

Run `python3 -m http.server 8080` in this directory and open http://localhost:8080/.
No dependencies or build step are required.

## Update the page

- `index.html`: paper information, authors, abstract, dataset, results, and citation.
- `styles.css`: responsive presentation.
- `script.js`: demo playback and speed controls, task comparison, image enlargement, navigation, and citation copying.
- `assets/`: paper PDF, research figures, complete task videos, real experiment frames, and supplied logos.

The **Code** button links to the [official code repository](https://github.com/EgoLoAF/EgoLoAF-Official), where the code release is marked **Coming soon**. The dataset button remains unavailable and displays **Coming soon**.

## Task demonstrations

The `#demos` section follows the hero and dataset metrics, before the Overview. Four complete recordings appear in a two-column desktop grid and a single column on mobile. Tissue-to-Box, Tissue-to-Bin, and Pick-Turn-Place default to 2× playback; Tissue-to-Cabinet defaults to 3×. Each player has independent native controls and a speed selector, including 1×.

Videos are H.264 MP4 files with no audio tracks. All original video frames and timestamps are retained; speed is applied in the browser, so the full original-speed recording remains available. `assets/videos/manifest.json` records durations, frame counts, dimensions, default speeds, and checksums. Posters are frames from the corresponding recordings.

Visible videos loop independently. Playback pauses outside the viewport or when the tab is hidden, and deliberate user pauses are respected. Reduced-motion and data-saving preferences disable automatic playback. Without JavaScript, native controls still play the complete recordings at their original speed.

## Hosting

The `EgoLoAF/egoloaf.github.io` repository hosts the account homepage at https://egoloaf.github.io/. GitHub Pages serves the root of `main`; configure **Settings → Pages → Deploy from a branch → main → / (root)**. `.nojekyll` preserves the buildless static site. Asset paths are relative, and the canonical URL, social preview, and citation point to the account homepage.

## Asset provenance

Research figures and the paper are provided by the EgoLoAF authors. `assets/manifest.json` records figure and frame provenance. Institution logos retain their original branding; their sources are recorded in `assets/logos/sources.json`. No ownership of university marks is implied. The figures, paper, logos, and experiment imagery are not covered by a separate website code license.
