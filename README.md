# EgoLoAF project page

Static project website for **EgoLoAF: Learning Humanoid Loco-Manipulation from Egocentric Demonstrations with Hand–Object Affordances**.

Official website: https://egoloaf.github.io/
Repository: https://github.com/EgoLoAF/egoloaf.github.io

## Local preview

Run `python3 -m http.server 8770 --bind 127.0.0.1` in this directory, then open http://127.0.0.1:8770/ . No dependencies or build step are required.

## Page structure

- Cinematic opening: moving observation wall, full title, authors, contribution notes, affiliations, and original white institution logos.
- Collection comparison: synchronized cabinet-task recordings, staffing, live completion and phase readouts, and measured acquisition effort across four tasks.
- Method: original high-resolution pipeline and a concise account of motion, affordances, observation rendering, and post-training.
- Conversion showcase: two smaller rendering players shown side by side, with individual controls and Play both examples. Each retains the original RGB and humanoid-motion insets.
- Real-world tasks: the four complete recordings already supplied in this repository, with playback speed controls.
- Dataset: scale, task-motion coverage, aligned training modalities, and quality checks.
- Results, paper, and citation.

The Code link points to the official code repository and remains marked Coming soon. Dataset download remains Coming soon.

The fixed navigation changes with scrolling: the transparent hero header becomes white, the three institution logos appear at the left, the EgoLoAF wordmark moves to the center, and section links move to the right. Narrow layouts use a menu and compact institution marks. Motion respects the reduced-motion setting.

## Files

- `index.html`: content and media structure.
- `styles.css`: approved cinematic identity and common responsive layout.
- `page-sections.css`: comparison, rendering showcase, and dataset coverage.
- `script.js`: native video playback, synchronized readouts, media selection, figure enlargement, navigation, and citation copying.
- `assets/`: paper, original figures, genuine recordings, rendered training-data examples, and supplied identity assets.

## Collection comparison

The existing composite retains both full recordings on one clock: teleoperation on the left and an external view of human egocentric collection on the right. The human wears a chest camera. Teleoperation uses an operator and reset assistant; human collection uses one person. Mobile uses the equivalent portrait composition, with teleoperation above and human collection below. Changing layout preserves playback position and rate.

Both recordings retain all original frames and timing. The 156.433-second teleoperation clip holds its final frame for 1.3 seconds to match the 157.733-second human clip. Playback defaults to 4×, with 1× and 2× available. Completion and phase markers come from the existing visually reviewed timeline, rounded to whole seconds. The observed one-versus-four count in this clip is separate from the paper's mean 4.03× acquisition person-hour efficiency across four matched training budgets.

## Video behavior and provenance

Videos use browser-compatible H.264 MP4 with silent playback. The small hero wall loops automatically and pauses offscreen; reduced-motion preferences are respected. Other videos start through user controls. Real task clips retain their complete original recordings, with browser playback defaults of 2× or 3× and an original-speed option.

The two new conversion clips retain full 1920×1080 framing and original timing. The main view shows rendered G1 arms and O6 hands, the upper-right inset shows original human RGB, and the lower-left inset shows reconstructed humanoid motion. These are visualizations of converted training data, distinct from the real-robot execution recordings.

Existing collection and task manifests remain under `assets/videos/`. Rendered samples are under `assets/videos/rendering/`. Research figures, paper, and media are supplied by the authors. Institution logos retain their original branding; no ownership of university marks is implied.

## Hosting and updates

GitHub Pages serves the root of `main` in EgoLoAF/egoloaf.github.io. `.nojekyll` preserves the buildless static site. Canonical, social, and citation URLs use https://egoloaf.github.io/ . Re-check upstream changes before applying an approved update. Push only after the author's upload instruction.
