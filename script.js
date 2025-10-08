document.addEventListener("DOMContentLoaded", function () {
    // Typing effect (unchanged)
    const typingEffect = document.getElementById("typing-effect");
    const text = "Computer Science Student";
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDuration = 5000;

    let charIndex = 0;
    let isDeleting = false;

    function type() {
        const currentLength = typingEffect?.textContent.length || 0;

        if (isDeleting) {
            typingEffect.textContent = text.substring(0, charIndex--);
        } else {
            typingEffect.textContent = text.substring(0, charIndex++);
        }

        if (!isDeleting && charIndex > text.length) {
            isDeleting = true;
            setTimeout(type, pauseDuration);
        } else if (isDeleting && charIndex < 0) {
            isDeleting = false;
            charIndex = 0;
            setTimeout(type, 500);
        } else {
            const speed = isDeleting ? deletingSpeed : typingSpeed;
            setTimeout(type, speed);
        }
    }
    if (typingEffect) type();
});

document.addEventListener("DOMContentLoaded", () => {
    // Skills (unchanged)
    document.querySelectorAll(".skill").forEach(skill => {
        const value = skill.getAttribute("data-skill");
        const color = skill.getAttribute("data-color") || "#388bff";
        const fill = skill.querySelector(".skill-fill");
        const percent = skill.querySelector(".skill-percent");

        fill.style.width = value + "%";
        fill.style.backgroundColor = color;
        percent.textContent = value + "%";
    });
});

function loadLikes() {
    const saved = localStorage.getItem("projectLikes");
    return saved ? JSON.parse(saved) : {};
}

function saveLikes(likesObj) {
    localStorage.setItem("projectLikes", JSON.stringify(likesObj));
}

