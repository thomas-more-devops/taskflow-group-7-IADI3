# TaskFlow - Task Management Application

> A modern, responsive task management app built with HTML, CSS, and JavaScript

## 🚀 Live Demo
⚠️ As of v3.0.0, TaskFlow needs a running backend — the GitHub Pages link below is static-only, so the UI loads but task creation/editing will fail (no `/api/tasks` to call). Run it locally instead: see [How to Run](#-how-to-run).

[https://thomas-more-devops.github.io/taskflow-group-7-IADI3/](https://thomas-more-devops.github.io/taskflow-group-7-IADI3/)

## 📊 Project Status
![TaskFlow](https://img.shields.io/badge/TaskFlow-v5.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![GitHub last commit](https://img.shields.io/github/last-commit/thomas-more-devops/taskflow-group-7-IADI3)
![GitHub issues](https://img.shields.io/github/issues/thomas-more-devops/taskflow-group-7-IADI3)
![GitHub pull requests](https://img.shields.io/github/issues-pr/thomas-more-devops/taskflow-group-7-IADI3)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E)

## 🎓 Course Context
This project is part of the **Bachelor International Business Management - Data Science, Protection & Security** course, **Week 2: Git Fundamentals**. It demonstrates:
- Modern web development practices
- Git workflow and collaboration
- Professional project documentation
- Responsive design principles
- Team-based software development

## 🚀 Features

- ✅ **Add Tasks**: Create new tasks with a simple, intuitive interface
- ✅ **Mark Complete**: Check off completed tasks with satisfying animations
- ✅ **Edit Tasks**: Modify task descriptions inline
- ✅ **Delete Tasks**: Remove tasks you no longer need
- ✅ **Persistent Storage**: Tasks are saved locally in your browser
- ✅ **Task Statistics**: View your productivity metrics
- ✅ **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- ✅ **Modern UI**: Clean, professional interface with smooth animations

## 🛠️ Technologies Used

- **HTML5 / CSS3 / JavaScript ES6+**: Frontend UI (semantic markup, Flexbox/Grid, classes/modules)
- **nginx**: Frontend microservice - static file serving + reverse proxy to the backend
- **Node.js / Express**: Backend REST API
- **MongoDB / Mongoose**: Persistent task storage
- **Docker / Docker Compose**: Each service is an independent container; Compose orchestrates all three
- **Google Fonts**: Inter font family for typography

## 📱 Screenshots

### Desktop View
![TaskFlow desktop view](screenshots/1.png)

*Professional task management interface with clean design*

### Mobile View
<img src="screenshots/2.jpg" alt="TaskFlow mobile view" width="300">

*Fully responsive design that works on all devices*

## 🏃 How to Run

As of v5.0.0, TaskFlow is three independent microservices orchestrated with Docker Compose:

```
Frontend (nginx) → Backend (Node.js/Express) → Database (MongoDB)
     :80                   internal only              internal only
```

Only the frontend's port 80 is published to the host. The backend and database are reachable only from other containers on the Compose network — nginx proxies `/api` to the backend, and the backend talks to MongoDB by its service name.

### Docker Compose (the only supported way to run this now)

Requires Docker with the Compose plugin (`docker compose version`).

```bash
git clone https://github.com/thomas-more-devops/taskflow-group-7-IADI3.git
cd taskflow-group-7-IADI3

docker compose up -d --build
# open http://localhost
```

```bash
docker compose ps                   # Status of all 3 services
docker compose logs -f backend      # Follow backend logs (look for "Connected to MongoDB")
docker compose down                 # Stop and remove all 3 containers (volume is kept)
```

### Verifying it works

```bash
curl http://localhost/api/health
# {"status":"ok","service":"backend","hostname":"<container id>"}

curl -X POST http://localhost/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task from API"}'

curl http://localhost/api/tasks
# The task you just created should be in the response, and visible
# in the browser at http://localhost after a refresh.
```

### Testing persistence

```bash
docker compose down
docker compose up -d
# wait a few seconds for the database healthcheck, then:
curl http://localhost/api/tasks
# Your tasks are still there - they live in the taskflow-data volume,
# not in any container, so removing all 3 containers doesn't lose them.
```

### Scaling the backend

```bash
docker compose up -d --scale backend=3
docker compose ps   # 3 backend-N containers, still 1 frontend/database
```

This works because no service in `docker-compose.yml` sets `container_name` — Compose needs to generate a unique name per replica (`backend-1`, `backend-2`, `backend-3`), which a fixed name would prevent.

**Bonus — nginx load balancing across replicas:** `frontend/nginx.conf` doesn't just `proxy_pass http://backend:3000` directly. A bare hostname there is resolved *once*, at nginx startup — so it would (a) crash nginx entirely if `backend` isn't resolvable yet, and (b) keep forwarding every request to whichever single backend container existed at that moment, even after scaling. Instead, the config uses Docker's embedded DNS resolver (`127.0.0.11`) with a variable in `proxy_pass`, which forces nginx to re-resolve `backend` on every request. Verified directly: with 3 replicas running, 30 requests to `/api/health` through nginx came back with 3 different container hostnames (15/6/9 split) — proof it's actually distributing across all of them, not pinned to one.

```bash
# See the distribution yourself:
for i in $(seq 1 10); do curl -s http://localhost/api/health; echo; done
```

### Troubleshooting

- **Backend can't connect to DB**: confirm `DB_HOST=database` in `docker-compose.yml` matches the `database` service name, and that `docker compose ps` shows it `healthy`.
- **Frontend shows 502**: the backend isn't up yet or crashed - check `docker compose logs backend`. This is a clean 502, not a frontend crash (see the load-balancing note above for why that distinction matters).
- **Data lost after `docker compose down`**: make sure you didn't also pass `-v` (that removes the `taskflow-data` volume too) and that `docker-compose.yml` still has the volume mounted on the `database` service.

### API Reference

| Method | Endpoint          | Description              |
|--------|-------------------|---------------------------|
| GET    | `/api/health`     | Health check (`{"status","service","hostname"}`) |
| GET    | `/api/tasks`      | List all tasks            |
| POST   | `/api/tasks`      | Create a task (`{title, priority, category, dueDate}`) |
| PUT    | `/api/tasks/:id`  | Update a task              |
| DELETE | `/api/tasks/:id`  | Delete a task              |

All routes are reached through nginx at `http://localhost/api/...` - the backend itself has no port published to the host.

## 📋 Usage

### Adding Tasks
1. Type your task in the input field
2. Click "Add Task" or press Enter
3. Your task appears in the list below

### Managing Tasks
- **Complete**: Click the checkbox next to any task
- **Edit**: Click the edit icon (✏️) to modify the task text
- **Delete**: Click the delete icon (🗑️) to remove the task

### Viewing Statistics
The stats section shows:
- **Total Tasks**: All tasks you've created
- **Completed**: Tasks you've finished
- **Pending**: Tasks still to be done

## 💡 Learning Outcomes

Through this project, students learn:
- **Git Version Control**: Basic Git commands (add, commit, push, pull)
- **GitHub Collaboration**: Team workflows and pull requests
- **Professional Documentation**: README writing and code comments
- **Modern Web Development**: HTML5, CSS3, and JavaScript ES6+
- **Responsive Design**: Mobile-first CSS and flexible layouts
- **Data Persistence**: Local Storage API usage
- **User Experience**: Intuitive interface design and accessibility
- **Project Management**: Issue tracking and project organization

## 🎯 Learning Objectives

This project demonstrates:
- Modern HTML5 semantic markup
- CSS3 advanced features (Grid, Flexbox, animations)
- JavaScript ES6+ features (classes, arrow functions, template literals)
- Local Storage API for data persistence
- Responsive web design principles
- Progressive enhancement
- Accessibility best practices

## 📁 Project Structure

```
taskflow/
├── docker-compose.yml          # Orchestrates all 3 services
├── frontend/                   # nginx microservice
│   ├── Dockerfile
│   ├── nginx.conf               # Serves static files, proxies /api, load-balances
│   └── public/
│       ├── index.html
│       ├── styles/main.css
│       └── scripts/app.js       # Talks to the API (fetch), not localStorage
├── backend/                    # Express/Mongoose microservice
│   ├── Dockerfile                # Multi-stage build, non-root user
│   ├── .dockerignore
│   ├── .eslintrc.js
│   ├── package.json
│   ├── server.js
│   └── models/
│       └── Task.js
├── docs/
│   ├── SETUP.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   ├── DATABASE_SETUP.md      # Network/volume/MongoDB setup detail
│   └── RELEASE_RETRO_v2.0.0.md
├── .github/
│   ├── workflows/ci.yml      # CI pipeline
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
├── screenshots/
│   ├── 1.png
│   └── 2.jpg
├── .gitignore
├── LICENSE
└── README.md
```

## 🛠️ Development Workflow

```bash
# Daily development workflow
git pull origin main                    # Get latest changes
git checkout -b feature/feature-name    # Create feature branch
# Make your changes to the code
git add .                              # Stage changes
git commit -m "feat: description"     # Commit with conventional message
git push origin feature/feature-name   # Push to remote
# Create Pull Request on GitHub for review
```

## 📈 Performance Metrics

- **Load Time**: <2 seconds on 3G connection
- **Lighthouse Score**: 95+ across all categories
- **Browser Support**: All modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- **Mobile Performance**: Fully responsive design with touch-friendly interactions
- **Accessibility**: WCAG 2.1 AA compliant

## 🚀 Deployment

As of v5.0.0, TaskFlow is three containers orchestrated by `docker-compose.yml`, so it can no longer be deployed as a static site on GitHub Pages — the API routes would 404 there. Any host that can run Docker Compose (or an equivalent orchestrator) works: a VPS, Fly.io, Render, Railway, a small Kubernetes cluster, etc.

### Local Development
See [How to Run](#-how-to-run) above — `docker compose up -d --build`.

## 🌟 Key Features Explained

### Persistent Storage via MongoDB
Tasks are saved to MongoDB through the backend's REST API (not browser local storage), so they persist across devices, browser sessions, and container restarts - as long as the `taskflow-data` volume isn't deleted:

```javascript
// public/scripts/app.js - every mutation goes through the API
async addTask() {
    const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskText, priority, category, dueDate })
    });
    // ...
}
```

### Responsive Design
Mobile-first CSS approach with breakpoints for optimal viewing:

```css
@media (max-width: 768px) {
    .input-container {
        flex-direction: column;
    }
}
```

### Smooth Animations
CSS transitions and keyframe animations for delightful user experience:

```css
@keyframes slideIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
```

## 🎨 Design Principles

### Color Palette
- **Primary**: #667eea (Modern blue gradient)
- **Secondary**: #764ba2 (Complementary purple)
- **Success**: #48bb78 (Green for completed tasks)
- **Warning**: #ed8936 (Orange for notifications)
- **Error**: #e53e3e (Red for alerts)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Hierarchy**: Clear heading structure with proper font weights
- **Readability**: Optimal line height and letter spacing

### User Experience
- **Intuitive Interface**: Clear visual hierarchy and familiar patterns
- **Immediate Feedback**: Real-time notifications and visual confirmations
- **Error Prevention**: Input validation and confirmation dialogs
- **Accessibility**: Semantic HTML and proper ARIA attributes

## 🔧 Advanced Features

### Keyboard Shortcuts
- **Enter**: Add new task when input is focused
- **Tab**: Navigate through interface elements
- **Space**: Toggle task completion (when focused)

### Data Export (Future Enhancement)
```javascript
exportTasks() {
    const dataStr = JSON.stringify(this.tasks, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    // Download as JSON file
}
```

### Statistics Tracking
Real-time task statistics with daily productivity metrics:
- Tasks created today
- Tasks completed today
- Overall completion rate
- Productivity trends

## 🤝 Contributing

We welcome contributions from students and developers! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for detailed instructions.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For more details, check:
- [Setup Guide](docs/SETUP.md) - Installation and development setup
- [Architecture Documentation](docs/ARCHITECTURE.md) - Technical implementation details
- [Feature Documentation](docs/FEATURES.md) - Comprehensive feature list

### Commit Message Convention
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

## 🧪 Testing

### Manual Testing Checklist
- [ ] Add new task
- [ ] Edit existing task
- [ ] Mark task as complete
- [ ] Delete task
- [ ] Verify persistence after page reload
- [ ] Test responsive design on different screen sizes
- [ ] Validate accessibility with screen reader

### Browser Compatibility
- ✅ Chrome 80+ (Recommended)
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📚 Resources

### Learning Materials
- [MDN Web Docs](https://developer.mozilla.org/) - Comprehensive web development documentation
- [JavaScript.info](https://javascript.info/) - Modern JavaScript tutorial
- [CSS-Tricks](https://css-tricks.com/) - CSS techniques and best practices

### Design Inspiration
- [Dribbble](https://dribbble.com/tags/task_management) - Task management UI designs
- [Behance](https://www.behance.net/) - Web design inspiration

## 📝 License

This project is open source and available under the [MIT License](LICENCE).

```
MIT License

Copyright (c) 2026 TaskFlow Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 📞 Course Support

### Getting Help
- **Instructor**: Harun Kalkanci
- **Course Materials**: Available on course platform

### Technical Support
If you have any questions or need help:
- 📧 Open an issue on GitHub
- 📖 Check our [comprehensive documentation](docs/)
- 💬 Review the inline code comments
- 🎓 Consult the course materials
- 👥 Ask teammates during collaborative exercises

## 🏆 Achievements

This TaskFlow application demonstrates:
- **Modern Web Standards**: Using the latest HTML5, CSS3, and ES6+ features
- **Best Practices**: Following industry-standard development patterns
- **User-Centered Design**: Focusing on usability and accessibility
- **Performance**: Optimized for fast loading and smooth interactions
- **Maintainability**: Clean, well-documented, and structured code

## ✅ Shipped in v2.0.0

- [x] **Task Categories**: Color-coded categories (Work, Personal, Shopping, Health, Study)
- [x] **Due Dates**: Deadline tracking with overdue/due-today detection
- [x] **Priority Levels**: High, Medium, Low priority sorting
- [x] **Search & Filter**: Advanced task filtering, quick filters, and sorting

## 🎯 Future Enhancements

Potential improvements for version 2.1+ (each one is tracked as a [GitHub issue](https://github.com/thomas-more-devops/taskflow-group-7-IADI3/issues)):
- [ ] **Dark Mode**: Toggle between light and dark themes
- [ ] **Collaboration**: Share tasks with team members
- [ ] **Sync**: Cloud synchronization across devices
- [ ] **Offline Mode**: Service worker for offline functionality

## 🙏 Acknowledgments

- **Inter Font**: Beautiful typography by Google Fonts
- **Icons**: Unicode emoji set for consistent cross-platform display
- **Inspiration**: Modern task management applications like Todoist, Things, and Any.do
- **Community**: Open source contributors and web development community

## 🏆 Contributors

Thanks to all the students and developers who contributed to this project:

### Course Contributors (Week 2 - Git Fundamentals)
- [@s6v41k](https://github.com/s6v41k) - Student A: HTML documentation comments
- [@GorginuoTWF](https://github.com/GorginuoTWF) - Student B: CSS comments explaining design choices
- [@Babaika328](https://github.com/Babaika328) - Student C: JavaScript comments and error handling and ARCHITECTURE.md explaining code structure

### How to Become a Contributor
1. Complete the [setup instructions](docs/SETUP.md)
2. Pick an issue from our [project board](https://github.com/thomas-more-devops/taskflow-group-7-IADI3/projects)
3. Follow our [contributing guidelines](docs/CONTRIBUTING.md)
4. Submit a pull request for review

## 🔄 Version History

### v5.0.0 (Current)
- 🚀 Split into three independent microservices: frontend (nginx), backend (Express/Mongoose), database (MongoDB)
- 🚀 docker-compose.yml orchestrates all three, with a healthcheck-gated startup order
- 🐛 Fixed nginx crashing at startup when the backend wasn't resolvable yet; now resolves lazily via Docker's embedded DNS, which also makes it load-balance across scaled backend replicas
- 🐛 Restored the PUT /api/tasks/:id route and async error handling, both dropped in the assignment's simplified backend spec and required for the frontend's edit/complete actions and for clean error responses
- 🎁 Bonus: proved nginx load-balances across `--scale backend=N` replicas (verified: 30 requests, 3 distinct containers)

### v4.0.0
- 🚀 MongoDB persistence via Mongoose, replacing in-memory storage
- 🚀 Multi-stage Dockerfile, non-root container user
- 🚀 docker-compose.yml (app + MongoDB), named volume for persistence
- 🐛 Fixed unquoted task IDs in inline onclick handlers (broke once MongoDB's string _id replaced numeric IDs)

### v3.0.0
- 🚀 Node.js/Express backend with a REST API, replacing the pure static-site + localStorage architecture
- 🚀 Containerized with Docker (single image)

### v2.0.0
- 🚀 Task priority levels (High/Medium/Low) with color-coded badges and sorting
- 🚀 Task categories (Work, Personal, Shopping, Health, Study) with filtering and breakdown stats
- 🚀 Due date tracking with overdue/due-today detection and animated warnings
- 🚀 Real-time search with term highlighting, quick filters, and advanced sorting
- 🎨 Professional repository structure: issue/PR templates, CI pipeline, contributing guidelines
- 🐛 Fixed CI pipeline silently skipping devDependency install (masked ESLint failures)

### v1.0.0
- ✨ Initial release with core functionality
- 🎨 Modern, responsive design
- 💾 Local storage persistence
- 📊 Basic statistics tracking
- 🔧 Complete CRUD operations

---

**Happy Task Managing! 🎉**

Built with ❤️ using modern web technologies.

*"Productivity is not about being busy, it's about being effective."*

---

## Getting Started with Git

This project is perfect for learning Git version control:

1. **Initialize Repository**:
   ```bash
   git init
   git add .
   git commit -m "feat: initial TaskFlow application"
   ```

2. **Connect to GitHub**:
   ```bash
   git remote add origin https://github.com/thomas-more-devops/taskflow-group-7-IADI3.git
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch
   - Your live app will be available at your GitHub Pages URL

Ready to start your DevOps journey with TaskFlow! 🚀