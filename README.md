# Blackbox Advancements

Static marketing site for **Blackbox Advancements**, built for **GitHub Pages** with **Namecheap** as the domain registrar for `blackboxadvancements.com`.

## Included pages

- `index.html`
- `services.html`
- `solutions.html`
- `systems.html`
- `industries.html`
- `about.html`
- `faq.html`
- `contact.html`

## Assets and support files

- `assets/logo.svg`
- `assets/favicon.svg`
- `style.css`
- `script.js`
- `CNAME`
- `.nojekyll`
- `robots.txt`
- `sitemap.xml`

## Website positioning

This site is designed to position Blackbox Advancements as a **serious AI infrastructure and automation partner**, not just a marketing agency.

It covers:
- AI sales automation
- cold calls, texts, and emails
- Google Ads and Facebook Ads management
- social media automation across Instagram, Facebook, TikTok, X, and other relevant channels
- AI landing pages and full websites
- CRM setup and automation
- automated follow-up and scheduling
- client-side portals
- agent-side portals
- AI assistants and AI calling via Wispr, Claude, and OpenClaw
- SEO management and secure logins
- AI research and plain-language website updates
- OpenClaw installation with a local always-on business machine
- 24/7 support for edits, issues, and improvements

## Deploy to GitHub Pages

1. Create a GitHub repo.
2. Push this folder to the `main` branch.
3. In GitHub, go to **Settings â Pages**.
4. Set the source to **Deploy from a branch**.
5. Choose **main** and **/(root)**.
6. Save.

GitHub Pages will serve the static files automatically.

## Connect the custom domain in Namecheap

Add these records in **Namecheap â Domain List â Manage â Advanced DNS**:

- `@` â A â `185.199.108.153`
- `@` â A â `185.199.109.153`
- `@` â A â `185.199.110.153`
- `@` â A â `185.199.111.153`
- `www` â CNAME â `<your-github-username>.github.io`

Then in GitHub Pages:

- set custom domain to `blackboxadvancements.com`
- wait for certificate issuance
- enable HTTPS when it becomes available

## Notes

- This site is fully static and GitHub Pages safe.
- The contact form currently uses a `mailto:` action for static compatibility.
- Replace `hello@blackboxadvancements.com` with the final business inbox if needed.
- If you want a real submission endpoint later, connect the form to Formspree, Basin, a Cloudflare Worker, or another static-friendly form handler.

<!-- mumms site added -->
