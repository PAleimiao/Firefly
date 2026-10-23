/* ==========================================================================
   管理台扩展：动态 / 打赏 / 相册 + Markdown 工具条 + 图片上传
   依赖 admin2.js 暴露的：$ / TOKEN / BRANCH / gh / readFile / writeFile /
   deleteFile / applyEdits / patchConfig / q / toast / confirmBox / escHtml /
   tabLoaders / strip
   ========================================================================== */
'use strict';

const SPONSOR_PATH = 'src/config/sponsorConfig.ts';
const GALLERY_PATH = 'src/config/galleryConfig.ts';
const DYNAMIC_DIR = 'src/content/dynamic';

/* ==========================================================================
   Markdown 工具条
   ========================================================================== */
function mdWrap(ta, before, after, placeholder) {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const sel = ta.value.slice(start, end) || placeholder || '';
  const text = before + sel + after;
  ta.value = ta.value.slice(0, start) + text + ta.value.slice(end);
  ta.focus();
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + sel.length;
  ta.dispatchEvent(new Event('input'));
  return text;
}
function mdPrefix(ta, prefix) {
  const start = ta.selectionStart;
  const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
  ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + prefix.length;
  ta.dispatchEvent(new Event('input'));
}
function mdBlock(ta, text) {
  const start = ta.selectionStart;
  const before = ta.value.slice(0, start);
  const needNl = before.length && !before.endsWith('\n') ? '\n' : '';
  const after = ta.value.slice(start);
  const tail = after.startsWith('\n') ? '' : '\n';
  ta.value = before + needNl + text + '\n' + tail + after;
  ta.focus();
  ta.selectionStart = ta.selectionEnd = start + needNl.length + text.length + 1;
  ta.dispatchEvent(new Event('input'));
}

const MD_ACTIONS = {
  h2: (ta) => mdPrefix(ta, '## '),
  bold: (ta) => mdWrap(ta, '**', '**', '粗体'),
  italic: (ta) => mdWrap(ta, '*', '*', '斜体'),
  strike: (ta) => mdWrap(ta, '~~', '~~', '删除线'),
  mark: (ta) => mdWrap(ta, '==', '==', '高亮'),
  code: (ta) => mdWrap(ta, '`', '`', '代码'),
  codeblock: (ta) => mdBlock(ta, '```bash\n在这里写代码\n```'),
  quote: (ta) => mdPrefix(ta, '> '),
  ul: (ta) => mdPrefix(ta, '- '),
  ol: (ta) => mdPrefix(ta, '1. '),
  hr: (ta) => mdBlock(ta, '---'),
  table: (ta) => mdBlock(ta, '| 表头 | 表头 |\n|------|------|\n| 内容 | 内容 |'),
  details: (ta) => mdBlock(ta, '<details>\n<summary>点击展开</summary>\n\n在这里写内容\n\n</details>'),
  note: (ta) => mdBlock(ta, '> [!NOTE]\n> 提示内容'),
  katex: (ta) => mdWrap(ta, '$', '$', 'E=mc^2'),
  mermaid: (ta) => mdBlock(ta, '```mermaid\ngraph TD\n    A[开始] --> B[结束]\n```'),
  github: (ta) => mdBlock(ta, '::github{repo="PAleimiao/Firefly"}'),
  more: (ta) => mdBlock(ta, '<!-- more -->'),
};
function applyMd(action) {
  const ta = $('f-markdown');
  const fn = MD_ACTIONS[action];
  if (fn) fn(ta);
}