document.addEventListener("DOMContentLoaded", () => {
    /* DATA (Template-friendly) */
    /* Key = completed, in-progress, paused, under-maintenance */
    /* Text Values = Updated / Completed, In Progress, Paused, Under Maintenance */
    /* Logs = Format: "YYYY-MM-DD" -m */
    const savedLikes = loadLikes();
    const projects = [
        {
            id: "ecommerce",
            title: "E-Commerce Platform",
            desc: "A full-stack e-commerce solution with React, Node.js, and MongoDB. I'm trying to fix this, I swear. but",
            extended: "Implements authentication, product/catalog management, checkout flows, and payment integration. Designed for scalability and modular feature additions.",
            tags: ["React", "Node.js", "MongoDB", "Stripe", "Express", "REST API", "JWT", "Docker"],
            status: { key: "under-maintenance", text: "Under Maintenance" },
            image: "Assets/Other_Images/Image_Placeholder.jpg",
            repo: "https://github.com/yourname/ecommerce",
            likes: savedLikes["ecommerce"]?.count || 0,
            liked: savedLikes["ecommerce"]?.liked || false,

            logs: [
                "2025-09-15: Initial setup with React + Node.js",
                "2025-09-20: Added authentication and JWT support",
                "2025-09-25: Integrated Stripe payments",
                "2025-10-01: Currently fixing checkout flow bugs"
            ]
        },
        {
            id: "taskmanagement",
            title: "Task Management App",
            desc: "Collaborative task management with real-time updates.",
            extended: "Built with Vue.js, Express, and Socket.io. Supports team workspaces, live task updates, mentions, and role-based permissions.",
            tags: ["Vue.js", "Express", "Socket.io", "MongoDB", "Express", "REST API", "Real-time", "idk", "jwt"],
            status: { key: "under-maintenance", text: "Under Maintenance" },
            image: "Assets/Other_Images/Image_Placeholder.jpg",
            repo: "https://github.com/yourname/taskapp",
            likes: savedLikes["taskmanagement"]?.count || 0,
            liked: savedLikes["taskmanagement"]?.liked || false,

            logs: []

        },
        {
            id: "weatherdashboard",
            title: "Weather Dashboard",
            desc: "Interactive dashboard with charts and forecasts.",
            extended: "React + Chart.js with a clean UI. Uses external weather APIs, caching, and responsive chart layouts for mobile-friendly viewing.",
            tags: ["React", "Chart.js", "API"],
            status: { key: "under-maintenance", text: "Under Maintenance" },
            image: "Assets/Other_Images/Image_Placeholder.jpg",
            repo: "https://github.com/yourname/weather-dashboard",
            likes: savedLikes["weatherdashboard"]?.count || 0,
            liked: savedLikes["weatherdashboard"]?.liked || false,

            logs: []

        },
        {
            id: "mehdashboard",
            title: "Meh Dashboard",
            desc: "Interactive dashboard with charts and forecasts.",
            extended: "React + Chart.js with a clean UI. Uses external weather APIs, caching, and responsive chart layouts for mobile-friendly viewing.",
            tags: ["React", "Chart.js", "API"],
            status: { key: "under-maintenance", text: "Under Maintenance" },
            image: "Assets/Other_Images/Image_Placeholder.jpg",
            repo: "https://github.com/yourname/weather-dashboard",
            likes: savedLikes["mehdashboard"]?.count || 0,
            liked: savedLikes["mehdashboard"]?.liked || false,

            logs: []

        },
        {
            id: "mememanagement",
            title: "Meme Management App",
            desc: "Collaborative task management with real-time updates.",
            extended: "Built with Vue.js, Express, and Socket.io. Supports team workspaces, live task updates, mentions, and role-based permissions.",
            tags: ["Vue.js", "Express", "Socket.io", "MongoDB"],
            status: { key: "under-maintenance", text: "Under Maintenance" },
            image: "Assets/Other_Images/Image_Placeholder.jpg",
            repo: "https://github.com/yourname/taskapp",
            likes: savedLikes["mememanagement"]?.count || 0,
            liked: savedLikes["mememanagement"]?.liked || false,

            logs: []

        }
    ];

    /* Utilities */
    // If you rely on CSS data-status mapping, you don't need inline color logic.
    // Keep this only if you want to set colors via JS style overrides (not recommended here).
    // const statusColorKey = { ... }. Not used when using data-status in CSS

    const grid = document.getElementById("projects-grid");
    const searchInput = document.getElementById("project-search");
    const activeFilters = document.getElementById("active-filters");

    const modalRoot = document.getElementById("project-modal");
    const modalClose = document.getElementById("modal-close");
    const modalTitle = modalRoot.querySelector(".modal-title");
    const modalStatusDot = modalRoot.querySelector(".modal-status .status-dot");
    const modalStatusText = modalRoot.querySelector(".modal-status-text");
    const modalDesc = modalRoot.querySelector(".modal-description");
    const modalImg = modalRoot.querySelector(".modal-image img");
    const modalRepo = modalRoot.querySelector(".github-btn");

    let tagFilters = new Set();

    /* Render Card (Template) */
    function createProjectCard(project) {
        const tpl = document.getElementById("project-card-template");
        const node = tpl.content.firstElementChild.cloneNode(true);

        // Title, desc
        node.querySelector(".project-title").textContent = project.title;
        node.querySelector(".project-desc").textContent = project.desc;

        // Status via data-status (CSS handles colors)
        const statusDot = node.querySelector(".project-card-status .status-dot");
        const statusText = node.querySelector(".project-card-status-text");
        statusDot.setAttribute("data-status", project.status.key);
        statusText.textContent = project.status.text;
        statusText.classList.add("status-text");

        // Image
        const imgEl = node.querySelector(".project-image img");
        if (imgEl) {
            imgEl.src = project.image || "";
            imgEl.alt = project.title + " preview";
        }

        // Tags (limit + "+N more")
        const tagsWrap = node.querySelector(".project-tags");
        tagsWrap.innerHTML = "";

        const maxVisible = 3;
        const tags = project.tags;

        tags.slice(0, maxVisible).forEach(tag => {
            const span = document.createElement("span");
            span.className = "project-tag";
            span.textContent = tag;
            tagsWrap.appendChild(span);

            // Tag click to add to active filters
            span.addEventListener("click", (e) => {
                e.stopPropagation();
                tagFilters.add(tag);
                renderActiveFilters();
                renderProjects();
            });
        });

        if (tags.length > maxVisible) {
            const moreCount = tags.length - maxVisible;
            const moreTag = document.createElement("span");
            moreTag.className = "project-tag more-tag";
            moreTag.textContent = `+${moreCount} more`;

            // Tooltip container
            const tooltipBox = document.createElement("div");
            tooltipBox.className = "tooltip-box";

            tags.slice(maxVisible).forEach(t => {
                const hiddenTag = document.createElement("span");
                hiddenTag.className = "tooltip-tag";
                hiddenTag.textContent = t;
                tooltipBox.appendChild(hiddenTag);
            });

            moreTag.appendChild(tooltipBox);
            tagsWrap.appendChild(moreTag);
        }


        // Actions: likes
        const likeCountEl = node.querySelector(".like-count");
        const starBtn = node.querySelector(".star-btn");

        if (likeCountEl && starBtn) {
            likeCountEl.textContent = project.likes;
            starBtn.textContent = project.liked ? "🌟" : "⭐";

            starBtn.addEventListener("click", (e) => {
                e.stopPropagation();

                if (project.liked) {
                    project.likes = Math.max(0, project.likes - 1);
                    project.liked = false;
                    starBtn.textContent = "⭐";
                } else {
                    project.likes += 1;
                    project.liked = true;
                    starBtn.textContent = "🌟";
                }

                likeCountEl.textContent = project.likes;

                // Save to localStorage
                const saved = loadLikes();
                saved[project.id] = { count: project.likes, liked: project.liked };
                saveLikes(saved);
            });
        }

        // View details button opens modal
        node.querySelector(".project-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(project);
        });

        // Card click opens modal unless clicking actionable elements
        node.addEventListener("click", (e) => {
            const target = e.target;
            const isAction = target.classList.contains("project-btn") ||
                target.classList.contains("project-tag") ||
                target.classList.contains("star-btn");
            if (!isAction) openModal(project);
        });

        return node;
    }

    /* Render Active Filters */
    function renderActiveFilters() {
        activeFilters.innerHTML = "";
        tagFilters.forEach(tag => {
            const chip = document.createElement("span");
            chip.className = "filter-chip";
            chip.innerHTML = `${tag} <button type="button" aria-label="Remove ${tag} filter">✕</button>`;
            chip.querySelector("button").addEventListener("click", () => {
                tagFilters.delete(tag);
                renderActiveFilters();
                renderProjects();
            });
            activeFilters.appendChild(chip);
        });
    }

    /* Render Projects */
    function renderProjects() {
        const q = (searchInput.value || "").toLowerCase();
        grid.innerHTML = "";

        const filtered = projects.filter(p => {
            const matchesText =
                p.title.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q) ||
                p.extended.toLowerCase().includes(q) ||
                p.tags.some(tag => tag.toLowerCase().includes(q));

            const matchesTags =
                tagFilters.size === 0 || [...tagFilters].every(t => p.tags.includes(t));

            return matchesText && matchesTags;
        });

        filtered.forEach(p => grid.appendChild(createProjectCard(p)));
    }

    /* Modal (Template-like population) */
    let scrollPosition = 0;

    function openModal(project) {
        scrollPosition = window.scrollY;

        // Populate modal content
        modalTitle.textContent = project.title;
        modalStatusDot.setAttribute("data-status", project.status.key);
        modalStatusText.textContent = project.status.text;
        modalStatusText.classList.add("status-text");
        modalDesc.textContent = project.extended;
        modalImg.src = project.image || "";
        modalImg.alt = project.title + " sample image";
        modalRepo.href = project.repo || "#";

        // Populate tags
        const modalTagsWrap = modalRoot.querySelector(".modal-tags");
        modalTagsWrap.innerHTML = "";
        project.tags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "modal-tag";
            span.textContent = tag;
            modalTagsWrap.appendChild(span);
        });

        // Populate logs
        const logsList = modalRoot.querySelector(".logs-list");
        logsList.innerHTML = "";
        if (project.logs && project.logs.length) {
            project.logs.forEach(log => {
                const li = document.createElement("li");
                li.textContent = log;
                logsList.appendChild(li);
            });
        } else {
            logsList.innerHTML = "<li>No updates yet.</li>";
        }

        // Show modal
        modalRoot.style.display = "flex";
        modalRoot.setAttribute("aria-hidden", "false");

        // Reset modal scroll to top
        const modalScroll = modalRoot.querySelector(".modal-scroll");
        if (modalScroll) modalScroll.scrollTop = 0;

        // Lock background scroll
        document.documentElement.classList.add("modal-open");
    }

    function closeModal() {
        modalRoot.style.display = "none";
        modalRoot.setAttribute("aria-hidden", "true");

        // Unlock background scroll
        document.documentElement.classList.remove("modal-open");

        // temporarily disable smooth scroll
        const html = document.documentElement;
        html.style.scrollBehavior = "auto";

        // restore scroll instantly
        window.scrollTo(0, scrollPosition);

        // re‑enable smooth scroll
        html.style.scrollBehavior = "";
    }

    /* Event bindings */
    modalClose.addEventListener("click", closeModal);
    modalRoot.addEventListener("click", (e) => {
        if (e.target === modalRoot) closeModal(); // click backdrop to close
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    /* Init */
    renderProjects();
    searchInput.addEventListener("input", renderProjects);

    /* Header status */
    const headerStatusDot = document.querySelector(".projects-status .status-dot");
    headerStatusDot.dataset.status = "updated"; //or in-progress, paused, blocked
});