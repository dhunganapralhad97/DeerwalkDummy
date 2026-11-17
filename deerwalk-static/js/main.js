/* Public website behaviour: shared header/footer plus one init function per page. */
(() => {
  const { SITE, Store, esc, fmtDate, fmtPrice, nextIntakes, todayISO, paragraphs, safeUrl, imgSrc } = DTC;
  const $ = (sel, root = document) => root.querySelector(sel);
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);

  /* ---------- Data (only published items are shown) ---------- */
  const isLive = (x) => x.published !== false;
  const courses = Store.get('courses').filter(isLive);
  const categories = Store.get('categories');
  const instructors = Store.get('instructors');
  const events = Store.get('events').filter(isLive).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const posts = Store.get('posts').filter(isLive).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const catName = (id) => categories.find((c) => c.id === id)?.name || '';
  const courseUrl = (c) => `course.html?slug=${encodeURIComponent(c.slug)}`;
  const upcomingEvents = () => events.filter((e) => e.date >= todayISO());

  /* ---------- Shared layout ---------- */
  function renderLayout() {
    const active = page === 'course' ? 'courses' : page;
    // Pages for optional content only appear in the menu once there is something to show.
    const links = [
      ['home', 'index.html', 'Home', true],
      ['courses', 'courses.html', 'Courses', true],
      ['events', 'events.html', 'Events', events.length > 0],
      ['blog', 'blog.html', 'Blog', posts.length > 0],
      ['team', 'team.html', 'Instructors', instructors.length > 0],
      ['contact', 'contact.html', 'Contact', true],
    ]
      .filter(([, , , show]) => show)
      .map(([key, href, label]) => `<a href="${href}" ${key === active ? 'class="active" aria-current="page"' : ''}>${label}</a>`)
      .join('');

    $('#site-header').innerHTML = `
      <div class="container site-header__bar">
        <a class="brand" href="index.html"><span class="brand__mark" aria-hidden="true">D</span>${esc(SITE.name)}</a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="main-nav">Menu</button>
        <nav id="main-nav" class="nav" aria-label="Main">${links}<a class="btn btn--small" href="enroll.html">Enroll now</a></nav>
      </div>`;

    const toggle = $('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = $('#main-nav').classList.toggle('nav--open');
      toggle.setAttribute('aria-expanded', open);
    });

    $('#site-footer').innerHTML = `
      <div class="container site-footer__grid">
        <div>
          <p class="brand brand--light">${esc(SITE.name)}</p>
          <p class="site-footer__about">Industry-focused IT and technical training, with placement support through our partner companies.</p>
        </div>
        <div>
          <h2>Call us</h2>
          <ul>${SITE.phones.map((p) => `<li><a href="tel:${esc(p)}">${esc(p)}</a></li>`).join('')}</ul>
          ${SITE.email ? `<p><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></p>` : ''}
        </div>
        <div>
          <h2>Follow</h2>
          <ul>${SITE.social.map((s) => `<li><a href="${esc(s.href)}" target="_blank" rel="noreferrer">${esc(s.label)}</a></li>`).join('')}</ul>
        </div>
      </div>
      <div class="container site-footer__base">
        <span>© ${new Date().getFullYear()} ${esc(SITE.copyright)}. All rights reserved.</span>
        <a href="admin/index.html">Admin sign in</a>
      </div>`;
  }

  /* ---------- Reusable card templates ---------- */
  const courseCard = (c) => `
    <article class="course-card">
      <div class="course-card__media" aria-hidden="true">${c.image ? `<img src="${esc(imgSrc(c.image))}" alt="" loading="lazy">` : `<span>${esc(c.title.charAt(0))}</span>`}</div>
      <div class="course-card__body">
        <p class="course-card__category">${esc(catName(c.categoryId))}</p>
        <h3><a href="${courseUrl(c)}">${esc(c.title)}</a></h3>
        <p class="course-card__meta">${[c.duration, c.mode, c.startDate && `Starts ${fmtDate(c.startDate)}`].filter(Boolean).map((t) => `<span>${esc(t)}</span>`).join('')}</p>
      </div>
      <a class="btn btn--small" href="enroll.html?course=${encodeURIComponent(c.id)}">Enroll</a>
    </article>`;

  const eventCard = (e) => {
    const d = new Date(`${e.date}T00:00:00`);
    const meta = [e.time, e.location].filter(Boolean).join(' · ');
    return `
    <article class="event">
      <div class="event__date" aria-hidden="true"><strong>${d.getDate()}</strong><span>${d.toLocaleString('en-GB', { month: 'short' })}</span></div>
      <div>
        <p class="badge">${esc(e.type || 'Event')}</p>
        <h3>${esc(e.title)}</h3>
        <p class="event__meta"><time datetime="${esc(e.date)}">${fmtDate(e.date)}</time>${meta ? ` · ${esc(meta)}` : ''}</p>
        ${e.description ? `<p>${esc(e.description)}</p>` : ''}
        ${safeUrl(e.link) !== '#' ? `<a class="btn btn--small" href="${esc(safeUrl(e.link))}" target="_blank" rel="noopener noreferrer">Register or learn more</a>` : ''}
      </div>
    </article>`;
  };

  const personCard = (i) => `
    <article class="person">
      <div class="person__photo" aria-hidden="true">${i.image ? `<img src="${esc(imgSrc(i.image))}" alt="" loading="lazy">` : esc(i.name.charAt(0))}</div>
      <h3>${esc(i.name)}</h3>
      ${i.role ? `<p class="person__role">${esc(i.role)}</p>` : ''}
      ${i.bio ? `<p>${esc(i.bio)}</p>` : ''}
      ${safeUrl(i.linkedin) !== '#' ? `<a href="${esc(safeUrl(i.linkedin))}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
    </article>`;

  const postCard = (p) => `
    <article class="post-card">
      ${p.image ? `<img src="${esc(imgSrc(p.image))}" alt="" loading="lazy">` : ''}
      <div class="post-card__body">
        <p class="post__meta">${fmtDate(p.date)}${p.author ? ` · ${esc(p.author)}` : ''}</p>
        <h3><a href="blog.html?slug=${encodeURIComponent(p.slug)}">${esc(p.title)}</a></h3>
        ${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}
      </div>
    </article>`;

  const showStatus = (el, type, text) => {
    el.className = `alert alert--${type}`;
    el.textContent = text;
    el.hidden = !text;
  };

  // Fills a list and reveals its section, or leaves the section hidden when there is nothing to show.
  const fillSection = (sectionId, listId, items, render) => {
    if (!items.length) return;
    $(listId).innerHTML = items.map(render).join('');
    $(sectionId).hidden = false;
  };

  /* ---------- Pages ---------- */
  function initHome() {
    const upcoming = nextIntakes(courses);

    $('#intakes-list').innerHTML = upcoming.length
      ? upcoming.slice(0, 4).map((c) => `<li><time datetime="${esc(c.startDate)}">${fmtDate(c.startDate)}</time><a href="${courseUrl(c)}">${esc(c.title)}</a><span>${esc(c.duration)}</span></li>`).join('')
      : '<li>New intakes will be announced here.</li>';

    $('#upcoming-grid').innerHTML = upcoming.length
      ? upcoming.slice(0, 6).map(courseCard).join('')
      : '<p>No upcoming courses are scheduled right now. Browse all courses to see what we offer.</p>';

    $('#category-chips').innerHTML = categories.map((c) => `<li><a href="courses.html?category=${encodeURIComponent(c.id)}">${esc(c.name)}</a></li>`).join('');

    fillSection('#events-section', '#events-list', upcomingEvents().slice(0, 3), eventCard);
    fillSection('#team-section', '#team-list', instructors.slice(0, 4), personCard);
    fillSection('#posts-section', '#posts-list', posts.slice(0, 3), postCard);
    fillSection('#partners', '#partners-list', Store.get('partners').filter((p) => p.kind === 'placement'),
      (p) => `<li>${p.logo ? `<img src="${esc(imgSrc(p.logo))}" alt="${esc(p.name)}" loading="lazy">` : esc(p.name)}</li>`);
    fillSection('#testimonials', '#quotes-list', Store.get('testimonials'), (t) => `
      <figure><blockquote>${esc(t.message)}</blockquote>
      <figcaption><strong>${esc(t.name)}</strong>${t.role ? `<span>${esc(t.role)}</span>` : ''}</figcaption></figure>`);

    $('#hero-search').addEventListener('submit', (e) => {
      e.preventDefault();
      location.href = `courses.html?q=${encodeURIComponent($('#hero-q').value.trim())}`;
    });
  }

  function initCourses() {
    const q = $('#q'), cat = $('#category'), up = $('#upcoming');
    cat.innerHTML = '<option value="">All categories</option>' + categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    q.value = params.get('q') || '';
    cat.value = params.get('category') || '';
    up.checked = params.get('upcoming') === 'true';

    const render = () => {
      const term = q.value.trim().toLowerCase();
      const list = courses
        .filter((c) => !cat.value || c.categoryId === cat.value)
        .filter((c) => !up.checked || c.upcoming)
        .filter((c) => !term || `${c.title} ${c.summary}`.toLowerCase().includes(term))
        .sort((a, b) => (up.checked ? String(a.startDate).localeCompare(String(b.startDate)) : a.title.localeCompare(b.title)));

      $('#courses-title').textContent = up.checked ? 'Upcoming courses' : 'All courses';
      $('#courses-empty').hidden = list.length > 0;
      $('#courses-grid').innerHTML = list.map(courseCard).join('');

      const next = new URLSearchParams();
      if (term) next.set('q', q.value.trim());
      if (cat.value) next.set('category', cat.value);
      if (up.checked) next.set('upcoming', 'true');
      history.replaceState(null, '', next.toString() ? `?${next}` : location.pathname);
    };

    [q, cat, up].forEach((el) => el.addEventListener('input', render));
    render();
  }

  function initCourseDetail() {
    const c = courses.find((x) => x.slug === params.get('slug'));
    const root = $('#course');
    if (!c) {
      root.innerHTML = '<h1>Course not found</h1><p>This course may have been removed or is no longer listed.</p><a class="btn" href="courses.html">Browse all courses</a>';
      return;
    }
    document.title = `${c.title} | ${SITE.name}`;
    const teacher = instructors.find((i) => i.id === c.instructorId);
    const topics = String(c.syllabus || '').split('\n').map((t) => t.trim()).filter(Boolean);
    const facts = [
      ['Duration', c.duration], ['Level', c.level], ['Mode', c.mode],
      ['Next start', c.startDate && fmtDate(c.startDate)], ['Course fee', fmtPrice(c.price)],
    ].filter(([, v]) => v);

    root.innerHTML = `
      <a href="courses.html">All courses</a>
      <p class="course-card__category">${esc(catName(c.categoryId))}</p>
      <h1>${esc(c.title)}</h1>
      ${c.summary ? `<p class="lead">${esc(c.summary)}</p>` : ''}
      ${teacher ? `<p class="instructor-line">Taught by <a href="team.html">${esc(teacher.name)}</a>${teacher.role ? `, ${esc(teacher.role)}` : ''}</p>` : ''}
      <dl class="facts">${facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${c.image ? `<img class="course-detail__image" src="${esc(imgSrc(c.image))}" alt="">` : ''}
      <div class="prose">${paragraphs(c.description)}</div>
      ${topics.length ? `<h2>What you'll learn</h2><ul class="syllabus">${topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <p><a class="btn" href="enroll.html?course=${encodeURIComponent(c.id)}">Enroll in this course</a></p>`;
  }

  function initEnroll() {
    const select = $('#course-select');
    select.innerHTML = '<option value="">Select a course</option>' + courses.map((c) => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
    select.value = params.get('course') || '';

    const hint = $('#fee-hint');
    const updateHint = () => {
      const c = courses.find((x) => x.id === select.value);
      hint.textContent = c ? `Course fee: ${fmtPrice(c.price)}` : '';
    };
    select.addEventListener('change', updateHint);
    updateHint();

    $('#enroll-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.add('registrations', { ...Object.fromEntries(new FormData(e.target)), status: 'Pending' });
      e.target.reset();
      updateHint();
      showStatus($('#form-status'), 'success', 'Registration received. Our team will contact you to confirm your seat.');
    });
  }

  function initContact() {
    $('#phones').innerHTML = SITE.phones.map((p) => `<li><a href="tel:${esc(p)}">${esc(p)}</a></li>`).join('') +
      (SITE.email ? `<li><a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a></li>` : '');

    $('#contact-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.add('messages', { ...Object.fromEntries(new FormData(e.target)), isRead: false });
      e.target.reset();
      showStatus($('#form-status'), 'success', 'Message sent. We will get back to you soon.');
    });
  }

  function initEvents() {
    const upcoming = upcomingEvents();
    const past = events.filter((e) => e.date < todayISO()).reverse();
    $('#events-upcoming').innerHTML = upcoming.length ? upcoming.map(eventCard).join('') : '<p>No upcoming events right now. Check back soon.</p>';
    if (past.length) {
      $('#events-past').innerHTML = past.map(eventCard).join('');
      $('#past-section').hidden = false;
    }
  }

  function initTeam() {
    $('#team-grid').innerHTML = instructors.length ? instructors.map(personCard).join('') : '<p>Our instructor profiles will appear here soon.</p>';
  }

  function initBlog() {
    const slug = params.get('slug');
    const post = slug && posts.find((p) => p.slug === slug);
    if (slug) {
      $('#blog-list-view').hidden = true;
      const root = $('#post-view');
      root.hidden = false;
      if (!post) {
        root.innerHTML = '<h1>Post not found</h1><p>This post may have been removed.</p><a class="btn" href="blog.html">Back to the blog</a>';
        return;
      }
      document.title = `${post.title} | ${SITE.name}`;
      root.innerHTML = `
        <a href="blog.html">All posts</a>
        <h1>${esc(post.title)}</h1>
        <p class="post__meta">${fmtDate(post.date)}${post.author ? ` · ${esc(post.author)}` : ''}</p>
        ${post.image ? `<img class="course-detail__image" src="${esc(imgSrc(post.image))}" alt="">` : ''}
        <div class="prose">${paragraphs(post.content || post.excerpt)}</div>`;
      return;
    }
    $('#posts-grid').innerHTML = posts.length ? posts.map(postCard).join('') : '<p>No posts yet. Check back soon.</p>';
  }

  /* ---------- Boot ---------- */
  renderLayout();
  ({ home: initHome, courses: initCourses, course: initCourseDetail, enroll: initEnroll, contact: initContact,
     events: initEvents, team: initTeam, blog: initBlog })[page]?.();
})();