/* ---------- 上传 ---------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}
function safeFileName(name) {
  const dot = name.lastIndexOf('.');
  const ext = (dot >= 0 ? name.slice(dot) : '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  const base = (dot >= 0 ? name.slice(0, dot) : name).replace(/[^\w\u4e00-\u9fa5-]/g, '_').slice(0, 40);
  return base + '-' + Date.now() + ext;
}
async function uploadTo(dir, file, message) {
  const name = safeFileName(file.name);
  const path = dir + '/' + name;
  const b64 = await fileToBase64(file);
  await gh('PUT', '/contents/' + path, { message: message || ('上传图片 ' + name), content: b64, branch: BRANCH });
  return { url: '/' + path.replace(/^public\//, ''), name };
}

async function handlePostImages(files) {
  const ta = $('f-markdown');
  if (!files || !files.length) return;
  const status = $('post-current');
  const links = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.size > 8 * 1024 * 1024) { toast(f.name + ' 超过 8MB，已跳过', 'error'); continue; }
    if (status) status.textContent = `上传中 ${i + 1}/${files.length}：${f.name}`;
    try {
      const res = await uploadTo('public/assets/uploads', f, 'admin: 上传文章图片 ' + f.name);
      links.push(res);
    } catch (e) { toast('上传失败：' + e.message, 'error'); }
  }
  if (status) status.textContent = '';
  if (links.length) {
    mdBlock(ta, links.map((l) => `![${l.name}](${l.url})`).join('\n'));
    toast(`已插入 ${links.length} 张图片`);
  }
}
async function handlePhotoUpload(files) {
  const album = albums[albumIndex];
  if (!album) { toast('先选一个相册', 'error'); return; }
  if (!files || !files.length) return;
  let ok = 0;
  for (const f of files) {
    if (f.size > 8 * 1024 * 1024) { toast(f.name + ' 超过 8MB，已跳过', 'error'); continue; }
    try {
      await uploadTo('public/gallery/' + album.id, f, 'admin: 上传相册图片 ' + f.name);
      ok++;
    } catch (e) { toast('上传失败：' + e.message, 'error'); }
  }
  if (ok) { toast(`已上传 ${ok} 张`); loadPhotos(album.id); }
}
async function handleQrUpload(file) {
  if (!file) return;
  try {
    const res = await uploadTo('public/assets/images/sponsor', file, 'admin: 上传收款码');
    const input = document.querySelector('.sp-qr');
    if (input) input.value = res.url;
    toast('收款码已上传，记得点保存');
  } catch (e) { toast('上传失败：' + e.message, 'error'); }
}

/* ==========================================================================
   动态
   ========================================================================== */
let dynamicFiles = [];
let editingDynamic = null; // {name, sha}

