/* Admin panel: sign-in, dashboard, and a config-driven add/edit/delete view for every collection. */
(() => {
  const { ADMIN, Store, esc, slugify, fmtDate, todayISO, imgSrc } = DTC;
  const $ = (sel, root = document) => root.querySelector(sel);
  const SESSION_KEY = 'dtc_admin_session';

  const loginEl = $('#login'), adminEl = $('#admin'), view = $('#view'), dlg = $('#dlg');

  /* ---------- Lookups ---------- */
  const options = (collection, label) => () => Store.get(collection).map((r) => ({ value: r.id, label: r[label] }));
  const lookup = (collection, id, label, fallback = '—') => Store.get(collection).find((r) => r.id === id)?.[label] || fallback;
  const truncate = (s = '', n = 80) => (s.length > n ? `${esc(s.slice(0, n))}…` : esc(s));
  const yesNo = (v, no = 'No') => (v ? 'Yes' : no);
  const thumb = (url) => (url ? `<img class="thumb" src="${esc(imgSrc(url))}" alt="">` : '');

  // Gives each item a URL-safe slug that is unique within its collection.
  const uniqueSlug = (field, fallback) => (item, all) => {
    const taken = new Set(all.filter((r) => r.id !== item.id).map((r) => r.slug));
    const base = slugify(item[field]) || fallback;
    let slug = base, n = 2;
    while (taken.has(slug)) slug = `${base}-${n++}`;
    item.slug = slug;
  };

  /* ---------- Resource definitions ----------
   * intro      one-line help shown under the title
   * columns    table columns: { label, cell(row) -> HTML string }
   * fields     form inputs: { name, label, type, required?, options?, blank?, maxlength?, default?, help? }
   *            types: text, textarea, number, date, url, select, checkbox, image
   * details    optional read-only [label, value] pairs shown above the form
   * canCreate  false for data submitted by visitors
   * beforeSave(item, all)   adjust an item before it is stored
   * canDelete(row)          return an error message to block deletion
   * afterDelete(row)        clean up references */
  const resources = {
    courses: {
      group: 'Content', title: 'Courses', singular: 'course', sort: (a, b) => a.title.localeCompare(b.title),
      intro: 'Published courses appear on the website straight away. Tick “Show in upcoming courses” and set a start date to list a course as an upcoming intake.',
      columns: [
        { label: '', cell: (r) => thumb(r.image) },
        { label: 'Title', cell: (r) => esc(r.title) },
        { label: 'Category', cell: (r) => esc(lookup('categories', r.categoryId, 'name')) },
        { label: 'Duration', cell: (r) => esc(r.duration) },
        { label: 'Starts', cell: (r) => fmtDate(r.startDate) },
        { label: 'Upcoming', cell: (r) => yesNo(r.upcoming) },
        { label: 'Published', cell: (r) => yesNo(r.published, 'Hidden') },
      ],
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'categoryId', label: 'Category', type: 'select', required: true, options: options('categories', 'name'), help: 'Add new categories under Content → Categories.' },
        { name: 'summary', label: 'Short summary (max 280 characters)', type: 'text', maxlength: 280 },
        { name: 'description', label: 'Description', type: 'textarea', help: 'Press Enter to start a new paragraph.' },
        { name: 'syllabus', label: 'What students will learn', type: 'textarea', help: 'One topic per line. Shown as a list on the course page.' },
        { name: 'duration', label: 'Duration (e.g. 110 hrs)', type: 'text' },
        { name: 'level', label: 'Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'], blank: 'Not specified' },
        { name: 'mode', label: 'Mode', type: 'select', options: ['Physical', 'Online', 'Hybrid'], blank: 'Not specified' },
        { name: 'instructorId', label: 'Instructor', type: 'select', options: options('instructors', 'name'), blank: 'To be announced', help: 'Add people under Content → Instructors.' },
        { name: 'startDate', label: 'Start date', type: 'date' },
        { name: 'price', label: 'Fee (NPR)', type: 'number', help: 'Leave empty to show “Contact us for fees”.' },
        { name: 'image', label: 'Course image', type: 'image' },
        { name: 'upcoming', label: 'Show in upcoming courses', type: 'checkbox' },
        { name: 'published', label: 'Visible on the website', type: 'checkbox', default: true },
      ],
      beforeSave: uniqueSlug('title', 'course'),
    },

    categories: {
      group: 'Content', title: 'Categories', singular: 'category', sort: (a, b) => a.name.localeCompare(b.name),
      intro: 'Categories group courses on the website. A category with courses in it cannot be deleted.',
      columns: [
        { label: 'Name', cell: (r) => esc(r.name) },
        { label: 'Courses', cell: (r) => Store.get('courses').filter((c) => c.categoryId === r.id).length },
      ],
      fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
      canDelete: (r) => (Store.get('courses').some((c) => c.categoryId === r.id) ? 'This category still has courses. Move or delete them first.' : ''),
    },

    instructors: {
      group: 'Content', title: 'Instructors', singular: 'instructor', sort: (a, b) => a.name.localeCompare(b.name),
      intro: 'Instructors appear on the Instructors page and can be linked to courses. The menu link shows up once you add the first one.',
      columns: [
        { label: '', cell: (r) => thumb(r.image) },
        { label: 'Name', cell: (r) => esc(r.name) },
        { label: 'Role', cell: (r) => esc(r.role) },
        { label: 'Courses', cell: (r) => Store.get('courses').filter((c) => c.instructorId === r.id).length },
      ],
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'role', label: 'Role or title', type: 'text' },
        { name: 'bio', label: 'Short bio', type: 'textarea' },
        { name: 'image', label: 'Photo', type: 'image' },
        { name: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      ],
      afterDelete: (r) => Store.get('courses').filter((c) => c.instructorId === r.id).forEach((c) => Store.update('courses', c.id, { instructorId: '' })),
    },

    events: {
      group: 'Content', title: 'Events', singular: 'event', sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      intro: 'Workshops, seminars and open days. Past events move to a “Past events” list automatically.',
      columns: [
        { label: 'Title', cell: (r) => esc(r.title) },
        { label: 'Type', cell: (r) => esc(r.type) },
        { label: 'Date', cell: (r) => fmtDate(r.date) },
        { label: 'Location', cell: (r) => esc(r.location) },
        { label: 'Published', cell: (r) => yesNo(r.published, 'Hidden') },
      ],
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'type', label: 'Type', type: 'select', options: ['Workshop', 'Seminar', 'Webinar', 'Open day', 'Other'], default: 'Workshop' },
        { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO },
        { name: 'time', label: 'Time (e.g. 10:00 AM – 1:00 PM)', type: 'text' },
        { name: 'location', label: 'Location or platform', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'link', label: 'Registration link', type: 'url', help: 'Optional. Starts with https://' },
        { name: 'published', label: 'Visible on the website', type: 'checkbox', default: true },
      ],
    },

    posts: {
      group: 'Content', title: 'Blog posts', singular: 'post', sort: (a, b) => String(b.date).localeCompare(String(a.date)),
      intro: 'News and articles. The Blog menu link shows up once you publish the first post.',
      columns: [
        { label: '', cell: (r) => thumb(r.image) },
        { label: 'Title', cell: (r) => esc(r.title) },
        { label: 'Date', cell: (r) => fmtDate(r.date) },
        { label: 'Author', cell: (r) => esc(r.author) },
        { label: 'Published', cell: (r) => yesNo(r.published, 'Draft') },
      ],
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'date', label: 'Date', type: 'date', required: true, default: todayISO },
        { name: 'author', label: 'Author', type: 'text' },
        { name: 'excerpt', label: 'Short excerpt (max 280 characters)', type: 'text', maxlength: 280 },
        { name: 'content', label: 'Content', type: 'textarea', help: 'Press Enter to start a new paragraph.' },
        { name: 'image', label: 'Cover image', type: 'image' },
        { name: 'published', label: 'Published (untick to keep as a draft)', type: 'checkbox', default: true },
      ],
      beforeSave: uniqueSlug('title', 'post'),
    },

    testimonials: {
      group: 'Social proof', title: 'Testimonials', singular: 'testimonial',
      intro: 'Student feedback shown on the home page.',
      columns: [{ label: 'Name', cell: (r) => esc(r.name) }, { label: 'Role', cell: (r) => esc(r.role) }, { label: 'Message', cell: (r) => truncate(r.message) }],
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'role', label: 'Role or course', type: 'text' },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ],
    },

    partners: {
      group: 'Social proof', title: 'Partners', singular: 'partner', sort: (a, b) => a.name.localeCompare(b.name),
      intro: 'Companies shown under “Where our graduates work”. Only “placement” partners appear on the home page. Without a logo, the name is shown.',
      columns: [{ label: '', cell: (r) => thumb(r.logo) }, { label: 'Name', cell: (r) => esc(r.name) }, { label: 'Type', cell: (r) => esc(r.kind) }],
      fields: [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'kind', label: 'Type', type: 'select', options: ['placement', 'client', 'college'], default: 'placement' },
        { name: 'logo', label: 'Logo', type: 'image' },
      ],
    },

    registrations: {
      group: 'Inbox', title: 'Registrations', singular: 'registration', canCreate: false,
      sort: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      intro: 'Course sign-ups from the website. Open one to confirm or cancel it.',
      columns: [
        { label: 'Name', cell: (r) => esc(r.fullName) },
        { label: 'Course', cell: (r) => esc(lookup('courses', r.courseId, 'title', '(deleted course)')) },
        { label: 'Phone', cell: (r) => esc(r.phone) },
        { label: 'Schedule', cell: (r) => esc(r.schedule) },
        { label: 'Payment', cell: (r) => esc(r.paymentOption) },
        { label: 'Received', cell: (r) => fmtDate(r.createdAt) },
        { label: 'Status', cell: (r) => esc(r.status) },
      ],
      details: (r) => [['Name', r.fullName], ['Course', lookup('courses', r.courseId, 'title', '(deleted course)')], ['Phone', r.phone], ['Email', r.email], ['Schedule', r.schedule], ['Payment', r.paymentOption], ['Received', fmtDate(r.createdAt)]],
      fields: [{ name: 'status', label: 'Status', type: 'select', options: ['Pending', 'Confirmed', 'Cancelled'] }],
    },

    messages: {
      group: 'Inbox', title: 'Messages', singular: 'message', canCreate: false,
      sort: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      intro: 'Messages sent from the contact form.',
      columns: [
        { label: 'From', cell: (r) => esc(r.name) },
        { label: 'Email', cell: (r) => esc(r.email) },
        { label: 'Subject', cell: (r) => esc(r.subject) },
        { label: 'Message', cell: (r) => truncate(r.message) },
        { label: 'Received', cell: (r) => fmtDate(r.createdAt) },
        { label: 'Read', cell: (r) => yesNo(r.isRead, 'New') },
      ],
      details: (r) => [['From', r.name], ['Email', r.email], ['Phone', r.phone], ['Subject', r.subject], ['Message', r.message]],
      fields: [{ name: 'isRead', label: 'Mark as read', type: 'checkbox' }],
    },
  };

  const pendingCount = () => Store.get('registrations').filter((r) => r.status === 'Pending').length;
  const unreadCount = () => Store.get('messages').filter((m) => !m.isRead).length;

  /* ---------- Auth ---------- */
  const isAuthed = () => sessionStorage.getItem(SESSION_KEY) === '1';

  $('#login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    if (email.trim().toLowerCase() === ADMIN.email && password === ADMIN.password) {
      sessionStorage.setItem(SESSION_KEY, '1');
      route();
    } else {
      const err = $('#login-error');
      err.textContent = 'Email or password is incorrect.';
      err.hidden = false;
    }
  });

  $('#logout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    route();
  });

  /* ---------- Routing: #dashboard, #courses, #courses/new ---------- */
  function renderNav(active) {
    const badge = { registrations: pendingCount(), messages: unreadCount() };
    const link = (key, label) =>
      `<a href="#${key}" class="${key === active ? 'active' : ''}">${esc(label)}${badge[key] ? `<span class="count">${badge[key]}</span>` : ''}</a>`;
    const groups = [...new Set(Object.values(resources).map((r) => r.group))];

    $('#admin-nav').innerHTML =
      link('dashboard', 'Dashboard') +
      groups.map((g) => `<h2>${esc(g)}</h2>` + Object.entries(resources).filter(([, r]) => r.group === g).map(([k, r]) => link(k, r.title)).join('')).join('');
  }

  function route() {
    const authed = isAuthed();
    loginEl.hidden = authed;
    adminEl.hidden = !authed;
    if (!authed) return;

    const [key, action] = (location.hash.slice(1) || 'dashboard').split('/');
    renderNav(resources[key] ? key : 'dashboard');

    if (resources[key]) {
      renderResource(key);
      if (action === 'new' && resources[key].canCreate !== false) openEditor(key, null);
    } else {
      renderDashboard();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Dashboard ---------- */
  function renderDashboard() {
    const upcomingEvents = Store.get('events').filter((e) => e.date >= todayISO()).length;
    const tiles = [
      ['Courses', Store.get('courses').length, 'courses'],
      ['Upcoming intakes', Store.get('courses').filter((c) => c.upcoming).length, 'courses'],
      ['Instructors', Store.get('instructors').length, 'instructors'],
      ['Upcoming events', upcomingEvents, 'events'],
      ['Blog posts', Store.get('posts').length, 'posts'],
      ['Awaiting confirmation', pendingCount(), 'registrations'],
      ['Unread messages', unreadCount(), 'messages'],
    ];
    const quick = [['courses', 'Add a course'], ['instructors', 'Add an instructor'], ['events', 'Add an event'], ['posts', 'Write a blog post'], ['testimonials', 'Add a testimonial']];
    const recent = [...Store.get('registrations')].sort(resources.registrations.sort).slice(0, 5);

    view.innerHTML = `
      <h1>Dashboard</h1>
      <p class="notice">Changes are saved in this browser only. Registrations and messages sent from the public pages are also stored here, so they only show up on the device where they were submitted. Use <strong>Download backup</strong> to keep a copy.</p>
      <h2>Quick add</h2>
      <div class="quick">${quick.map(([k, label]) => `<a class="btn btn--small" href="#${k}/new">${esc(label)}</a>`).join('')}</div>
      <div class="tiles">${tiles.map(([label, n, to]) => `<a class="tile" href="#${to}"><strong>${n}</strong><span>${esc(label)}</span></a>`).join('')}</div>
      <h2>Latest registrations</h2>
      ${recent.length ? `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Course</th><th>Received</th><th>Status</th></tr></thead><tbody>
        ${recent.map((r) => `<tr><td>${esc(r.fullName)}</td><td>${esc(lookup('courses', r.courseId, 'title', '(deleted course)'))}</td><td>${fmtDate(r.createdAt)}</td><td>${esc(r.status)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p>No registrations yet. They will appear here as visitors enroll.</p>'}
      <div class="admin__tools">
        <button class="btn btn--ghost" id="backup">Download backup</button>
        <button class="btn btn--ghost" id="reset">Reset to starter content</button>
      </div>`;

    $('#backup').addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([Store.export()], { type: 'application/json' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: `deerwalk-backup-${todayISO()}.json` });
      a.click();
      URL.revokeObjectURL(url);
    });
    $('#reset').addEventListener('click', () => {
      if (confirm('Replace all content, registrations and messages with the starter content? This cannot be undone.')) {
        Store.reset();
        route();
      }
    });
  }

  /* ---------- Generic list view ---------- */
  function renderResource(key) {
    const cfg = resources[key];
    const canCreate = cfg.canCreate !== false;
    const plural = cfg.title.toLowerCase();

    view.innerHTML = `
      <div class="admin__head">
        <h1>${esc(cfg.title)}</h1>
        ${canCreate ? `<button class="btn" id="add">Add ${esc(cfg.singular)}</button>` : ''}
      </div>
      <p class="help">${esc(cfg.intro || '')}</p>
      <input class="admin__search" type="search" id="search" placeholder="Search ${esc(plural)}" aria-label="Search ${esc(cfg.title)}">
      <p class="alert alert--error" id="action-error" role="alert" hidden></p>
      <div id="table"></div>`;

    const drawTable = () => {
      const term = $('#search').value.trim().toLowerCase();
      let rows = [...Store.get(key)];
      if (cfg.sort) rows.sort(cfg.sort);
      if (term) rows = rows.filter((r) => JSON.stringify({ ...r, image: '', logo: '' }).toLowerCase().includes(term));

      if (!rows.length) {
        $('#table').innerHTML = `<p>${term ? 'Nothing matches that search.' : canCreate ? `No ${esc(plural)} yet. Use “Add ${esc(cfg.singular)}” to create the first one.` : `No ${esc(plural)} yet.`}</p>`;
        return;
      }
      $('#table').innerHTML = `<div class="table-wrap"><table>
        <thead><tr>${cfg.columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}<th><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>${rows.map((r) => `<tr>${cfg.columns.map((c) => `<td>${c.cell(r)}</td>`).join('')}
          <td class="row-actions"><button class="link-btn" data-edit="${esc(r.id)}">Edit</button><button class="link-btn link-btn--danger" data-delete="${esc(r.id)}">Delete</button></td></tr>`).join('')}
        </tbody></table></div>`;
    };

    $('#search').addEventListener('input', drawTable);
    $('#add')?.addEventListener('click', () => openEditor(key, null));

    $('#table').addEventListener('click', (e) => {
      const editId = e.target.dataset.edit, delId = e.target.dataset.delete;
      if (editId) return openEditor(key, Store.get(key).find((r) => r.id === editId));
      if (!delId) return;

      const row = Store.get(key).find((r) => r.id === delId);
      const blocked = cfg.canDelete?.(row);
      const err = $('#action-error');
      err.hidden = !blocked;
      err.textContent = blocked || '';
      if (blocked) return;
      if (confirm(`Delete this ${cfg.singular}? This can't be undone.`)) {
        Store.remove(key, delId);
        cfg.afterDelete?.(row);
        drawTable();
        renderNav(key);
      }
    });

    drawTable();
  }

  /* ---------- Editor dialog ---------- */
  function fieldHTML(f, value) {
    const fallback = typeof f.default === 'function' ? f.default() : f.default;
    const v = value ?? fallback ?? '';
    const attrs = `name="${f.name}" ${f.required ? 'required' : ''}`;
    const help = f.help ? `<span class="field__help">${esc(f.help)}</span>` : '';

    if (f.type === 'checkbox') {
      return `<label class="field field--check"><input type="checkbox" ${attrs} ${v ? 'checked' : ''}><span class="field__label">${esc(f.label)}</span></label>`;
    }
    if (f.type === 'image') {
      return `<div class="field"><span class="field__label">${esc(f.label)}</span>
        <div class="image-field">
          <input type="text" ${attrs} value="${esc(v)}" placeholder="Paste an image address, or choose a file below" aria-label="${esc(f.label)} address">
          <input type="file" accept="image/*" data-image-file aria-label="Choose ${esc(f.label)} file">
          <img class="image-field__preview" alt="" ${v ? `src="${esc(imgSrc(v))}"` : 'hidden'}>
        </div>
        <span class="field__help">Chosen files are resized and stored in this browser.</span></div>`;
    }

    let input;
    if (f.type === 'textarea') {
      input = `<textarea ${attrs} rows="5">${esc(v)}</textarea>`;
    } else if (f.type === 'select') {
      const opts = (typeof f.options === 'function' ? f.options() : f.options).map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
      const blank = f.blank ? `<option value="">${esc(f.blank)}</option>` : f.required ? '<option value="">Select…</option>' : '';
      input = `<select ${attrs}>${blank}${opts.map((o) => `<option value="${esc(o.value)}" ${o.value === v ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`;
    } else {
      input = `<input type="${f.type}" ${attrs} ${f.type === 'number' ? 'min="0" step="any"' : ''} ${f.maxlength ? `maxlength="${f.maxlength}"` : ''} value="${esc(v)}">`;
    }
    return `<label class="field"><span class="field__label">${esc(f.label)}</span>${input}${help}</label>`;
  }

  // Resizes a chosen image so it fits comfortably in browser storage.
  async function compressImage(file, maxWidth = 900) {
    const dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = dataUrl;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // keeps transparent logos readable as JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  const clearNewFlag = (key) => {
    if (location.hash.endsWith('/new')) history.replaceState(null, '', `#${key}`);
  };
  dlg.addEventListener('close', () => clearNewFlag(location.hash.slice(1).split('/')[0]));

  function openEditor(key, row) {
    const cfg = resources[key];
    dlg.innerHTML = `
      <form class="form dialog__panel" id="editor" method="dialog">
        <h2>${row ? 'Edit' : 'New'} ${esc(cfg.singular)}</h2>
        ${row && cfg.details ? `<dl class="details">${cfg.details(row).filter(([, v]) => v).map(([l, v]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${cfg.fields.map((f) => fieldHTML(f, row?.[f.name])).join('')}
        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" id="cancel">Cancel</button>
          <button class="btn" type="submit">${row ? 'Save changes' : `Add ${esc(cfg.singular)}`}</button>
        </div>
      </form>`;

    dlg.querySelectorAll('[data-image-file]').forEach((fileInput) => {
      const wrap = fileInput.closest('.image-field');
      const text = $('input[type=text]', wrap), preview = $('img', wrap);
      const show = () => { preview.hidden = !text.value; if (text.value) preview.src = imgSrc(text.value); };
      text.addEventListener('input', show);
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        try { text.value = await compressImage(file); show(); } catch { alert('That file could not be read as an image.'); }
      });
    });

    $('#cancel').addEventListener('click', () => { clearNewFlag(key); dlg.close(); });
    $('#editor').addEventListener('submit', (e) => {
      e.preventDefault();
      const patch = {};
      for (const f of cfg.fields) {
        const el = e.target.elements[f.name];
        if (f.type === 'checkbox') patch[f.name] = el.checked;
        else if (f.type === 'number') patch[f.name] = el.value === '' ? null : Number(el.value);
        else patch[f.name] = el.value.trim();
      }
      const item = { ...(row || {}), ...patch };
      cfg.beforeSave?.(item, Store.get(key));
      if (row) Store.update(key, row.id, item);
      else Store.add(key, item);

      clearNewFlag(key);
      dlg.close();
      route();
      if (!Store.saved) alert('This change could not be stored because browser storage is full or blocked. Remove large images or download a backup.');
    });
    dlg.showModal();
  }

  window.addEventListener('hashchange', route);
  route();
})();
