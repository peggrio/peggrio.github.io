# Peizhen Liao — Portfolio

A static React and Vite portfolio for `https://peggrio.github.io/`.
GitHub Pages serves the HTML, CSS, JavaScript, poster, and MP4 directly. No Node.js server, Cloudflare Worker, API key, or database is needed at runtime.

## Local development

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

For a production preview:

```sh
npm test
npm run build
npm run preview
```

The publishable output is `dist/`.

## Content and interaction

- Edit name, role, publications, education, and work placeholders in `lib/profile.ts`.
- Cue times in `lib/story-cues.mjs` refer to `public/portrait-interactive.mp4`.
- At the top, relative horizontal pointer movement scrubs the first segment at sensitivity 0.8. Vertical scrolling controls the later scenes. The video remains paused and the background stays fixed.
- Seeks are serialized through `seeked`; text updates after the corresponding video frame finishes seeking.
- The deployed MP4 is approximately 12 MB and uses independently decodable frames for responsive reverse seeking. Preserve this encoding when replacing the video. Unused original video exports are omitted.

## GitHub Pages deployment

1. GitHub Free requires a public repository for Pages. A private repository requires a supported paid plan. Changing visibility also exposes the repository's existing files and commit history.
2. In repository **Settings → Pages**, choose **GitHub Actions** as the publishing source.
3. Merge the prepared migration branch into `main`. The workflow installs dependencies, runs tests, builds `dist/`, and publishes it to `https://peggrio.github.io/`.

Only `dist/` is uploaded as the Pages artifact. Source credentials and local environment files are not needed by the workflow. Video files are stored in regular Git, not Git LFS.

GitHub documents a 1 GB published-site limit and a soft 100 GB/month bandwidth limit. The current video fits comfortably within file and site limits; revisit media hosting if traffic or video size grows.

References: [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Vite on GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages).
