/* Shared data, storage and helpers. Loaded first on every page. */
window.DTC = (() => {
  const SITE = {
    name: 'Deerwalk Training Center',
    tagline: 'IT skills that get you hired in Nepal',
    phones: ['01-5913021', '01-4567153', '9765355167', '9860422021'],
    email: '', // add a contact email to show it in the footer and contact page
    copyright: 'Deerwalk Compware',
    social: [
      { label: 'Facebook', href: 'https://www.facebook.com/deerwalktrainingcenter' },
      { label: 'LinkedIn', href: 'https://www.linkedin.com/company/deerwalktrainingcenter/' },
      { label: 'Instagram', href: 'https://www.instagram.com/deerwalk.training.center/' },
      { label: 'YouTube', href: 'https://www.youtube.com/@deerwalktrainingcenter' },
      { label: 'X', href: 'https://twitter.com/DeerwalkCenter' },
    ],
  };

  // Admin sign-in. This is a static site, so these credentials are visible to anyone
  // who views the source. Treat the admin as a convenience, not as real security.
  const ADMIN = { email: 'admin@deerwalk.local', password: 'ChangeMe123!' };

  // ---------- Helpers ----------
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const slugify = (t = '') =>
    t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const fmtDate = (v) => {
    if (!v) return '';
    const d = new Date(String(v).length === 10 ? v + 'T00:00:00' : v);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Image paths saved as "images/..." are relative to the site root; the admin lives one level deeper.
  const ROOT = /\/admin(\/|$)/.test(location.pathname) ? '../' : '';
  const imgSrc = (u) => (!u || /^(https?:|data:|\/)/i.test(u) ? u || '' : ROOT + u);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  // Splits plain text into escaped <p> paragraphs.
  const paragraphs = (text) =>
    String(text || '').split(/\n+/).map((t) => t.trim()).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join('');

  // Only allow http(s) links (or same-site paths) in href attributes.
  const safeUrl = (u) => (/^(https?:\/\/|\/|[\w-]+\.html)/i.test(String(u || '').trim()) ? String(u).trim() : '#');

  const fmtPrice = (v) => (typeof v === 'number' ? `NPR ${v.toLocaleString('en-IN')}` : 'Contact us for fees');

  // Flagged-upcoming courses that haven't started yet, soonest first (falls back to all flagged).
  const nextIntakes = (courses) => {
    const flagged = courses.filter((c) => c.upcoming).sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
    const today = new Date().toISOString().slice(0, 10);
    const future = flagged.filter((c) => c.startDate && c.startDate >= today);
    return future.length ? future : flagged;
  };

  // ---------- Starter content (based on the public Deerwalk Training Center site) ----------
  const categoryNames = [
    'Programming and Software Development', 'Data Science and Analytics', 'Specialized Tools and Utilities',
    'Database Management and Warehousing', 'Automotive Education', 'Office Management Tools and Packages',
    'AI and Machine Learning', 'Designing', 'Project Management', 'Digital Marketing', 'Mobile App Development',
    'Cloud Computing and Management', 'Network Administration and Management', 'Cyber Security and Cryptocurrency',
    'Personal Development', 'Photography', 'Database Management', 'Software Testing and Quality Assurance',
    'Automobile Engineer',
  ];

  // Prices are left empty: the original site only shows fees after a course is selected.
  const courseSeed = [
    ['Data Science and Machine Learning in Python', 'Data Science and Analytics', '110 hrs', '2026-10-02', true, 'Python, data analysis and machine learning, from cleaning data to training models.'],
    ['Fundamentals of US Healthcare and Data Analytics', 'Data Science and Analytics', '80 hrs', '2026-12-02', true, 'How the US healthcare system works, and how data analytics is applied inside it.'],
    ['Professional Data Analytics Program', 'Data Science and Analytics', '110 hrs', '2026-12-04', true, 'A full path through the tools and methods used by working data analysts.'],
    ['Ethical Hacking & Cyber Security with AI', 'Cyber Security and Cryptocurrency', '90 hrs', '2026-12-08', true, 'Find and fix security weaknesses, with AI-assisted techniques.'],
    ['AI Powered Digital Marketing', 'Digital Marketing', '60 hrs', '2026-12-09', true, 'SEO, social media, content and analytics, accelerated with AI tools.'],
    ['Full Stack Web Development - MERN Stack', 'Programming and Software Development', '110 hrs', '2026-12-17', true, 'Build complete web apps with MongoDB, Express, React and Node.js.'],
    ['Programming in Python', 'Programming and Software Development', '', '', false, 'Core Python programming for beginners.'],
    ['Full Stack Web Development - Java Spring Boot', 'Programming and Software Development', '', '', false, 'Web applications with Java, Spring Boot and a modern front end.'],
    ['SQL Server & Dot Net Core', 'Programming and Software Development', '', '', false, 'Back-end development with .NET Core and SQL Server.'],
    ['Introduction to Statistical Analysis Using R', 'Data Science and Analytics', '', '', false, 'Statistics fundamentals, applied in R.'],
    ['Data Analysis and Visualization with Microsoft Power BI', 'Data Science and Analytics', '', '', false, 'Turn raw data into interactive dashboards.'],
    ['Advanced Microsoft SQL Server', 'Database Management and Warehousing', '', '', false, 'Advanced querying, performance and administration.'],
    ['DevOps Engineering with AWS, Docker, Kubernetes & Terraform', 'Cloud Computing and Management', '', '', false, 'Ship and run software with modern DevOps tooling.'],
    ['Software Quality Assurance (QA)', 'Software Testing and Quality Assurance', '', '', false, 'Manual and automated testing practices.'],
    ['Project Management Professional', 'Project Management', '', '', false, 'Project management methods and exam preparation.'],
    ['AI in Creative Content & Video Production', 'AI and Machine Learning', '', '', false, 'Use AI tools to plan, create and edit content.'],
    ['Automobile Mechanical and Electrical Technology Training', 'Automotive Education', '', '', false, 'Hands-on training in vehicle mechanical and electrical systems.'],
  ];

  const testimonialSeed = [
    ['Rojina Dahal', 'Digital Marketing graduate', 'Clear teaching across SEO, social media, content and analytics gave me a well-rounded start in digital marketing.'],
    ['Krischal Om Pote', 'MERN Stack graduate', 'Hands-on projects and real-world examples made the MERN course practical and prepared me for web development work.'],
    ['Shrey Pradhananga', 'MERN Stack graduate', 'The course sped up my career growth and deepened my understanding of MERN technologies.'],
    ['Shashank Raj Pandey', 'Software QA graduate', 'Knowledgeable instructors, a practical approach and good facilities made the QA course a real turning point.'],
    ['Suprina Lepcha', 'Digital Marketing intern', 'After the training I interned at Deerwalk Compware and grew both personally and professionally.'],
    ['Samip Pandey', 'Business Analyst', 'The Python and Power BI courses improved my modelling and dashboards at work, and I encourage colleagues to join.'],
  ];

  const partnerSeed = [
    'Leapfrog', 'Karkhana', 'ItechNepal', 'Alternative Technology', 'CityTech', 'Envision', 'Infinite', 'CnC Tech',
    'Esignature', 'Versik', 'Cyberlink', 'Deerhold', 'Logica Bean', 'Crasoft Solution', 'Viveka Services', 'F1soft',
    'NTC', 'Inficare', 'Renegade Himalaya', 'Softebenz', 'STN', 'LogiSpark', 'Diyalo', 'DeltaTech', 'Arhant Solution',
    'Agile IT Solution', 'Codavatar Tech Pvt. Ltd.', 'Aqore',
  ];

  const seedDB = () => ({
    categories: categoryNames.map((name) => ({ id: slugify(name), name })),
    courses: courseSeed.map(([title, cat, duration, startDate, upcoming, summary]) => ({
      id: slugify(title), slug: slugify(title), title, categoryId: slugify(cat), duration, startDate,
      upcoming, published: true, summary, description: '', price: null, image: `images/courses/${slugify(title)}.svg`,
      level: '', mode: '', instructorId: '', syllabus: '',
    })),
    testimonials: testimonialSeed.map(([name, role, message]) => ({ id: uid(), name, role, message })),
    partners: partnerSeed.map((name) => ({ id: uid(), name, kind: 'placement', logo: '' })),
    instructors: [],
    events: [],
    posts: [],
    registrations: [],
    messages: [],
  });

  // ---------- Storage (localStorage, with an in-memory fallback if it is blocked) ----------
  const KEY = 'dtc_static_db_v2';
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch { db = null; }
  if (!db) db = seedDB();

  // One-time upgrade: give the starter courses their cover art if they were saved without images.
  if (!db.meta?.coverArt) {
    const starterIds = new Set(courseSeed.map(([title]) => slugify(title)));
    db.courses = (db.courses || []).map((c) => (!c.image && starterIds.has(c.id) ? { ...c, image: `images/courses/${c.id}.svg` } : c));
    db.meta = { ...db.meta, coverArt: true };
  }

  let saved = true;
  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); saved = true; } catch { saved = false; /* storage full or blocked */ }
  };
  persist();

  const Store = {
    get saved() { return saved; }, // false if the last write could not be stored
    get: (name) => db[name] || [],
    add(name, item) {
      const row = { id: uid(), createdAt: new Date().toISOString(), ...item };
      db[name] = [...this.get(name), row];
      persist();
      return row;
    },
    update(name, id, patch) {
      db[name] = this.get(name).map((r) => (r.id === id ? { ...r, ...patch } : r));
      persist();
    },
    remove(name, id) {
      db[name] = this.get(name).filter((r) => r.id !== id);
      persist();
    },
    export: () => JSON.stringify(db, null, 2),
    reset() { db = seedDB(); persist(); },
  };

  return { SITE, ADMIN, Store, esc, slugify, uid, fmtDate, fmtPrice, nextIntakes, todayISO, paragraphs, safeUrl, imgSrc };
})();
