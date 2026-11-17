# Deerwalk Training Center: static site with a separate admin panel

Plain HTML, CSS and JavaScript. No build step, no server, no database.

## Run it
Serve the folder so the website and the admin share the same browser storage.

With Node.js 18+ (uses `package.json`):

```bash
npm install
npm start
```

Or without Node: `python3 -m http.server 8080`

- Website: http://localhost:8080/
- Admin:   http://localhost:8080/admin/

(Opening the files by double-click works in some browsers, but others give each file its own storage,
so the admin's changes may not show on the website. A local server avoids that.)

Default admin login. Change it in `js/data.js` (the `ADMIN` constant):
- Email: `admin@deerwalk.local`
- Password: `ChangeMe123!`

## Structure
```
package.json      npm scripts (start / dev) and the dev server dependency (http-server)
index.html  courses.html  course.html  enroll.html  contact.html   core pages
events.html  blog.html  team.html                                   optional-content pages
css/style.css     theme tokens + public styles (also used by the admin)
images/courses/   original SVG cover art, one per starter course
images/favicon.svg
js/data.js        site details, starter content, storage layer, helpers
js/main.js        public pages
admin/index.html  admin panel (separate folder)
admin/css/admin.css
admin/js/admin.js
```

## What the admin manages
| Group | Section | Notes |
| --- | --- | --- |
| Content | Courses | Category, summary, description, "what students will learn" list, level, mode, instructor, start date, fee, image, upcoming/published flags |
| Content | Categories | Cannot be deleted while they contain courses |
| Content | Instructors | Photo, role, bio, LinkedIn. Can be linked to courses |
| Content | Events | Workshops, seminars, open days. Past events move to a "Past events" list automatically |
| Content | Blog posts | Draft or published, cover image, paragraphs |
| Social proof | Testimonials, Partners | Shown on the home page |
| Inbox | Registrations, Messages | Submitted from the public forms. Confirm/cancel registrations, mark messages read |

The dashboard has quick-add buttons (for example `admin/#courses/new` opens the "new course" form directly).
Images can be pasted as an address or chosen from a file. Chosen files are resized and stored in the browser.

The Events, Blog and Instructors menu links appear on the website only once you have added something to them.

## Images
Every starter course has an original illustrated cover in `images/courses/` (SVG, so they stay sharp and tiny).
They are drawn in the site's blue palette and contain no stock photos or third-party logos. To change one, edit
the course in the admin and paste an image address or choose a file, or replace the SVG file with your own
image using the same filename. Instructors, events and blog posts start empty, so add real photos for people
in the admin rather than placeholders.

## Theme
Colours are CSS variables at the top of `css/style.css`: `--navy`, `--blue`, `--teal`, `--tint`, `--amber`.
Change them there and the whole site and admin follow.

## Limits of a static site
- Everything is saved in the browser's localStorage. Edits, registrations and messages exist only in the browser
  that made them, so a visitor's enrollment will not reach your admin on another device. Use "Download backup"
  on the dashboard to keep a copy. Browser storage is limited (about 5 MB), so keep images small.
- The admin login is checked in the browser and can be read in `js/data.js`. It hides the panel; it is not security.
- For shared data and real authentication, use the MERN version of this project.
