/* ─────────────────────────────────────────────
   config — the only bit you'll normally touch
   ───────────────────────────────────────────── */
const USER          = "barisarslan-ds";
const HIDE          = ["barisarslan-ds.github.io", "barisarslan-ds"]; // repo names to keep off the list
const SHOW_FORKS    = false;
const CACHE_MINUTES = 30;

/* ─────────────────────────────────────────────
   routing
   ───────────────────────────────────────────── */
const views = document.querySelectorAll(".view");
const items = document.querySelectorAll(".menu-item");
let projectsLoaded = false;

function show(name) {
  const known = [...views].some(v => v.dataset.view === name);
  if (!known) name = "home";

  views.forEach(v => {
    const on = v.dataset.view === name;
    v.hidden = !on;
    if (on) { v.style.animation = "none"; void v.offsetWidth; v.style.animation = ""; }
  });
  items.forEach(i => i.classList.toggle("active", i.dataset.view === name));

  if (name === "projects" && !projectsLoaded) { projectsLoaded = true; loadRepos(); }
  if (name === "resume") checkResume();
}

function route() { show(location.hash.replace(/^#\/?/, "") || "home"); }
addEventListener("hashchange", route);
route();

/* ─────────────────────────────────────────────
   resume — reveals the button only if the file exists
   ───────────────────────────────────────────── */
let resumeChecked = false;
async function checkResume() {
  if (resumeChecked) return;
  resumeChecked = true;
  try {
    const r = await fetch("resume.pdf", { method: "HEAD" });
    if (!r.ok) return;
    document.getElementById("resume-link").hidden = false;
    const ph = document.getElementById("resume-placeholder");
    if (ph) ph.hidden = true;
  } catch (_) { /* no file, no button */ }
}

/* ─────────────────────────────────────────────
   github repos
   ───────────────────────────────────────────── */
const LANG_COLORS = {
  Python:"#3572A5", "Jupyter Notebook":"#DA5B0B", R:"#198CE7", JavaScript:"#f1e05a",
  TypeScript:"#3178c6", HTML:"#e34c26", CSS:"#563d7c", Java:"#b07219", "C++":"#f34b7d",
  C:"#555555", Go:"#00ADD8", Rust:"#dea584", Shell:"#89e051", SQL:"#e38c00",
  Scala:"#c22d40", Julia:"#a270ba", MATLAB:"#e16737", Dockerfile:"#384d54"
};

const fmtDate = iso => new Date(iso).toLocaleDateString("en-GB",
  { day: "numeric", month: "short", year: "numeric" });

function cached() {
  try {
    const raw = sessionStorage.getItem("repos:" + USER);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    return Date.now() - t < CACHE_MINUTES * 60000 ? data : null;
  } catch (_) { return null; }
}

async function loadRepos() {
  const list = document.getElementById("repos");
  const count = document.getElementById("repo-count");

  let repos = cached();
  if (!repos) {
    try {
      const res = await fetch(
        `https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`,
        { headers: { Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(res.status === 403 ? "rate-limited" : "http " + res.status);
      repos = await res.json();
      try {
        sessionStorage.setItem("repos:" + USER, JSON.stringify({ t: Date.now(), data: repos }));
      } catch (_) {}
    } catch (err) {
      list.innerHTML =
        `<li class="error">couldn't reach the github api (${err.message}). ` +
        `<a href="https://github.com/${USER}?tab=repositories" target="_blank" rel="noopener">` +
        `browse the repos directly &rarr;</a></li>`;
      return;
    }
  }

  const shown = repos
    .filter(r => !r.private)
    .filter(r => SHOW_FORKS || !r.fork)
    .filter(r => !HIDE.includes(r.name))
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

  if (!shown.length) {
    list.innerHTML = `<li class="error">no public repos yet.</li>`;
    return;
  }

  count.textContent = `${shown.length} public ${shown.length === 1 ? "repo" : "repos"}, newest first`;

  list.innerHTML = shown.map(r => {
    const color = LANG_COLORS[r.language] || "#8b9196";
    const meta = [
      r.language ? `<span><i class="dot" style="background:${color}"></i><b>${esc(r.language)}</b></span>` : "",
      r.stargazers_count ? `<span>&#9733; <b>${r.stargazers_count}</b></span>` : "",
      `<span>updated <b>${fmtDate(r.pushed_at)}</b></span>`
    ].filter(Boolean).join("");

    return `<li class="repo">
      <a href="${r.html_url}" target="_blank" rel="noopener">
        <div class="repo-top"><span class="repo-name">${esc(r.name)}</span></div>
        ${r.description ? `<p class="repo-desc">${esc(r.description)}</p>` : ""}
        <div class="repo-meta">${meta}</div>
      </a></li>`;
  }).join("");
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