function fmtLocal(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
function dyToParts(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value || '');
  if (!m) return null;
  return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}:${m[6] || '00'}` };
}
function newDynamic() {
  editingDynamic = null;
  $('dy-time').value = fmtLocal(new Date());
  $('dy-body').value = '';
  $('dy-current').textContent = '新建动态（尚未发布）';
}
async function loadDynamic() {
  if (!TOKEN) return;
  $('dynamic-list').innerHTML = '<div class="muted" style="padding:10px">加载中…</div>';
  try {
    const data = await gh('GET', '/contents/' + DYNAMIC_DIR + '?ref=' + BRANCH);
    dynamicFiles = data.filter((f) => f.type === 'file' && f.name.endsWith('.md'));
    renderDynamicList();
  } catch (e) {
    $('dynamic-list').innerHTML = `<div class="muted" style="padding:10px;color:#fca5a5">加载失败：${e.message}</div>`;
  }
}
function renderDynamicList() {
  const box = $('dynamic-list');
  if (!dynamicFiles.length) { box.innerHTML = '<div class="muted" style="padding:10px">还没有动态</div>'; return; }
  box.innerHTML = dynamicFiles.slice().reverse().map((f) =>
    `<div class="item" data-name="${f.name}">
       <span>${f.name}</span>
       <span class="row" style="gap:8px"><span class="muted">${(f.size / 1024).toFixed(1)}KB</span>
       <span class="del" data-del="${f.name}" data-sha="${f.sha}">×</span></span>
     </div>`).join('');
  box.querySelectorAll('.item').forEach((el) => {
    el.onclick = (ev) => { if (!ev.target.dataset.del) editDynamic(el.dataset.name); };
  });
  box.querySelectorAll('[data-del]').forEach((el) => {
    el.onclick = async (ev) => {
      ev.stopPropagation();
      if (!(await confirmBox('删除动态', `确定删除「${el.dataset.del}」？`))) return;
      try {
        await deleteFile(DYNAMIC_DIR + '/' + el.dataset.del, el.dataset.sha, 'admin: 删除动态');
        toast('已删除');
        if (editingDynamic && editingDynamic.name === el.dataset.del) newDynamic();
        loadDynamic();
      } catch (e) { toast('删除失败：' + e.message, 'error'); }
    };
  });
}
async function editDynamic(name) {
  try {
    const { text, sha } = await readFile(DYNAMIC_DIR + '/' + name);
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    let body = text;
    let published = '';
    if (fm) {
      body = text.slice(fm[0].length);
      const m = fm[1].match(/^published:\s*(.+)$/m);
      published = m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
    }
    const d = new Date(published.replace(' ', 'T'));
    $('dy-time').value = isNaN(d.getTime()) ? fmtLocal(new Date()) : fmtLocal(d);
    $('dy-body').value = body.trim();
    editingDynamic = { name, sha };
    $('dy-current').textContent = '编辑中：' + name;
    toast('已载入 ' + name);
  } catch (e) { toast('载入失败：' + e.message, 'error'); }
}
async function saveDynamic() {
  if (!TOKEN) return;
  const parts = dyToParts($('dy-time').value);
  if (!parts) { toast('时间格式不对', 'error'); return; }
  const body = $('dy-body').value.trim();
  if (!body) { toast('内容不能为空', 'error'); return; }
  const content = `---\npublished: ${parts.date} ${parts.time}\n---\n\n${body}\n`;
  const filename = `${parts.date}-${parts.time.replace(/:/g, '')}.md`;
  const btn = $('btn-save-dynamic');
  btn.disabled = true;
  try {
    await writeFile(DYNAMIC_DIR + '/' + filename, content,
      editingDynamic && editingDynamic.name === filename ? editingDynamic.sha : undefined,
      (editingDynamic ? '更新' : '新建') + '动态 ' + filename);
    if (editingDynamic && editingDynamic.name !== filename) {
      await deleteFile(DYNAMIC_DIR + '/' + editingDynamic.name, editingDynamic.sha, 'admin: 重命名动态');
    }
    editingDynamic = { name: filename };
    $('dy-current').textContent = '当前：' + filename;
    toast('动态已保存');
    loadDynamic();
  } catch (e) {
    toast('保存失败：' + e.message, 'error');
  } finally { btn.disabled = false; }
}

/* ==========================================================================
   打赏
   ========================================================================== */
function spMethodRow(m) {
  const div = document.createElement('div');
  div.style.cssText = 'border:1px solid var(--line);border-radius:10px;padding:10px;margin-bottom:10px';
  div.innerHTML =
    `<div class="frow"><span class="muted">名称</span><input type="text" class="sp-name" value="${escHtml(m.name || '')}"></div>
     <div class="frow"><span class="muted">图标</span><input type="text" class="sp-icon" value="${escHtml(m.icon || '')}" placeholder="fa7-brands:alipay"></div>
     <div class="frow"><span class="muted">收款码</span>
       <div class="row" style="gap:6px"><input type="text" class="sp-qr" value="${escHtml(m.qrCode || '')}" style="flex:1">
       <button type="button" class="btn sp-upload">上传</button></div></div>
     <div class="frow"><span class="muted">链接</span><input type="text" class="sp-link" value="${escHtml(m.link || '')}"></div>
     <div class="frow"><span class="muted">说明</span><input type="text" class="sp-desc" value="${escHtml(m.description || '')}"></div>
     <div class="row between">
       <label class="row" style="gap:6px;font-size:12px"><input type="checkbox" class="sp-enabled" ${m.enabled ? 'checked' : ''}> 启用</label>
       <span class="fdel sp-del">× 删除</span>
     </div>`;
  div.querySelector('.sp-del').onclick = () => div.remove();
  div.querySelector('.sp-upload').onclick = () => {
    const input = $('qr-input');
    input.onchange = () => handleQrUpload(input.files[0]).then(() => { input.value = ''; });
    input.click();
  };
  $('sp-methods').appendChild(div);
}
async function loadSponsor() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(SPONSOR_PATH);
    const str = (re) => strip((text.match(re) || [])[1] || '');
    $('sp-usage').value = str(/^\tusage:\s*"([^"]*)"/m);
    $('sp-toggles').innerHTML =
      `<label class="toggle"><input type="checkbox" id="sp-list"><span><span class="t">显示打赏者列表</span><span class="d">页面底部展示赞助者名单</span></span></label>
       <label class="toggle"><input type="checkbox" id="sp-comment"><span><span class="t">打赏页评论</span><span class="d">需要先在 commentConfig 启用评论系统</span></span></label>
       <label class="toggle"><input type="checkbox" id="sp-button"><span><span class="t">文章页打赏按钮</span><span class="d">每篇文章底部显示打赏入口</span></span></label>`;
    $('sp-list').checked = /^\tshowSponsorsList:\s*true/m.test(text);
    $('sp-comment').checked = /^\tshowComment:\s*true/m.test(text);
    $('sp-button').checked = /^\tshowButtonInPost:\s*true/m.test(text);

    const block = text.match(/methods:\s*\[([\s\S]*?)\n\t\],/);
    const methods = block ? (block[1].match(/\{[^{}]*\}/g) || []).map((b) => ({
      name: (b.match(/name:\s*"([^"]*)"/) || [])[1] || '',
      icon: (b.match(/icon:\s*"([^"]*)"/) || [])[1] || '',
      qrCode: (b.match(/qrCode:\s*"([^"]*)"/) || [])[1] || '',
      link: (b.match(/link:\s*"([^"]*)"/) || [])[1] || '',
      description: (b.match(/description:\s*"([^"]*)"/) || [])[1] || '',
      enabled: /enabled:\s*true/.test(b),
    })) : [];
    $('sp-methods').innerHTML = '';
    methods.forEach(spMethodRow);
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
function collectMethods() {
  const out = [];
  const rows = $('sp-methods').children;
  for (const r of rows) {
    const g = (cls) => r.querySelector('.' + cls).value.trim();
    const name = g('sp-name');
    if (!name) continue;
    out.push({
      name,
      icon: g('sp-icon'),
      qrCode: g('sp-qr'),
      link: g('sp-link'),
      description: g('sp-desc'),
      enabled: r.querySelector('.sp-enabled').checked,
    });
  }
  return out;
}
function genMethodsBlock(list) {
  let s = '\tmethods: [\n';
  for (const m of list) {
    s += '\t\t{\n';
    s += `\t\t\tname: ${q(m.name)},\n`;
    s += `\t\t\ticon: ${q(m.icon)},\n`;
    s += `\t\t\tqrCode: ${q(m.qrCode)},\n`;
    s += `\t\t\tlink: ${q(m.link)},\n`;
    s += `\t\t\tdescription: ${q(m.description)},\n`;
    s += `\t\t\tenabled: ${m.enabled ? 'true' : 'false'},\n`;
    s += '\t\t},\n';
  }
  s += '\t],';
  return s;
}
async function saveSponsor() {
  if (!TOKEN) return;
  const edits = [
    { re: /(^\tusage:\s*)"[^"]*"/m, repl: (m, g1) => g1 + q($('sp-usage').value.trim()), label: '用途说明' },
    { re: /(^\tshowSponsorsList:\s*)(true|false)/m, repl: (m, g1) => g1 + String($('sp-list').checked), label: '打赏者列表' },
    { re: /(^\tshowComment:\s*)(true|false)/m, repl: (m, g1) => g1 + String($('sp-comment').checked), label: '评论' },
    { re: /(^\tshowButtonInPost:\s*)(true|false)/m, repl: (m, g1) => g1 + String($('sp-button').checked), label: '文章内按钮' },
    { re: /(\tmethods: \[)[\s\S]*?(\n\t\],)/m, repl: () => genMethodsBlock(collectMethods()), label: '收款方式' },
  ];
  try {
    const ok = await patchConfig(SPONSOR_PATH, edits, 'admin: 更新打赏配置');
    if (ok) { toast('打赏配置已保存'); loadSponsor(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   相册
   ========================================================================== */
let albums = [];
let albumIndex = -1;

function parseAlbums(text) {
  const block = text.match(/albums:\s*\[([\s\S]*?)\n\t\],/);
  if (!block) return [];
  return (block[1].match(/\{[^{}]*\}/g) || []).map((b) => {
    const str = (k) => {
      const m = b.match(new RegExp('\\b' + k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
      return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\') : '';
    };
    const arr = (k) => {
      const m = b.match(new RegExp(k + ':\\s*\\[([^\\]]*)\\]'));
      return m ? (m[1].match(/"([^"]*)"/g) || []).map((s) => s.slice(1, -1)) : [];
    };
    return {
      id: str('id'), name: str('name'), description: str('description'),
      location: str('location'), date: str('date'), cover: str('cover'),
      coverVideo: str('coverVideo'), password: str('password'), passwordHint: str('passwordHint'),
      tags: arr('tags'), externalImages: arr('externalImages'), externalSource: str('externalSource'),
    };
  });
}
function genAlbumsBlock(list) {
  let s = '\talbums: [\n';
  for (const a of list) {
    s += '\t\t{\n';
    s += `\t\t\tid: ${q(a.id)},\n`;
    s += `\t\t\tname: ${q(a.name)},\n`;
    if (a.description) s += `\t\t\tdescription: ${q(a.description)},\n`;
    if (a.location) s += `\t\t\tlocation: ${q(a.location)},\n`;
    if (a.date) s += `\t\t\tdate: ${q(a.date)},\n`;
    if (a.tags && a.tags.length) s += `\t\t\ttags: [${a.tags.map((t) => q(t)).join(', ')}],\n`;
    if (a.cover) s += `\t\t\tcover: ${q(a.cover)},\n`;
    if (a.coverVideo) s += `\t\t\tcoverVideo: ${q(a.coverVideo)},\n`;
    if (a.password) s += `\t\t\tpassword: ${q(a.password)},\n`;
    if (a.passwordHint) s += `\t\t\tpasswordHint: ${q(a.passwordHint)},\n`;
    if (a.externalImages && a.externalImages.length) s += `\t\t\texternalImages: [${a.externalImages.map((u) => q(u)).join(', ')}],\n`;
    if (a.externalSource) s += `\t\t\texternalSource: ${q(a.externalSource)},\n`;
    s += '\t\t},\n';
  }
  s += '\t],';
  return s;
}
async function loadGallery() {
  if (!TOKEN) return;
  try {
    const { text } = await readFile(GALLERY_PATH);
    albums = parseAlbums(text);
    renderAlbums();
  } catch (e) { toast('读取失败：' + e.message, 'error'); }
}
function renderAlbums() {
  const box = $('ga-list');
  if (!albums.length) { box.innerHTML = '<div class="muted" style="padding:10px">还没有相册</div>'; return; }
  box.innerHTML = albums.map((a, i) =>
    `<div class="item" data-idx="${i}"><span>${escHtml(a.name)} <span class="badge">${escHtml(a.id)}</span></span>
     <span class="row" style="gap:8px"><span class="muted">${a.password ? '加密' : '公开'}</span>
     <span class="del" data-del="${i}">×</span></span></div>`).join('');
  box.querySelectorAll('.item').forEach((el) => {
    el.onclick = (ev) => { if (!ev.target.dataset.del) openAlbum(Number(el.dataset.idx)); };
  });
  box.querySelectorAll('[data-del]').forEach((el) => {
    el.onclick = (ev) => {
      ev.stopPropagation();
      albums.splice(Number(el.dataset.del), 1);
      albumIndex = -1;
      $('ga-detail').classList.add('hidden');
      renderAlbums();
      toast('已从列表移除，记得点保存');
    };
  });
}
function openAlbum(i) {
  albumIndex = i;
  const a = albums[i];
  $('ga-detail').classList.remove('hidden');
  $('ga-detail-title').textContent = '编辑：' + a.name;
  $('ga-id').value = a.id;
  $('ga-name').value = a.name;
  $('ga-desc').value = a.description || '';
  $('ga-location').value = a.location || '';
  $('ga-date').value = a.date || '';
  $('ga-tags').value = (a.tags || []).join(', ');
  $('ga-password').value = a.password || '';
  $('ga-password-hint').value = a.passwordHint || '';
  loadPhotos(a.id);
  loadUrls(a.id);
}
function bindAlbumFields() {
  if (albumIndex < 0) return;
  const a = albums[albumIndex];
  a.id = $('ga-id').value.trim() || a.id;
  a.name = $('ga-name').value.trim() || a.id;
  a.description = $('ga-desc').value.trim();
  a.location = $('ga-location').value.trim();
  a.date = $('ga-date').value.trim();
  a.tags = $('ga-tags').value.split(',').map((s) => s.trim()).filter(Boolean);
  a.password = $('ga-password').value.trim();
  a.passwordHint = $('ga-password-hint').value.trim();
}
async function loadPhotos(id) {
  const box = $('ga-photos');
  box.innerHTML = '<div class="muted" style="padding:8px">加载中…</div>';
  try {
    const data = await gh('GET', '/contents/public/gallery/' + id + '?ref=' + BRANCH);
    const files = data.filter((f) => f.type === 'file' && /\.(jpe?g|png|webp|avif|gif)$/i.test(f.name));
    if (!files.length) { box.innerHTML = '<div class="muted" style="padding:8px">暂无图片</div>'; return; }
    box.innerHTML = files.map((f) =>
      `<div class="item"><span>${f.name}</span>
       <span class="row" style="gap:8px"><span class="muted">${(f.size / 1024).toFixed(0)}KB</span>
       <span class="del" data-path="${f.path}" data-sha="${f.sha}">×</span></span></div>`).join('');
    box.querySelectorAll('[data-del]').forEach((el) => {
      el.onclick = async () => {
        if (!(await confirmBox('删除图片', `确定删除「${el.dataset.path}」？`))) return;
        try {
          await deleteFile(el.dataset.path, el.dataset.sha, 'admin: 删除相册图片');
          toast('已删除');
          loadPhotos(id);
        } catch (e) { toast('删除失败：' + e.message, 'error'); }
      };
    });
  } catch (e) {
    box.innerHTML = `<div class="muted" style="padding:8px">${e.message === 'Not Found' ? '暂无图片' : '加载失败：' + e.message}</div>`;
  }
}
async function loadUrls(id) {
  try {
    const { text } = await readFile('public/gallery/' + id + '/urls.txt');
    $('ga-urls').value = text.trim();
  } catch (_) { $('ga-urls').value = ''; }
}
async function saveUrls() {
  const album = albums[albumIndex];
  if (!album) return;
  const body = $('ga-urls').value.trim() + '\n';
  try {
    let sha;
    try { sha = (await readFile('public/gallery/' + album.id + '/urls.txt')).sha; } catch (_) { sha = undefined; }
    await writeFile('public/gallery/' + album.id + '/urls.txt', body, sha, 'admin: 更新相册外链');
    toast('urls.txt 已保存');
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}
async function saveGallery() {
  if (!TOKEN) return;
  bindAlbumFields();
  if (!albums.length) { toast('至少保留一个相册', 'error'); return; }
  const ids = new Set();
  for (const a of albums) {
    if (!/^[\w-]+$/.test(a.id)) { toast('相册 ID 只能用字母数字横线：' + a.id, 'error'); return; }
    if (ids.has(a.id)) { toast('相册 ID 重复：' + a.id, 'error'); return; }
    ids.add(a.id);
  }
  try {
    const ok = await patchConfig(GALLERY_PATH, [{
      re: /(\talbums: \[)[\s\S]*?(\n\t\],)/m,
      repl: () => genAlbumsBlock(albums),
      label: '相册列表',
    }], 'admin: 更新相册配置');
    if (ok) { toast('相册配置已保存'); loadGallery(); }
  } catch (e) { toast('保存失败：' + e.message, 'error'); }
}

/* ==========================================================================
   绑定
   ========================================================================== */
function bindPlus() {
  // Markdown 工具条
  const toolbar = $('md-toolbar');
  if (toolbar) {
    toolbar.querySelectorAll('[data-md]').forEach((btn) => {
      btn.onclick = () => applyMd(btn.dataset.md);
    });
    $('btn-insert-image').onclick = () => $('image-input').click();
    $('image-input').onchange = () => {
      const input = $('image-input');
      handlePostImages(input.files);
      input.value = '';
    };
    $('btn-insert-link').onclick = () => {
      const url = prompt('链接地址：', 'https://');
      if (!url) return;
      const text = prompt('显示文字：', url) || url;
      mdWrap($('f-markdown'), '[', '](' + url + ')', text);
    };
    $('btn-insert-video').onclick = () => {
      const url = prompt('视频地址（B站/YouTube 直接贴链接；mp4 直链会生成 video 标签）：', '');
      if (!url) return;
      if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
        mdBlock($('f-markdown'), `<video controls width="100%">\n  <source src="${url}">\n</video>`);
      } else {
        mdBlock($('f-markdown'), url);
      }
    };
  }

  // 动态
  $('btn-save-dynamic').onclick = saveDynamic;
  $('btn-now').onclick = () => { $('dy-time').value = fmtLocal(new Date()); };
  $('btn-clear-dynamic').onclick = newDynamic;
  $('btn-load-dynamic').onclick = loadDynamic;

  // 打赏
  $('btn-add-method').onclick = () => spMethodRow({ name: '', icon: 'fa7-brands:alipay', qrCode: '', link: '', description: '', enabled: true });
  $('btn-save-sponsor').onclick = saveSponsor;
  $('btn-reload-sponsor').onclick = loadSponsor;

  // 相册
  $('btn-add-album').onclick = () => {
    albums.push({ id: 'album-' + Date.now(), name: '新相册', description: '', location: '', date: '', tags: [], password: '', passwordHint: '' });
    albumIndex = albums.length - 1;
    renderAlbums();
    openAlbum(albumIndex);
    toast('已新建，记得点保存');
  };
  $('btn-reload-gallery').onclick = loadGallery;
  $('btn-save-gallery').onclick = saveGallery;
  $('btn-upload-photos').onclick = () => $('photo-input').click();
  $('photo-input').onchange = () => {
    const input = $('photo-input');
    handlePhotoUpload(input.files);
    input.value = '';
  };
  $('btn-refresh-photos').onclick = () => { if (albumIndex >= 0) loadPhotos(albums[albumIndex].id); };
  $('btn-save-urls').onclick = saveUrls;

  newDynamic();
}

// 注册标签页加载器（switchTab 会按名字查这个对象）
tabLoaders.dynamic = loadDynamic;
tabLoaders.sponsor = loadSponsor;
tabLoaders.gallery = loadGallery;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindPlus);
} else {
  bindPlus();
}
