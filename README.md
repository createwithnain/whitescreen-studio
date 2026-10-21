# WhiteScreen Studio

A complete React implementation inspired by the utility experience of whitescreen.online, with an original visual identity, original writing, and organized internal links. It does not copy the reference site's branding, articles, user reviews, or assets.

## Run locally

Requires Node.js 22.12 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the local URL printed by Vite. On Windows, copy `.env.example` to `.env.local` using File Explorer or `Copy-Item .env.example .env.local` in PowerShell.

Set `VITE_SITE_URL` to your real public HTTPS domain, `VITE_SITE_OWNER` to your name or business, and `VITE_CONTACT_EMAIL` to a public email you control. A `.env.local` value overrides the included preview's `.env.production` value. Restart development or rebuild after changing configuration. All `VITE_` values are public: never put passwords, API secrets, or private credentials in these variables.

## Production build

```bash
npm run build
npm test
npm run check
```

Deploy **the complete `dist` directory**. The build creates individual HTML pages with React-rendered content and hydrates them for the tools. Every route has its own title, description, canonical URL, social metadata, readable content, and links before JavaScript executes. The XML sitemap and robots.txt use the configured public origin.

The included `netlify.toml` supports a Git-connected Netlify build. For Netlify Drop, build locally and drag the `dist` folder to Netlify Drop. If deploying the included ready-built `dist` without rebuilding, its canonical URLs point to the private preview, so configure your domain and rebuild first. Vite's development server is for development; its generic fallback is not the production routing configuration.

For another static host, enable directory-index handling so `/white-screen/` serves `/white-screen/index.html`. Unknown paths must return `404.html` with **HTTP 404**, rather than rewriting every request to the homepage. The output includes a real noindex 404. Keep all asset files and subdirectories. HTTPS is needed for the best clipboard and wake-lock support.

## Tools and pages

- Eleven preset color screens and one custom-color screen.
- PNG export for solid and gradient screens: Full HD, QHD, 4K, portrait, square, or custom dimensions; 1–4,096 px per edge.
- Visual brightness, synchronized color/hex inputs, RGB readout, color copy, keyboard shortcuts, and optional screen wake lock.
- Manual dead pixel test with five colors and optional slow cycling.
- Monitor patterns: grayscale gradient, contrast steps, geometry grid.
- Two-color gradient canvas and PNG generator.
- Video call light and adjustable-width ring light.
- Local-time clock, pauseable focus countdown, bouncing animation, and digital rain.
- Clearly labeled fictional update and cracked-screen demos.
- Category pages, searchable directory, tool search, five original guides, About, Contact, Privacy, Terms, Editorial Policy, Accessibility, and HTML sitemap.
- Optional light/dark site theme; its preference stays on the device. Canvas colors remain the selected colors.

The screen tool uses the browser Fullscreen API where available and falls back to a fixed expanded view with an exit control. It does not control the hardware brightness, automatically diagnose pixels, fix defects, open other monitors, or provide critical alarms. The guides explain these limits. A browser tab can still be suspended or closed. Reduced-motion settings start animated tools paused.

## Project map

| Location | Purpose |
| --- | --- |
| `src/content.js` | Tool descriptions, practical instructions, categories, FAQs, and guide content |
| `src/ToolStudio.jsx` | Interactive tools and full screen behavior |
| `src/App.jsx` | Layout, page routes, directory, guides, policies, contact, ad container |
| `src/styles.css` | Responsive design and visual patterns |
| `src/config.js` | Public deployment settings |
| `scripts/prerender.mjs` | Static React rendering, metadata, JSON-LD, sitemap, robots, 404 |
| `scripts/check.mjs` | Page, metadata, anchor, asset, and internal-link checks |
| `tests/core.test.mjs` | Color, export, timer, gradient, and content-integrity checks |
| `dist/` | Generated deployable website |

Use normal anchor links and directory routes. New tools belong in `src/content.js`; new interactive types belong in `ToolStudio.jsx`. After changing content, run the build and route checks. The site needs no application server, database, or account service.

## Contact behavior

When `VITE_CONTACT_EMAIL` is set, the contact form prepares a `mailto:` draft in the visitor's email application. The visitor reviews and sends it there; the form does not claim that an email was sent. Without an email configured, it offers a clearly labeled local feedback-copy function. There is no hidden submission endpoint or fabricated success message. To add direct delivery later, integrate a real form service or backend, update the privacy policy, and test delivery before advertising the feature.

