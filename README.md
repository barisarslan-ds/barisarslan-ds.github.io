# barisarslan-ds.github.io

Personal landing page. Static, no build step, no dependencies.

```
index.html   markup
styles.css   all styling (theme vars live at the top of the file)
main.js      hash routing + live GitHub repo list
```

## editing

- **theme** — the six CSS variables at the top of `styles.css` (`--bg`, `--fg`, `--accent`, …).
- **name / links / tagline** — the `.left` section of `index.html`.
- **projects** — pulled live from `api.github.com`. To hide a repo, add its name to `HIDE` in `main.js`. Forks are hidden by default (`SHOW_FORKS`).

## deploy

Push to `main`, then Settings → Pages → Source: *Deploy from a branch* → `main` / `root`.
Live at https://barisarslan-ds.github.io/
