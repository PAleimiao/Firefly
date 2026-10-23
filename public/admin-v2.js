/* ==========================================================================
   Firefly 管理台 v2 —— 前端逻辑
   直接调用 GitHub REST API，读写仓库里的 Markdown / JSON / TS 配置文件。
   ========================================================================== */
'use strict';

const REPO = 'PAleimiao/Firefly';
const BRANCH = 'master';
const POSTS_PATH = 'src/content/posts';
const ANIME_PATH = 'src/data/animeData.json';
const CFG = {
  profile: 'src/config/profileConfig.ts',
  site: 'src/config/siteConfig.ts',
  announce: 'src/config/announcementConfig.ts',
  music: 'src/config/musicConfig.ts',
  friends: 'src/config/friendsConfig.ts',
};

let TOKEN = localStorage.getItem('github_token') || '';
const $ = (id) => document.getElementById(id);
const toast = (msg, type = 'ok') => {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
};

/* ---------------- 编码 / 请求 ---------------- */
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
async function gh(method, path, body) {
  const res = await fetch('https://api.github.com/repos/' + REPO + path, {
    method,
    headers: {
      Authorization: 'token ' + TOKEN,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = 'HTTP ' + res.status;
    try { const e = await res.json(); if (e && e.message) msg = e.message; } catch (_) {}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}
async function readFile(path) {
  const data = await gh('GET', '/contents/' + path + '?ref=' + BRANCH);
  return { text: b64decode(data.content), sha: data.sha };
}
async function writeFile(path, text, sha, message) {
  const body = { message, content: b64encode(text), branch: BRANCH };
  if (sha) body.sha = sha;
  return gh('PUT', '/contents/' + path, body);
}
async function deleteFile(path, sha, message) {
  return gh('DELETE', '/contents/' + path, { message, sha, branch: BRANCH });
}

/* ---------------- 安全回写工具 ----------------
   每条 edit: { re: 正则(必须唯一命中), repl: 字符串或 (m,g1,g2)=>string, label }
   ------------------------------------------------------------------ */
function applyEdits(text, edits) {
  let out = text;
  for (const e of edits) {
    const flags = e.re.flags.includes('g') ? e.re.flags : e.re.flags + 'g';
    const g = new RegExp(e.re.source, flags);
    const hits = out.match(g) || [];
    if (hits.length !== 1) {
      throw new Error(`「${e.label}」定位失败：命中 ${hits.length} 处（需 1 处）`);
    }
    out = out.replace(e.re, e.repl);
  }
  return out;
}
async function patchConfig(path, edits, message) {
  const { text, sha } = await readFile(path);
  const next = applyEdits(text, edits);
  if (next === text) { toast('没有变化，未提交'); return false; }
  await writeFile(path, next, sha, message);
  return true;
}
const q = (s) => '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, '\\n') + '"';
const boolRepl = (val) => (m, g1) => g1 + String(val);
const strRepl = (val) => (m, g1) => g1 + q(val);

/* ---------------- 通用 UI ---------------- */
function confirmBox(title, text) {
  return new Promise((resolve) => {
    $('confirm-title').textContent = title;
    $('confirm-text').textContent = text;
    $('confirm-modal').classList.add('show');
    const done = (v) => { $('confirm-modal').classList.remove('show'); resolve(v); };
    $('btn-confirm-ok').onclick = () => done(true);
    $('btn-confirm-cancel').onclick = () => done(false);
  });
}
function openTokenModal() { $('token-input').value = TOKEN; $('token-modal').classList.add('show'); }
function closeTokenModal() { $('token-modal').classList.remove('show'); }
function updateStatus() {
  const el = $('status');
  if (TOKEN) { el.textContent = 'Token 已配置'; el.className = 'status ok'; }
  else { el.textContent = '未配置 Token'; el.className = 'status err'; }
}
function bindToken() {
  $('btn-token').onclick = openTokenModal;
  $('btn-token-cancel').onclick = closeTokenModal;
  $('btn-token-ok').onclick = () => {
    const v = $('token-input').value.trim();
    if (!v) { toast('请输入 Token', 'error'); return; }
    TOKEN = v;
    if ($('token-save').checked) localStorage.setItem('github_token', v);
    else localStorage.removeItem('github_token');
    updateStatus();
    closeTokenModal();
    toast('Token 已保存');
    loadPosts();
  };
  updateStatus();
}

/* ==========================================================================
   标签页
   ========================================================================== */
const loadedTabs = new Set();
const tabLoaders = {
  post: () => loadPosts(),
  anime: () => loadAnime(),
  profile: () => loadProfile(),
  pages: () => loadPages(),
  announce: () => loadAnnounce(),
  music: () => loadMusic(),
  friends: () => loadFriends(),
};
function switchTab(name) {
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + name));
  if (!TOKEN) return;
  if (!loadedTabs.has(name)) {
    loadedTabs.add(name);
    Promise.resolve(tabLoaders[name] && tabLoaders[name]()).catch((e) => toast(e.message, 'error'));
  }
}

/* ==========================================================================
   文章
   ========================================================================== */
let posts = [];
let currentPost = null; // {name, sha}
let editorTab = 'edit';

function renderPostList() {
  const kw = $('post-search').value.trim().toLowerCase();
  const list = posts.filter((f) => !kw || f.name.toLowerCase().includes(kw));
  if (!list.length) { $('post-list').innerHTML = '<div class="muted" style="padding:10px">没有匹配的文章</div>'; return; }
  $('post-list').innerHTML = list.map((f) =>
    `<div class="item" data-name="${f.name}">
       <span class="fname">${f.name}</span>
       <span class="row" style="gap:8px"><span class="muted">${(f.size / 1024).toFixed(1)}KB</span>
       <span class="del" data-del="${f.name}" data-sha="${f.sha}">×</span></span>
     </div>`).join('');
  $('post-list').querySelectorAll('.item').forEach((el) => {
    el.onclick = (ev) => {
      if (ev.target.dataset.del) return;
      editPost(el.dataset.name);
    };
  });
  $('post-list').querySelectorAll('[data-del]').forEach((el) => {
    el.onclick = async (ev) => {
      ev.stopPropagation();
      if (!(await confirmBox('删除文章', `确定删除「${el.dataset.del}」？不可恢复。`))) return;
      try {
        await deleteFile(POSTS_PATH + '/' + el.dataset.del, el.dataset.sha, '删除文章: ' + el.dataset.del);
        toast('已删除');
        if (currentPost && currentPost.name === el.dataset.del) newPost();
        loadPosts();
      } catch (e) { toast('删除失败：' + e.message, 'error'); }
    };
  });
}
async function loadPosts() {
  if (!TOKEN) return;
  $('post-list').innerHTML = '<div class="muted" style="padding:10px">加载中…</div>';
  try {
    const data = await gh('GET', '/contents/' + POSTS_PATH + '?ref=' + BRANCH);
    posts = data.filter((f) => f.type === 'file' && f.name.endsWith('.md'));
    renderPostList();
    $('post-hint').textContent = `共 ${posts.length} 篇`;
  } catch (e) {
    $('post-list').innerHTML = `<div class="muted" style="padding:10px;color:#fca5a5">加载失败：${e.message}</div>`;
  }
}
async function editPost(name) {
  if (!TOKEN) return;
  try {
    const { text, sha } = await readFile(POSTS_PATH + '/' + name);
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    let body = text;
    const get = (fm, key) => {
      const m = fm.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
      return m ? m[1].trim() : '';
    };
    const strip = (v) => v.replace(/^["']|["']$/g, '');
    if (fmMatch) {
      const fm = fmMatch[1];
      body = text.slice(fmMatch[0].length);
      $('f-title').value = strip(get(fm, 'title'));
      $('f-slug').value = strip(get(fm, 'slug')) || name.replace(/\.md$/, '');
      const pub = strip(get(fm, 'published'));
      $('f-published').value = /^\d{4}-\d{2}-\d{2}/.test(pub) ? pub.slice(0, 10) : '';
      $('f-description').value = strip(get(fm, 'description'));
      const tagsRaw = get(fm, 'tags');
      $('f-tags').value = tagsRaw.replace(/^\[|\]$/g, '').split(',').map((s) => strip(s.trim())).filter(Boolean).join(', ');
      $('f-category').value = strip(get(fm, 'category'));
      $('f-image').value = strip(get(fm, 'image'));
      $('f-pinned').checked = get(fm, 'pinned') === 'true';
    }
    $('f-markdown').value = body.trim();
    currentPost = { name, sha };
    $('post-current').textContent = '当前编辑：' + name;
    updateWordCount();
    toast('已载入 ' + name);
  } catch (e) { toast('载入失败：' + e.message, 'error'); }
}
function newPost() {
  currentPost = null;
  ['f-title', 'f-slug', 'f-description', 'f-tags', 'f-image'].forEach((id) => ($(id).value = ''));
  $('f-category').value = '博客';
  $('f-published').value = new Date().toISOString().slice(0, 10);
  $('f-pinned').checked = false;
  $('f-markdown').value = '';
  $('post-current').textContent = '新建文章（尚未保存）';
  updateWordCount();
}
async function publishPost() {
  if (!TOKEN) return;
  const title = $('f-title').value.trim();
  if (!title) { toast('标题不能为空', 'error'); return; }

  let slug = $('f-slug').value.trim();
  if (!slug) slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'post-' + Date.now();
  const filename = slug + '.md';

  const published = $('f-published').value;
  const description = $('f-description').value.trim();
  const tags = $('f-tags').value.split(',').map((s) => s.trim()).filter(Boolean);
  const category = $('f-category').value.trim() || '博客';
  const image = $('f-image').value.trim();
  const pinned = $('f-pinned').checked;
  const body = $('f-markdown').value;

  let fm = '---\n';
  fm += 'title: ' + (/[:#]/.test(title) ? q(title) : title) + '\n';
  fm += 'published: ' + (published || new Date().toISOString().slice(0, 10)) + '\n';
  if (pinned) fm += 'pinned: true\n';
  if (description) fm += 'description: ' + (/[:#]/.test(description) ? q(description) : description) + '\n';
  if (tags.length) fm += 'tags: [' + tags.map((t) => (/[",]/.test(t) ? q(t) : t)).join(', ') + ']\n';
  fm += 'category: ' + (/[:#]/.test(category) ? q(category) : category) + '\n';
  if (image) fm += 'image: ' + image + '\n';
  fm += 'slug: ' + slug + '\n';
  fm += '---\n\n';

  const btn = $('btn-publish');
  btn.disabled = true;
  btn.textContent = '发布中…';
  try {
    await writeFile(POSTS_PATH + '/' + filename, fm + body,
      currentPost && currentPost.name === filename ? currentPost.sha : undefined,
      (currentPost ? '更新' : '新建') + '文章: ' + title);

    // slug 改名：删掉旧文件，避免出现重复文章
    if (currentPost && currentPost.name !== filename) {
      await deleteFile(POSTS_PATH + '/' + currentPost.name, currentPost.sha, '重命名文章: ' + currentPost.name + ' ' + filename);
      toast('已重命名：' + currentPost.name + ' ' + filename);
    } else {
      toast('发布成功，Cloudflare 正在构建…');
    }
    currentPost = { name: filename };
    $('post-current').textContent = '当前编辑：' + filename;
    await loadPosts();
  } catch (e) {
    toast('发布失败：' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '发布';
  }
}
function updateWordCount() {
  const n = ($('f-markdown').value || '').replace(/\s/g, '').length;
  $('word-count').textContent = n + ' 字';
}
function setEditorTab(tab) {
  editorTab = tab;
  const isPreview = tab === 'preview';
  $('f-markdown').classList.toggle('hidden', isPreview);
  $('preview').classList.toggle('hidden', !isPreview);
  $('btn-tab-edit').classList.toggle('primary', !isPreview);
  $('btn-tab-preview').classList.toggle('primary', isPreview);
  if (isPreview) $('preview').innerHTML = mdToHtml($('f-markdown').value);
}

/* ---------------- 轻量 Markdown 渲染 ---------------- */
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function inlineMd(s) {
  return s
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}
function mdToHtml(src) {
  const lines = String(src || '').split(/\r?\n/);
  const out = [];
  let inCode = false;
  let codeBuf = [];
  let listType = null;
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };

  for (const raw of lines) {
    if (/^```/.test(raw.trim())) {
      if (inCode) { out.push('<pre><code>' + escHtml(codeBuf.join('\n')) + '</code></pre>'); codeBuf = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(raw); continue; }
    const line = raw.trimEnd();

    if (!line.trim()) { closeList(); continue; }
    if (/^#{1,6}\s/.test(line)) {
      closeList();
      const lvl = line.match(/^#+/)[0].length;
      out.push(`<h${lvl}>${inlineMd(escHtml(line.replace(/^#+\s*/, '')))}</h${lvl}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); out.push('<hr>'); continue; }
    if (/^>\s?/.test(line.trim())) {
      closeList();
      out.push('<blockquote>' + inlineMd(escHtml(line.trim().replace(/^>\s?/, ''))) + '</blockquote>');
      continue;
    }
    const ulm = line.match(/^\s*[-*+]\s+(.*)$/);
    const olm = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ulm || olm) {
      const want = ulm ? 'ul' : 'ol';
      if (listType !== want) { closeList(); out.push(`<${want}>`); listType = want; }
      out.push('<li>' + inlineMd(escHtml((ulm || olm)[1])) + '</li>');
      continue;
    }
    closeList();
    out.push('<p>' + inlineMd(escHtml(line)) + '</p>');
  }
  if (inCode && codeBuf.length) out.push('<pre><code>' + escHtml(codeBuf.join('\n')) + '</code></pre>');
  closeList();
  return out.join('\n');
}

/* ==========================================================================
   番剧
   ========================================================================== */
let animeData = [];
let animeSha = '';
let editingAnime = -1;

function epRow(container, title, url) {
  const div = document.createElement('div');
  div.className = 'row';
  div.style.marginBottom = '6px';
  div.innerHTML =
    `<input type="text" class="ep-title" placeholder="标题（如 1）" value="${escHtml(title || '')}" style="flex:0 0 110px">
     <input type="text" class="ep-url" placeholder="视频直链" value="${escHtml(url || '')}" style="flex:1">
     <button class="btn danger" type="button">删</button>`;
  div.querySelector('button').onclick = () => div.remove();
  container.appendChild(div);
}
function collectEps(container) {
  const eps = [];
  container.querySelectorAll('.ep-title').forEach((t, i) => {
    const u = container.querySelectorAll('.ep-url')[i];
    if (t.value.trim() && u.value.trim()) eps.push({ title: t.value.trim(), url: u.value.trim() });
  });
  return eps;
}
async function loadAnime() {
  if (!TOKEN) return;
  try {
    const { text, sha } = await readFile(ANIME_PATH);
    animeData = JSON.parse(text || '[]');
    animeSha = sha;
    renderAnimeList();
  } catch (e) { toast('番剧加载失败：' + e.message, 'error'); }
}
function renderAnimeList() {
  const box = $('anime-list');
  if (!animeData.length) { box.innerHTML = '<div class="muted" style="padding:10px">暂无番剧</div>'; return; }
  box.innerHTML = animeData.map((a, i) =>
    `<div class="item"><span>${escHtml(a.title)} <span class="badge">${a.episodes.length} 集</span></span>
     <span class="row" style="gap:8px"><span class="muted">${escHtml(a.slug)}</span>
     <button class="btn" data-edit="${i}" style="padding:2px 8px">编辑</button></span></div>`).join('');
  box.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => openAnimeEdit(Number(b.dataset.edit));
  });
}
function openAnimeEdit(i) {
  editingAnime = i;
  const a = animeData[i];
  $('anime-edit').classList.remove('hidden');
  $('anime-edit-title').textContent = '编辑：' + a.title;
  $('e-title').value = a.title || '';
  $('e-slug').value = a.slug || '';
  $('e-cover').value = a.cover || '';
  $('e-desc').value = a.description || '';
  $('e-episodes').innerHTML = '';
  (a.episodes || []).forEach((ep) => epRow($('e-episodes'), ep.title, ep.url));
}
async function saveAnimeData(message) {
  await writeFile(ANIME_PATH, JSON.stringify(animeData, null, 2), animeSha, message);
  const fresh = await readFile(ANIME_PATH);
  animeSha = fresh.sha;
  renderAnimeList();
}
async function addAnime() {
  if (!TOKEN) return;
  const title = $('a-title').value.trim();
  const slug = $('a-slug').value.trim();
  const cover = $('a-cover').value.trim();
  const desc = $('a-desc').value.trim();
  if (!title || !slug || !cover) { toast('标题、slug、封面必填', 'error'); return; }
  if (!/^[a-z0-9-]+$/.test(slug)) { toast('slug 只能用 a-z 0-9 -', 'error'); return; }
  const eps = collectEps($('a-episodes'));
  if (!eps.length) { toast('至少一集', 'error'); return; }
  await loadAnime();
  if (animeData.some((a) => a.slug === slug)) { toast('slug 已存在', 'error'); return; }
  animeData.push({ slug, title, cover, description: desc || title, episodes: eps });
  await saveAnimeData('admin: 新增番剧 ' + title);
  $('a-title').value = ''; $('a-slug').value = ''; $('a-cover').value = ''; $('a-desc').value = '';
  $('a-episodes').innerHTML = ''; epRow($('a-episodes')); epRow($('a-episodes'));
  toast('番剧已保存');
}
async function saveAnimeEdit() {
  if (editingAnime < 0) return;
  const a = animeData[editingAnime];
  const slug = $('e-slug').value.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) { toast('slug 只能用 a-z 0-9 -', 'error'); return; }
  if (animeData.some((x, i) => i !== editingAnime && x.slug === slug)) { toast('slug 已被占用', 'error'); return; }
  const eps = collectEps($('e-episodes'));
  if (!eps.length) { toast('至少保留一集', 'error'); return; }
  a.title = $('e-title').value.trim() || a.title;
  a.slug = slug;
  a.cover = $('e-cover').value.trim();
  a.description = $('e-desc').value.trim();
  a.episodes = eps;
  await saveAnimeData('admin: 更新番剧 ' + a.title);
  openAnimeEdit(editingAnime);
  toast('已保存');
}
async function deleteAnimeItem() {
  if (editingAnime < 0) return;
  const a = animeData[editingAnime];
  if (!(await confirmBox('删除番剧', `确定删除「${a.title}」？不可恢复。`))) return;
  animeData.splice(editingAnime, 1);
  await saveAnimeData('admin: 删除番剧 ' + a.title);
  $('anime-edit').classList.add('hidden');
  editingAnime = -1;
  toast('已删除');
}

/* ==========================================================================
   个人资料
   ========================================================================== */
let profileLinks = [];
function linkRow(l) {
  const div = document.createElement('div');
  div.className = 'linkrow';
  div.innerHTML =
    `<input type="text" class="lk-icon" placeholder="图标，如 fa7-brands:qq" value="${escHtml(l.icon || '')}">
     <input type="text" class="lk-url" placeholder="链接地址" value="${escHtml(l.url || '')}">
     <label class="row" style="gap:4px;font-size:12px"><input type="checkbox" class="lk-show" ${l.showName ? 'checked' : ''}> 文字</label>
     <span class="fdel"></span>`;
  div.querySelector('.fdel').onclick = () => div.remove();
  $('p-links').appendChild(div);
}
function parseProfileLinks(text) {
  const m = text.match(/links:\s*\[([\s\S]*?)\n\t\],/);
  if (!m) return [];
  const blocks = m[1].match(/\{[^{}]*\}/g) || [];
  return blocks.map((b) => ({
    name: (b.match(/name:\s*"([^"]*)"/) || [])[1] || '',
    icon: (b.match(/icon:\s*"([^"]*)"/) || [])[1] || '',
    url: (b.match(/url:\s*"([^"]*)"/) || [])[1] || '',
    showName: /showName:\s*true/.test(b),
  }));
}
function genLinksBlock(links) {
  let s = '\tlinks: [\n';
  for (const l of links) {
    s += '\t\t{\n';
    s += `\t\t\tname: ${q(l.name)},\n`;
    s += `\t\t\ticon: ${q(l.icon)},\n`;
    s += `\t\t\turl: ${q(l.url)},\n`;
    s += `\t\t\tshowName: ${l.showName ? 'true' : 'false'},\n`;
    s += '\t\t},\n';
  }
  s += '\t],\n';
  return s;
}
async function loadProfile() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(CFG.profile);
    $('p-avatar').value = strip((text.match(/^\tavatar:\s*"([^"]*)"/m) || [])[1] || '');
    $('p-name').value = strip((text.match(/^\tname:\s*"([^"]*)"/m) || [])[1] || '');
    $('p-bio').value = strip((text.match(/^\tbio:\s*"([^"]*)"/m) || [])[1] || '');
    profileLinks = parseProfileLinks(text);
    $('p-links').innerHTML = '';
    profileLinks.forEach(linkRow);
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
function collectLinks() {
  const rows = $('p-links').querySelectorAll('.linkrow');
  const out = [];
  rows.forEach((r) => {
    const icon = r.querySelector('.lk-icon').value.trim();
    const url = r.querySelector('.lk-url').value.trim();
    if (!icon || !url) return;
    out.push({ name: icon.split(':').pop(), icon, url, showName: r.querySelector('.lk-show').checked });
  });
  return out;
}
async function saveProfile() {
  if (!TOKEN) return;
  const links = collectLinks();
  const edits = [
    { re: /(^\tavatar:\s*)"[^"]*"/m, repl: strRepl($('p-avatar').value.trim()), label: '头像' },
    { re: /(^\tname:\s*)"[^"]*"/m, repl: strRepl($('p-name').value.trim()), label: '名字' },
    { re: /(^\tbio:\s*)"[^"]*"/m, repl: strRepl($('p-bio').value.trim()), label: '签名' },
    { re: /(\tlinks: \[)[\s\S]*?(\n\t\],\n)/m, repl: () => genLinksBlock(links), label: '社交链接' },
  ];
  try {
    const changed = await patchConfig(CFG.profile, edits, 'admin: 更新个人资料');
    if (changed) { toast('个人资料已保存，等待 Cloudflare 构建'); loadProfile(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   页面开关 + 站点信息
   ========================================================================== */
const PAGE_TOGGLES = [
  ['friends', '友链页面', '关闭后 /friends 返回 404，导航「社交 友链」消失'],
  ['sponsor', '打赏页面', '关闭后 /sponsor 返回 404，导航「打赏」消失'],
  ['guestbook', '留言板', '关闭后 /guestbook 返回 404，导航「社交 留言」消失'],
  ['bangumi', '番组计划', '关闭后 /bangumi 返回 404，导航「我的 番组计划」消失'],
  ['gallery', '相册', '关闭后 /gallery 返回 404，导航「我的 相册」消失'],
  ['anime', '追番', '关闭后 /anime 返回 404，导航「我的 追番」消失'],
  ['dynamic', '动态', '关闭后 /dynamic 返回 404，导航「动态」消失'],
];
const EXTRA_TOGGLES = [
  ['categoryBar', '首页分类导航条', '开启后首页/归档顶部显示分类快捷栏'],
  ['foldArticle', '归档折叠旧年份', '开启后归档页只展开最新一年'],
  ['allowSwitch', '允许切换列表布局', '开启后访客可在列表/网格之间切换'],
  ['sharePoster', '分享海报', '开启后文章页可生成分享海报'],
  ['showLastModified', '显示上次编辑时间', '开启后文章超过阈值天数会显示「上次编辑」卡片'],
  ['stickyNavbar', '导航栏吸顶', '开启后导航栏固定在顶部'],
];
function toggleHtml(id, title, desc) {
  return `<label class="toggle"><input type="checkbox" id="${id}">
    <span><span class="t">${title}</span><span class="d">${desc}</span></span></label>`;
}
async function loadPages() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(CFG.site);
    $('pg-pages').innerHTML = PAGE_TOGGLES.map(([k, t, d]) => toggleHtml('pg-page-' + k, t, d + `（${k}）`)).join('');
    $('pg-extras').innerHTML = EXTRA_TOGGLES.map(([k, t, d]) => toggleHtml('pg-extra-' + k, t, d)).join('');
    PAGE_TOGGLES.forEach(([k]) => {
      const m = text.match(new RegExp('^\\t\\t' + k + ':\\s*(true|false)', 'm'));
      $('pg-page-' + k).checked = m ? m[1] === 'true' : true;
    });
    EXTRA_TOGGLES.forEach(([k]) => {
      const m = text.match(new RegExp('^\\t+' + k + ':\\s*(true|false)', 'm'));
      $('pg-extra-' + k).checked = m ? m[1] === 'true' : true;
    });
    $('s-title').value = strip((text.match(/^\ttitle:\s*"([^"]*)"/m) || [])[1] || '');
    $('s-subtitle').value = strip((text.match(/^\tsubtitle:\s*"([^"]*)"/m) || [])[1] || '');
    $('s-description').value = strip((text.match(/^\tdescription:\s*"([^"]*)"/m) || [])[1] || '');
    $('s-siteurl').value = strip((text.match(/^\tsite_url:\s*"([^"]*)"/m) || [])[1] || '');
    $('s-hue').value = (text.match(/^\t\thue:\s*(\d+)/m) || [])[1] || 165;
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
async function savePages() {
  if (!TOKEN) return;
  const edits = [];
  PAGE_TOGGLES.forEach(([k]) => {
    edits.push({ re: new RegExp('(^\\t\\t' + k + ':\\s*)(true|false)', 'm'), repl: boolRepl($('pg-page-' + k).checked), label: '页面开关 ' + k });
  });
  EXTRA_TOGGLES.forEach(([k]) => {
    edits.push({ re: new RegExp('(^\\t+' + k + ':\\s*)(true|false)', 'm'), repl: boolRepl($('pg-extra-' + k).checked), label: '开关 ' + k });
  });
  edits.push({ re: /(^\ttitle:\s*)"[^"]*"/m, repl: strRepl($('s-title').value.trim()), label: '站名' });
  edits.push({ re: /(^\tsubtitle:\s*)"[^"]*"/m, repl: strRepl($('s-subtitle').value.trim()), label: '副标题' });
  edits.push({ re: /(^\tdescription:\s*)"[^"]*"/m, repl: strRepl($('s-description').value.trim()), label: '描述' });
  edits.push({ re: /(^\tsite_url:\s*)"[^"]*"/m, repl: strRepl($('s-siteurl').value.trim()), label: '站点 URL' });
  edits.push({ re: /(^\t\thue:\s*)\d+/m, repl: (m, g1) => g1 + String(Number($('s-hue').value) || 165), label: '主题色相' });
  try {
    const changed = await patchConfig(CFG.site, edits, 'admin: 更新页面开关与站点信息');
    if (changed) { toast('已保存，等待 Cloudflare 构建'); loadPages(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   公告
   ========================================================================== */
async function loadAnnounce() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(CFG.announce);
    const grab = (re) => strip((text.match(re) || [])[1] || '');
    $('an-title').value = grab(/^\ttitle:\s*"([^"]*)"/m);
    $('an-content').value = grab(/^\tcontent:\s*"([\s\S]*?)",?\s*$/m);
    $('an-closable').checked = /^\tclosable:\s*true/m.test(text);
    const linkBlock = text.match(/link:\s*\{([\s\S]*?)\n\t\}/);
    const lb = linkBlock ? linkBlock[1] : '';
    $('an-link-enabled').checked = /enable:\s*true/.test(lb);
    $('an-link-text').value = strip((lb.match(/text:\s*"([^"]*)"/) || [])[1] || '');
    $('an-link-url').value = strip((lb.match(/url:\s*"([^"]*)"/) || [])[1] || '');
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
async function saveAnnounce() {
  if (!TOKEN) return;
  const edits = [
    { re: /(^\ttitle:\s*)"[^"]*"/m, repl: strRepl($('an-title').value.trim()), label: '公告标题' },
    { re: /(^\tcontent:\s*)"[\s\S]*?"(,?)$/m, repl: (m, g1, g2) => g1 + q($('an-content').value) + (g2 || ','), label: '公告内容' },
    { re: /(^\tclosable:\s*)(true|false)/m, repl: boolRepl($('an-closable').checked), label: '允许关闭' },
    { re: /(^\t\tenable:\s*)(true|false)/m, repl: boolRepl($('an-link-enabled').checked), label: '链接开关' },
    { re: /(^\t\ttext:\s*)"[^"]*"/m, repl: strRepl($('an-link-text').value.trim()), label: '链接文字' },
    { re: /(^\t\turl:\s*)"[^"]*"/m, repl: strRepl($('an-link-url').value.trim()), label: '链接地址' },
  ];
  try {
    const changed = await patchConfig(CFG.announce, edits, 'admin: 更新公告');
    if (changed) { toast('公告已保存'); loadAnnounce(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   音乐
   ========================================================================== */
async function loadMusic() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(CFG.music);
    const str = (re) => strip((text.match(re) || [])[1] || '');
    $('m-switches').innerHTML =
      toggleHtml('m-nav', '导航栏入口', '关闭后顶部导航栏不再出现音乐按钮') +
      toggleHtml('m-sidebar', '侧边栏播放器', '关闭后侧边栏不显示播放器组件') +
      toggleHtml('m-lyrics', '显示歌词', '关闭后只显示封面与进度条');
    $('m-nav').checked = /^\tshowInNavbar:\s*true/m.test(text);
    $('m-sidebar').checked = /^\tshowInSidebar:\s*true/m.test(text);
    $('m-lyrics').checked = /^\tshowLyrics:\s*true/m.test(text);
    $('m-mode').value = str(/^\tmode:\s*"([^"]*)"/m) || 'meting';
    $('m-volume').value = parseFloat(str(/^\tvolume:\s*([\d.]+)/m) || '0.7');
    $('m-server').value = str(/^\t\tserver:\s*"([^"]*)"/m) || 'netease';
    $('m-type').value = str(/^\t\ttype:\s*"([^"]*)"/m) || 'playlist';
    $('m-id').value = str(/^\t\tid:\s*"([^"]*)"/m);
    $('m-api').value = str(/^\t\tapi:\s*"([^"]*)"/m);
    const fb = text.match(/fallbackApis:\s*\[([\s\S]*?)\n\t\t\]/);
    $('m-fallback').value = fb ? (fb[1].match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1)).join('\n') : '';
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
function buildMetingUrl() {
  return $('m-api').value.trim()
    .replace(':server', $('m-server').value)
    .replace(':type', $('m-type').value)
    .replace(':id', $('m-id').value)
    .replace(':r', String(Math.random()));
}
async function testMusic() {
  const url = buildMetingUrl();
  $('music-test-status').textContent = '请求中…';
  $('music-test-out').textContent = url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { parsed = null; }
    if (Array.isArray(parsed)) {
      $('music-test-status').textContent = `拿到 ${parsed.length} 首`;
      $('music-test-out').innerHTML = parsed.slice(0, 10).map((t) =>
        `<div>${escHtml(t.name || '?')} — ${escHtml(t.artist || t.ar?.map((x) => x.name).join('/') || '')}</div>`).join('');
    } else if (parsed && parsed.error) {
      $('music-test-status').textContent = '' + parsed.error;
      $('music-test-out').textContent = JSON.stringify(parsed);
    } else {
      $('music-test-status').textContent = '返回不是曲目数组';
      $('music-test-out').textContent = text.slice(0, 500);
    }
  } catch (e) {
    $('music-test-status').textContent = '请求失败（可能被 CORS 拦截）';
    $('music-test-out').textContent = e.message;
  }
}
async function saveMusic() {
  if (!TOKEN) return;
  const fb = $('m-fallback').value.split('\n').map((s) => s.trim()).filter(Boolean);
  const fbBlock = '\t\tfallbackApis: [\n' + fb.map((u) => '\t\t\t' + q(u) + ',\n').join('') + '\t\t],';
  const edits = [
    { re: /(^\tshowInNavbar:\s*)(true|false)/m, repl: boolRepl($('m-nav').checked), label: '导航栏入口' },
    { re: /(^\tshowInSidebar:\s*)(true|false)/m, repl: boolRepl($('m-sidebar').checked), label: '侧边栏播放器' },
    { re: /(^\tshowLyrics:\s*)(true|false)/m, repl: boolRepl($('m-lyrics').checked), label: '歌词开关' },
    { re: /(^\tmode:\s*)"[^"]*"/m, repl: strRepl($('m-mode').value), label: '播放模式' },
    { re: /(^\tvolume:\s*)[\d.]+/m, repl: (m, g1) => g1 + String(Number($('m-volume').value) || 0.7), label: '音量' },
    { re: /(^\t\tserver:\s*)"[^"]*"/m, repl: strRepl($('m-server').value), label: '平台' },
    { re: /(^\t\ttype:\s*)"[^"]*"/m, repl: strRepl($('m-type').value), label: '类型' },
    { re: /(^\t\tid:\s*)"[^"]*"/m, repl: strRepl($('m-id').value.trim()), label: '歌单 ID' },
    { re: /(^\t\tapi:\s*)"[^"]*"/m, repl: strRepl($('m-api').value.trim()), label: 'API 地址' },
    { re: /(\t\tfallbackApis: \[)[\s\S]*?(\n\t\t\],)/m, repl: () => fbBlock, label: '备用 API' },
  ];
  try {
    const changed = await patchConfig(CFG.music, edits, 'admin: 更新音乐配置');
    if (changed) { toast('音乐配置已保存'); loadMusic(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   友链
   ========================================================================== */
let friendList = [];
function friendRow(f) {
  const div = document.createElement('div');
  div.style.cssText = 'border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px';
  div.innerHTML =
    `<div class="frow"><span class="muted">标题</span><input type="text" class="fr-title" value="${escHtml(f.title || '')}"></div>
     <div class="frow"><span class="muted">链接</span><input type="text" class="fr-url" value="${escHtml(f.siteurl || '')}"></div>
     <div class="frow"><span class="muted">头像</span><input type="text" class="fr-img" value="${escHtml(f.imgurl || '')}"></div>
     <div class="frow"><span class="muted">描述</span><input type="text" class="fr-desc" value="${escHtml(f.desc || '')}"></div>
     <div class="frow"><span class="muted">标签</span><input type="text" class="fr-tags" value="${escHtml((f.tags || []).join(', '))}" placeholder="blog, tools"></div>
     <div class="frow"><span class="muted">权重</span><input type="number" class="fr-weight" value="${Number(f.weight) || 0}"></div>
     <div class="row between">
       <label class="row" style="gap:6px;font-size:12px"><input type="checkbox" class="fr-enabled" ${f.enabled ? 'checked' : ''}> 启用</label>
       <span class="fdel">删除</span>
     </div>`;
  div.querySelector('.fdel').onclick = () => div.remove();
  $('fr-list').appendChild(div);
}
function parseFriends(text) {
  const arr = text.match(/export const friendsConfig: FriendLink\[\] = \[([\s\S]*?)\n\];/);
  if (!arr) return [];
  const blocks = arr[1].match(/\{[^{}]*\}/g) || [];
  return blocks.map((b) => {
    const str = (k) => {
      const m = b.match(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
      return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
    };
    const tagsM = b.match(/tags:\s*\[([^\]]*)\]/);
    return {
      title: str('title'), siteurl: str('siteurl'), imgurl: str('imgurl'), desc: str('desc'),
      tags: tagsM ? (tagsM[1].match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1)) : [],
      weight: Number((b.match(/weight:\s*(\d+)/) || [])[1] || 0),
      enabled: /enabled:\s*true/.test(b),
    };
  });
}
function collectFriends() {
  const rows = $('fr-list').children;
  const out = [];
  for (const r of rows) {
    const g = (cls) => r.querySelector('.' + cls).value.trim();
    const title = g('fr-title'), siteurl = g('fr-url');
    if (!title || !siteurl) continue;
    out.push({
      title,
      imgurl: g('fr-img'),
      desc: g('fr-desc'),
      siteurl,
      tags: g('fr-tags').split(',').map((s) => s.trim()).filter(Boolean),
      weight: Number(g('fr-weight')) || 0,
      enabled: r.querySelector('.fr-enabled').checked,
    });
  }
  return out;
}
function genFriendsBlock(list) {
  let s = 'export const friendsConfig: FriendLink[] = [\n';
  for (const f of list) {
    s += '\t{\n';
    s += `\t\ttitle: ${q(f.title)},\n`;
    s += `\t\timgurl: ${q(f.imgurl)},\n`;
    s += `\t\tdesc: ${q(f.desc)},\n`;
    s += `\t\tsiteurl: ${q(f.siteurl)},\n`;
    s += `\t\ttags: [${f.tags.map((t) => q(t)).join(', ')}],\n`;
    s += `\t\tweight: ${Number(f.weight) || 0},\n`;
    s += `\t\tenabled: ${f.enabled ? 'true' : 'false'},\n`;
    s += '\t},\n';
  }
  s += '];';
  return s;
}
async function loadFriends() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(CFG.friends);
    friendList = parseFriends(text);
    $('fr-list').innerHTML = '';
    friendList.forEach(friendRow);
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
async function saveFriends() {
  if (!TOKEN) return;
  const list = collectFriends();
  if (!list.length) { toast('至少保留一条友链', 'error'); return; }
  const edits = [{
    re: /(export const friendsConfig: FriendLink\[\] = \[)[\s\S]*?(\n\];)/m,
    repl: () => genFriendsBlock(list),
    label: '友链列表',
  }];
  try {
    const changed = await patchConfig(CFG.friends, edits, 'admin: 更新友链');
    if (changed) { toast('友链已保存'); loadFriends(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   初始化
   ========================================================================== */
const strip = (v) => String(v || '').replace(/^["']|["']$/g, '');

function init() {
  bindToken();

  document.querySelectorAll('#tabs button').forEach((b) => {
    b.onclick = () => switchTab(b.dataset.tab);
  });

  // 文章
  $('btn-reload-posts').onclick = loadPosts;
  $('post-search').oninput = renderPostList;
  $('btn-newpost').onclick = newPost;
  $('btn-publish').onclick = publishPost;
  $('btn-tab-edit').onclick = () => setEditorTab('edit');
  $('btn-tab-preview').onclick = () => setEditorTab('preview');
  $('f-markdown').oninput = updateWordCount;
  $('f-published').value = new Date().toISOString().slice(0, 10);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'Enter')) {
      e.preventDefault();
      if ($('panel-post').classList.contains('active')) publishPost();
    }
  });

  // 番剧
  $('btn-add-ep').onclick = () => epRow($('a-episodes'));
  $('btn-save-anime').onclick = () => addAnime().catch((e) => toast(e.message, 'error'));
  $('btn-load-anime').onclick = loadAnime;
  $('btn-add-e-ep').onclick = () => epRow($('e-episodes'));
  $('btn-save-anime-edit').onclick = () => saveAnimeEdit().catch((e) => toast(e.message, 'error'));
  $('btn-del-anime').onclick = () => deleteAnimeItem().catch((e) => toast(e.message, 'error'));
  epRow($('a-episodes')); epRow($('a-episodes'));

  // 个人资料
  $('btn-add-link').onclick = () => linkRow({ icon: 'fa7-brands:github', url: '', showName: false });
  $('btn-save-profile').onclick = saveProfile;
  $('btn-reload-profile').onclick = loadProfile;

  // 页面开关
  $('btn-save-pages').onclick = savePages;
  $('btn-reload-pages').onclick = loadPages;

  // 公告
  $('btn-save-announce').onclick = saveAnnounce;
  $('btn-reload-announce').onclick = loadAnnounce;

  // 音乐
  $('btn-test-music').onclick = testMusic;
  $('btn-save-music').onclick = saveMusic;
  $('btn-reload-music').onclick = loadMusic;

  // 友链
  $('btn-add-friend').onclick = () => friendRow({ title: '', siteurl: '', imgurl: '', desc: '', tags: [], weight: 1, enabled: true });
  $('btn-save-friends').onclick = saveFriends;
  $('btn-reload-friends').onclick = loadFriends;

  if (TOKEN) loadPosts();
}
document.addEventListener('DOMContentLoaded', init);