## Before applying for AdSense

The project includes an application-friendly foundation, not a promise of approval. Google evaluates the live site, original value, policy compliance, ownership, and user experience. There is no guaranteed article length, page count, traffic level, or approval date.

1. Put the site on a publicly accessible domain you control. The supplied hosted preview is owner-private and cannot serve as your public AdSense site.
2. Set the real domain, operator name, and monitored public contact email, then rebuild. Check all canonical URLs and the sitemap after deployment.
3. Review every guide, tool, and policy so the wording accurately describes your actual operation. Add useful firsthand explanations where you can; do not simply multiply near-identical color pages to chase keywords.
4. Verify full screen, mobile layout, PNG downloads, clock, timer, motion controls, feedback email, and 404 status in browsers on your own devices. Local automated output checks do not replace cross-browser testing.
5. Keep ads separated from tool controls, downloads, and navigation. Do not add ads to the expanded color canvas or create misleading buttons. Do not ask visitors to click ads.
6. Set up Search Console, submit `/sitemap.xml`, and inspect the live URLs. A sitemap is not a guarantee of indexing or rankings.
7. Apply through your own AdSense account and follow the live setup instructions from Google. Keep optional ad serving off until the account/site, consent setup, and disclosures are ready.

Official references reviewed for this implementation:

- [Make sure your site's pages are ready for AdSense](https://support.google.com/adsense/answer/7299563?hl=en)
- [AdSense eligibility requirements](https://support.google.com/adsense/answer/9724?hl=en)
- [Google Publisher Policies](https://support.google.com/publisherpolicies/answer/10502938?hl=en)
- [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google consent-management requirements](https://support.google.com/adsense/answer/13554116?hl=en)

## Optional advertising

Ads are disabled by default. There is no fake publisher ID, no bundled analytics, and no ad script in the default HTML. To integrate ads, configure a **Google-certified CMP appropriate to your audience**, review its installation instructions and regional behavior, then provide:

```dotenv
VITE_ADSENSE_ENABLED=true
VITE_ADSENSE_CLIENT=ca-pub-YOUR_16_DIGIT_ID
VITE_ADSENSE_SLOT=YOUR_NUMERIC_SLOT
VITE_CMP_SCRIPT_URL=https://YOUR_CMP_BOOTSTRAP_URL
```

The placeholder values above are documentation only and fail the build's validation until replaced with real values. The build validates ID formats and an HTTPS CMP bootstrap URL; it cannot certify your provider or prove consent compliance. Install any additional vendor-specific tags required by your CMP. Do not substitute a homemade “accept” banner for the required certified platform. Test consent withdrawal and geographic requirements in the public deployment. The ad loader relies on the configured CMP and Google's consent controls; consent is not inferred from a theme preference or clipboard interaction.

After enabling, the build generates `ads.txt` with your publisher ID, and content pages can render a labeled responsive ad container below substantive content. Auto ads are not configured; avoid enabling placements that intrude into the tool canvas. The privacy page changes its ad disclosure, but you must still adapt it to the actual CMP, vendors, data practices, and relevant requirements. AdSense may provide a separate verification step; follow the instructions in your own account rather than assuming ad-slot configuration completes verification.

## Validation and limitations

`npm test` checks color input handling, safe PNG dimensions, elapsed-time timer calculations, CSS/canvas gradient direction, and guide/tool relationships. `npm run check` validates all generated pages, unique metadata, headings, structured data, internal links, fragment anchors, assets, sitemap membership, default ad-free output, and the 404 document.

Browser UI testing was unavailable in the build environment. Full screen permission behavior, image downloads, wake-lock handling, clipboard operations, ad serving, and mailto delivery must be verified on actual target browsers. The default project sends no mail, loads no ads, and does not require camera or microphone permissions.

Social metadata includes an original SVG card. Some social networks require a raster Open Graph image; replace `public/social-card.svg` with a 1200 × 630 PNG/JPEG and update the corresponding metadata if your target platform does not render SVG previews.

## Deployment-source note

The downloadable project intentionally excludes the hosted preview's Site identity, Git metadata, credentials, dependencies, and temporary server bundle. Its complete source, lockfile, configuration example, and a build snapshot are included. Install dependencies and rebuild after changing the public deployment details.
