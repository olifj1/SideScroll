(() => {
  'use strict';

  const VERSION = '1.0.57';
  const STORAGE_KEY = 'sidescroll-design-doc-working-v1';
  const BUNDLED_URL = `design-doc.json?v=${VERSION}`;
  const VALID_STATUSES = ['CURRENT', 'LOCKED', 'PROPOSED', 'OPEN', 'RETIRED'];
  const VALID_IMPLEMENTATION = ['CURRENT', 'PARTIAL', 'NEEDED', 'N/A'];

  const els = {
    sidebar: document.getElementById('dl-sidebar'),
    scrim: document.getElementById('dl-scrim'),
    tree: document.getElementById('dl-tree'),
    main: document.getElementById('dl-main'),
    document: document.getElementById('dl-document'),
    contentsToggle: document.getElementById('dl-contents-toggle'),
    closeSidebar: document.getElementById('dl-close-sidebar'),
    contentsHome: document.getElementById('dl-contents-home'),
    search: document.getElementById('dl-search'),
    edit: document.getElementById('dl-edit'),
    data: document.getElementById('dl-data'),
    dataMenu: document.getElementById('dl-data-menu'),
    export: document.getElementById('dl-export'),
    import: document.getElementById('dl-import'),
    importFile: document.getElementById('dl-import-file'),
    reset: document.getElementById('dl-reset'),
    saveState: document.getElementById('dl-save-state'),
    docVersion: document.getElementById('dl-doc-version'),
    buildVersion: document.getElementById('dl-build-version'),
    toast: document.getElementById('dl-toast')
  };

  let bundledDoc = null;
  let doc = null;
  let selectedId = '__contents__';
  let editing = false;
  let editSnapshot = null;
  let collapsed = new Set();
  let saveTimer = 0;
  let toastTimer = 0;

  const clone = value => JSON.parse(JSON.stringify(value));
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const normalise = value => String(value ?? '').toLowerCase().normalize('NFKD');

  function walkSections(sections = doc?.sections || [], parent = null, depth = 0, out = []) {
    sections.forEach((section, index) => {
      out.push({ section, parent, depth, index, siblings: sections });
      if (section.children?.length) walkSections(section.children, section, depth + 1, out);
    });
    return out;
  }

  function findEntry(id) {
    return walkSections().find(entry => entry.section.id === id) || null;
  }

  function findByTitle(title) {
    const key = normalise(title);
    return walkSections().find(entry => normalise(entry.section.title) === key)?.section || null;
  }

  function breadcrumbsFor(id) {
    const trail = [];
    const recurse = (sections, path = []) => {
      for (const section of sections) {
        const next = [...path, section];
        if (section.id === id) return next;
        const child = recurse(section.children || [], next);
        if (child) return child;
      }
      return null;
    };
    return recurse(doc.sections || [], []) || trail;
  }

  function saveNow(label = 'Saved on this device') {
    if (!doc) return;
    try {
      doc.workingUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
      if (els.saveState) els.saveState.textContent = label;
    } catch (error) {
      console.warn('Design Lab save failed', error);
      if (els.saveState) els.saveState.textContent = 'Could not save locally';
    }
  }

  function scheduleSave() {
    if (els.saveState) els.saveState.textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow(), 250);
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.hidden = false;
    toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2200);
  }

  function openSidebar() {
    els.sidebar.classList.add('open');
    els.scrim.hidden = false;
    els.contentsToggle?.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    els.sidebar.classList.remove('open');
    els.scrim.hidden = true;
    els.contentsToggle?.setAttribute('aria-expanded', 'false');
  }

  function closeDataMenu() {
    els.dataMenu.hidden = true;
    els.data?.setAttribute('aria-expanded', 'false');
  }

  function statusBadge(status) {
    const safe = VALID_STATUSES.includes(status) ? status : 'CURRENT';
    return `<span class="dl-badge status-${safe}">${escapeHtml(safe)}</span>`;
  }

  function implementationBadge(value) {
    if (!value || value === 'N/A') return '';
    return `<span class="dl-badge">ENGINE · ${escapeHtml(value)}</span>`;
  }

  function inlineMarkup(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const target = findByTitle(title);
      return target ? `<button class="dl-inline-link" data-open-id="${escapeHtml(target.id)}">${escapeHtml(title)}</button>` : escapeHtml(title);
    });
    return html;
  }

  function markdownToHtml(source) {
    const lines = String(source || '').replace(/\r/g, '').split('\n');
    const out = [];
    let paragraph = [];
    let listType = null;
    let listItems = [];

    const flushParagraph = () => {
      if (!paragraph.length) return;
      out.push(`<p>${inlineMarkup(paragraph.join(' '))}</p>`);
      paragraph = [];
    };
    const flushList = () => {
      if (!listType) return;
      const tag = listType === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag}>${listItems.join('')}</${tag}>`);
      listType = null;
      listItems = [];
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) { flushParagraph(); flushList(); return; }
      const heading = trimmed.match(/^(#{2,3})\s+(.+)$/);
      if (heading) {
        flushParagraph(); flushList();
        const level = heading[1].length;
        out.push(`<h${level}>${inlineMarkup(heading[2])}</h${level}>`);
        return;
      }
      const task = trimmed.match(/^-\s+\[([ xX])\]\s+(.+)$/);
      if (task) {
        flushParagraph();
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(`<li class="dl-check${task[1].toLowerCase() === 'x' ? ' checked' : ''}">${inlineMarkup(task[2])}</li>`);
        return;
      }
      const bullet = trimmed.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        flushParagraph();
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listItems.push(`<li>${inlineMarkup(bullet[1])}</li>`);
        return;
      }
      const numbered = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (numbered) {
        flushParagraph();
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listItems.push(`<li>${inlineMarkup(numbered[1])}</li>`);
        return;
      }
      flushList();
      paragraph.push(trimmed);
    });
    flushParagraph();
    flushList();
    return out.join('');
  }

  function renderTree() {
    const query = normalise(els.search.value.trim());
    const all = walkSections();
    if (query) {
      const matches = all.filter(({ section }) => normalise([section.title, section.body, ...(section.tags || [])].join(' ')).includes(query));
      els.tree.innerHTML = matches.length ? matches.map(({ section, depth }) => `
        <div class="dl-tree-row dl-tree-depth-${Math.min(depth,2)}">
          <span class="dl-tree-toggle placeholder"></span>
          <button class="dl-tree-link${selectedId === section.id ? ' active' : ''}" type="button" data-open-id="${escapeHtml(section.id)}">
            <span class="dl-tree-status" data-status="${escapeHtml(section.status)}"></span><span>${escapeHtml(section.title)}</span>
          </button>
        </div>`).join('') : '<div class="dl-tree-empty">No matching design entries.</div>';
      return;
    }

    const renderNodes = (sections, depth = 0) => sections.map(section => {
      const hasChildren = !!section.children?.length;
      const isCollapsed = collapsed.has(section.id);
      return `<div class="dl-tree-group dl-tree-depth-${Math.min(depth,2)}">
        <div class="dl-tree-row">
          ${hasChildren ? `<button class="dl-tree-toggle" type="button" data-toggle-id="${escapeHtml(section.id)}" aria-label="${isCollapsed ? 'Expand' : 'Collapse'} ${escapeHtml(section.title)}">${isCollapsed ? '›' : '⌄'}</button>` : '<span class="dl-tree-toggle placeholder"></span>'}
          <button class="dl-tree-link${selectedId === section.id ? ' active' : ''}" type="button" data-open-id="${escapeHtml(section.id)}">
            <span class="dl-tree-status" data-status="${escapeHtml(section.status)}"></span><span>${escapeHtml(section.title)}</span>
          </button>
        </div>
        ${hasChildren && !isCollapsed ? renderNodes(section.children, depth + 1) : ''}
      </div>`;
    }).join('');
    els.tree.innerHTML = renderNodes(doc.sections || []);
  }

  function renderOverview() {
    const all = walkSections().map(entry => entry.section);
    const counts = VALID_STATUSES.reduce((acc, status) => (acc[status] = all.filter(s => s.status === status).length, acc), {});
    const openCount = counts.OPEN || 0;
    els.document.innerHTML = `
      <p class="dl-kicker">${escapeHtml(doc.project)} · GDD ${escapeHtml(doc.documentVersion)}</p>
      <h1>${escapeHtml(doc.title)}</h1>
      <p class="dl-overview-lead">${escapeHtml(doc.description)}</p>
      <div class="dl-meta">
        <span class="dl-badge">BASELINE · ${escapeHtml(doc.baselineBuild)}</span>
        <span class="dl-badge">UPDATED · ${escapeHtml(doc.updated)}</span>
      </div>
      <div class="dl-stat-grid">
        <div class="dl-stat"><b>${all.length}</b><span>Entries</span></div>
        <div class="dl-stat"><b>${doc.sections.length}</b><span>Main sections</span></div>
        <div class="dl-stat"><b>${openCount}</b><span>Open decisions</span></div>
        <div class="dl-stat"><b>${all.filter(s => s.implementation === 'NEEDED').length}</b><span>Engine needs</span></div>
      </div>
      <h2>Contents</h2>
      <div class="dl-overview-list">
        ${doc.sections.map(section => `<button class="dl-overview-card" type="button" data-open-id="${escapeHtml(section.id)}"><strong>${escapeHtml(section.title)}</strong><small>${escapeHtml((section.body || '').replace(/[#*\n]/g,' ').replace(/\s+/g,' ').slice(0,110))}${(section.body || '').length > 110 ? '…' : ''}</small></button>`).join('')}
      </div>`;
    els.edit.hidden = true;
  }

  function renderSection(section) {
    const trail = breadcrumbsFor(section.id);
    const tags = (section.tags || []).map(tag => `<span class="dl-badge">#${escapeHtml(tag)}</span>`).join('');
    const related = (section.related || []).map(id => findEntry(id)?.section).filter(Boolean);
    els.document.innerHTML = `
      <div class="dl-breadcrumbs"><button type="button" data-open-id="__contents__">Overview</button>${trail.map((item, i) => `${i ? '<span>/</span>' : '<span>/</span>'}<button type="button" data-open-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`).join('')}</div>
      <p class="dl-kicker">Design document entry</p>
      <h1>${escapeHtml(section.title)}</h1>
      <div class="dl-meta">${statusBadge(section.status)}${implementationBadge(section.implementation)}${tags}</div>
      <div class="dl-body-copy">${markdownToHtml(section.body)}</div>
      ${related.length ? `<div class="dl-related"><strong>Related entries</strong><div class="dl-related-links">${related.map(item => `<button type="button" data-open-id="${escapeHtml(item.id)}">${escapeHtml(item.title)}</button>`).join('')}</div></div>` : ''}
      ${section.children?.length ? `<div class="dl-children"><h2>In this section</h2>${section.children.map(child => `<button class="dl-child-card" type="button" data-open-id="${escapeHtml(child.id)}"><strong>${escapeHtml(child.title)}</strong><small>${escapeHtml(child.status)}${child.implementation && child.implementation !== 'N/A' ? ` · engine ${escapeHtml(child.implementation.toLowerCase())}` : ''}</small></button>`).join('')}</div>` : ''}`;
    els.edit.hidden = false;
    els.edit.textContent = 'Edit';
  }

  function render() {
    if (!doc) return;
    renderTree();
    if (selectedId === '__contents__') renderOverview();
    else {
      const entry = findEntry(selectedId);
      if (!entry) { selectedId = '__contents__'; renderOverview(); }
      else renderSection(entry.section);
    }
    if (els.docVersion) els.docVersion.textContent = `GDD ${doc.documentVersion}`;
    if (els.buildVersion) els.buildVersion.textContent = `Build ${doc.baselineBuild}`;
    els.main.scrollTop = 0;
  }

  function selectSection(id) {
    if (editing) exitEdit(false);
    selectedId = id;
    render();
    if (matchMedia('(max-width:760px)').matches) closeSidebar();
  }

  function setSectionFromForm(section) {
    section.title = document.getElementById('dl-edit-title').value.trim() || 'Untitled section';
    section.status = document.getElementById('dl-edit-status').value;
    section.implementation = document.getElementById('dl-edit-implementation').value;
    section.tags = document.getElementById('dl-edit-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    section.body = document.getElementById('dl-edit-body').value;
  }

  function enterEdit() {
    const entry = findEntry(selectedId);
    if (!entry || editing) return;
    const section = entry.section;
    editing = true;
    editSnapshot = clone(section);
    els.edit.textContent = 'Done';
    els.document.innerHTML = `
      <p class="dl-kicker">Editing design entry</p>
      <div class="dl-edit-form">
        <div class="dl-field"><label for="dl-edit-title">Title</label><input id="dl-edit-title" value="${escapeHtml(section.title)}"></div>
        <div class="dl-edit-row">
          <div class="dl-field"><label for="dl-edit-status">Design status</label><select id="dl-edit-status">${VALID_STATUSES.map(v => `<option${section.status === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="dl-field"><label for="dl-edit-implementation">Engine support</label><select id="dl-edit-implementation">${VALID_IMPLEMENTATION.map(v => `<option${section.implementation === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
        </div>
        <div class="dl-field"><label for="dl-edit-tags">Tags · comma separated</label><input id="dl-edit-tags" value="${escapeHtml((section.tags || []).join(', '))}"></div>
        <div class="dl-field">
          <label for="dl-edit-body">Document text</label>
          <div class="dl-formatbar">
            <button type="button" data-format="heading">Heading</button>
            <button type="button" data-format="bold">Bold</button>
            <button type="button" data-format="bullet">Bullet</button>
            <button type="button" data-format="number">Number</button>
            <button type="button" data-format="check">Checkbox</button>
          </div>
          <textarea class="dl-editor" id="dl-edit-body" spellcheck="true">${escapeHtml(section.body)}</textarea>
        </div>
        <p class="dl-edit-note">Changes autosave on this device as you type. Use Data → Export / Share design data to carry them into another build or send them back with the project.</p>
        <div class="dl-edit-actions">
          <button class="primary" type="button" id="dl-edit-save">Done</button>
          <button type="button" id="dl-add-child">Add subsection</button>
          <button type="button" id="dl-add-root">Add main section</button>
          <button type="button" id="dl-move-up">Move up</button>
          <button type="button" id="dl-move-down">Move down</button>
          <button type="button" id="dl-edit-cancel">Cancel changes</button>
          <button class="danger" type="button" id="dl-delete-section">Delete</button>
        </div>
      </div>`;

    const sync = () => { setSectionFromForm(section); scheduleSave(); renderTree(); };
    ['dl-edit-title','dl-edit-status','dl-edit-implementation','dl-edit-tags','dl-edit-body'].forEach(id => document.getElementById(id)?.addEventListener('input', sync));
    document.getElementById('dl-edit-save')?.addEventListener('click', () => exitEdit(true));
    document.getElementById('dl-edit-cancel')?.addEventListener('click', () => exitEdit(false));
    document.getElementById('dl-add-child')?.addEventListener('click', () => { sync(); addSection(section.id); });
    document.getElementById('dl-add-root')?.addEventListener('click', () => { sync(); addSection(null); });
    document.getElementById('dl-move-up')?.addEventListener('click', () => { sync(); moveSection(-1); });
    document.getElementById('dl-move-down')?.addEventListener('click', () => { sync(); moveSection(1); });
    document.getElementById('dl-delete-section')?.addEventListener('click', () => deleteSection());
    els.document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => applyFormat(button.dataset.format)));
  }

  function exitEdit(commit) {
    if (!editing) return;
    const entry = findEntry(selectedId);
    if (entry && !commit && editSnapshot) Object.assign(entry.section, clone(editSnapshot));
    if (entry && commit) setSectionFromForm(entry.section);
    editing = false;
    editSnapshot = null;
    saveNow(commit ? 'Saved on this device' : 'Changes cancelled');
    render();
  }

  function applyFormat(kind) {
    const ta = document.getElementById('dl-edit-body');
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = ta.value.slice(start, end);
    let before = '', after = '', replacement = selected;
    if (kind === 'bold') { before = '**'; after = '**'; replacement ||= 'text'; }
    if (kind === 'heading') { before = '## '; replacement ||= 'Heading'; }
    if (kind === 'bullet') { before = '- '; replacement ||= 'Item'; }
    if (kind === 'number') { before = '1. '; replacement ||= 'Item'; }
    if (kind === 'check') { before = '- [ ] '; replacement ||= 'Task'; }
    const insert = before + replacement + after;
    ta.setRangeText(insert, start, end, 'end');
    ta.dispatchEvent(new Event('input', { bubbles:true }));
    ta.focus();
  }

  function uniqueId(title = 'section') {
    const base = normalise(title).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,36) || 'section';
    const ids = new Set(walkSections().map(e => e.section.id));
    let id = base, n = 2;
    while (ids.has(id)) id = `${base}-${n++}`;
    return id;
  }

  function addSection(parentId) {
    const section = { id: uniqueId('new-section'), title:'New section', status:'OPEN', implementation:'N/A', tags:[], body:'Add design notes here.', children:[], related:[] };
    if (parentId) {
      const parent = findEntry(parentId)?.section;
      if (!parent) return;
      parent.children ||= [];
      parent.children.push(section);
      collapsed.delete(parentId);
    } else doc.sections.push(section);
    editing = false;
    editSnapshot = null;
    selectedId = section.id;
    saveNow();
    render();
    enterEdit();
  }

  function moveSection(delta) {
    const entry = findEntry(selectedId);
    if (!entry) return;
    const next = entry.index + delta;
    if (next < 0 || next >= entry.siblings.length) { showToast(delta < 0 ? 'Already first in this section' : 'Already last in this section'); return; }
    const [item] = entry.siblings.splice(entry.index,1);
    entry.siblings.splice(next,0,item);
    saveNow();
    renderTree();
    showToast('Section reordered');
  }

  function deleteSection() {
    const entry = findEntry(selectedId);
    if (!entry) return;
    if (!confirm(`Delete “${entry.section.title}”${entry.section.children?.length ? ' and all of its subsections' : ''}?`)) return;
    entry.siblings.splice(entry.index,1);
    editing = false;
    editSnapshot = null;
    selectedId = '__contents__';
    saveNow();
    render();
    showToast('Section deleted');
  }

  async function exportDoc() {
    if (editing) {
      const entry = findEntry(selectedId);
      if (entry) setSectionFromForm(entry.section);
      saveNow();
    }
    const name = `SideScroll-design-doc-v${doc.documentVersion}.json`;
    const text = JSON.stringify(doc, null, 2) + '\n';
    const file = new File([text], name, { type:'application/json' });
    try {
      if (navigator.share && navigator.canShare?.({ files:[file] })) {
        await navigator.share({ title:'SideScroll Design Lab', text:'SideScroll living game design data', files:[file] });
        showToast('Design data shared');
        closeDataMenu();
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Design data exported');
    closeDataMenu();
  }

  async function importDoc(file) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.sections)) throw new Error('Unsupported design data');
      if (!confirm(`Replace the working Design Lab document with “${parsed.title || file.name}”?`)) return;
      doc = parsed;
      selectedId = '__contents__';
      editing = false;
      saveNow('Imported design data');
      render();
      showToast('Design data imported');
      closeDataMenu();
    } catch (error) {
      console.warn(error);
      alert('That file is not valid SideScroll Design Lab data.');
    } finally {
      els.importFile.value = '';
    }
  }

  function resetBundled() {
    if (!confirm('Reset Design Lab to the version bundled with this SideScroll build? Local edits will be replaced.')) return;
    doc = clone(bundledDoc);
    selectedId = '__contents__';
    editing = false;
    localStorage.removeItem(STORAGE_KEY);
    saveNow('Reset to bundled document');
    render();
    showToast('Bundled document restored');
    closeDataMenu();
  }

  function bindEvents() {
    els.contentsToggle?.addEventListener('click', openSidebar);
    els.closeSidebar?.addEventListener('click', closeSidebar);
    els.scrim?.addEventListener('click', closeSidebar);
    els.contentsHome?.addEventListener('click', () => selectSection('__contents__'));
    els.search?.addEventListener('input', renderTree);
    els.edit?.addEventListener('click', () => editing ? exitEdit(true) : enterEdit());
    els.data?.addEventListener('click', event => {
      event.stopPropagation();
      const open = els.dataMenu.hidden;
      els.dataMenu.hidden = !open;
      els.data.setAttribute('aria-expanded', String(open));
    });
    els.dataMenu?.addEventListener('click', event => event.stopPropagation());
    document.addEventListener('pointerdown', event => { if (!els.dataMenu.hidden && !els.dataMenu.contains(event.target) && event.target !== els.data) closeDataMenu(); });
    els.export?.addEventListener('click', exportDoc);
    els.import?.addEventListener('click', () => els.importFile.click());
    els.importFile?.addEventListener('change', () => { const file = els.importFile.files?.[0]; if (file) importDoc(file); });
    els.reset?.addEventListener('click', resetBundled);

    document.addEventListener('click', event => {
      const open = event.target.closest('[data-open-id]');
      if (open) { selectSection(open.dataset.openId); return; }
      const toggle = event.target.closest('[data-toggle-id]');
      if (toggle) {
        const id = toggle.dataset.toggleId;
        if (collapsed.has(id)) collapsed.delete(id); else collapsed.add(id);
        renderTree();
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') { closeDataMenu(); closeSidebar(); }
    });
  }

  async function init() {
    bindEvents();
    try {
      const response = await fetch(BUNDLED_URL, { cache:'no-store', credentials:'same-origin' });
      if (!response.ok) throw new Error(`Design data ${response.status}`);
      bundledDoc = await response.json();
      let working = null;
      try { working = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) {}
      doc = working?.schemaVersion === bundledDoc.schemaVersion && Array.isArray(working.sections) ? working : clone(bundledDoc);
      if (!working) saveNow('Bundled document ready');
      else if (els.saveState) els.saveState.textContent = 'Working document loaded';
      render();
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
    } catch (error) {
      console.error(error);
      els.document.innerHTML = '<p class="dl-kicker">Design Lab</p><h1>Design data could not be loaded.</h1><p>Reload the page while online once so the bundled design document can be cached.</p>';
      if (els.saveState) els.saveState.textContent = 'Design data unavailable';
    }
  }

  init();
})();
