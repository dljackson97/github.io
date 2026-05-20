# Clementine Speech Therapy — Website

Marketing website for Clementine Speech Therapy, a speech-language pathology practice in St. Pete and St. Petersburg, FL.

**Live site:** [clementinespeech.com](https://www.clementinespeech.com)  
**Instagram:** [@clementinespeechtherapy](https://www.instagram.com/clementinespeechtherapy)

---

## Pages

| Page | URL |
|---|---|
| Home | `/` |
| About | `/about` |
| Services | `/services` |
| FAQs | `/faqs` |
| Contact | `/contact` |
| Privacy Policy | `/privacy-policy` |
| Terms & Conditions | `/terms-and-conditions` |
| 404 | `404.html` (served automatically by GitHub Pages) |

---

## Tech Stack

- Plain HTML, CSS, JavaScript — no framework or build step
- Hosted on **GitHub Pages** with `.nojekyll` to disable Jekyll processing
- Custom domain via **Namecheap** (`clementinespeech.com` and `clementinespeechtherapy.com` redirect)

---

## File Structure

```
/
├── index.html               # Home page
├── style.css                # Global styles
├── main.js                  # JS (nav, scroll reveal, popup)
├── favicon.ico
├── sitemap.xml
├── robots.txt
├── 404.html                 # Custom branded error page
├── .nojekyll                # Disables Jekyll on GitHub Pages
├── about/
│   └── index.html
├── services/
│   └── index.html
├── faqs/
│   └── index.html
├── contact/
│   └── index.html
├── privacy-policy/
│   └── index.html
├── terms-and-conditions/
│   └── index.html
└── images/
```

---

## SEO Notes

- Canonical tags on all indexed pages
- `sitemap.xml` submitted to Google Search Console
- `robots.txt` points crawlers to sitemap
- Schema markup: `LocalBusiness` on home, `Person` (Aemelia Jackson) on About
- Meta descriptions target both "St. Pete" and "St. Petersburg, FL"
- Instagram linked in footer (all pages) and `sameAs` in Person schema

---

## Deployment

Push to the `main` branch. GitHub Pages deploys automatically within ~1 minute.

After deploying significant changes, request re-indexing in **Google Search Console** for affected pages.
