/**
 * Main function to initialize all parts of the page once the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
    initTypingEffect();
    initSkills();
    initProjects();
});

/**
 * Initializes the typing effect in the hero section.
 */
function initTypingEffect() {
    const typingEffect = document.getElementById("typing-effect");
    if (!typingEffect) return; // Exit if element not found

    const text = "Computer Science Student";
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDuration = 5000;

    let charIndex = 0;
    let isDeleting = false;

    function type() {
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

    type();
}

/**
 * Initializes the animated skill bars.
 */
function initSkills() {
    document.querySelectorAll(".skill").forEach(skill => {
        const value = skill.getAttribute("data-skill");
        const color = skill.getAttribute("data-color") || "#388bff";
        const fill = skill.querySelector(".skill-fill");
        const percent = skill.querySelector(".skill-percent");

        if (fill && percent) {
            fill.style.width = value + "%";
            fill.style.backgroundColor = color;
            percent.textContent = value + "%";
        }
    });
}

/**
 * Initializes the entire projects section, including
 * data, rendering, filtering, and modal logic.
 */
function initProjects() {

    function loadLikes() {
        const saved = localStorage.getItem("projectLikes");
        return saved ? JSON.parse(saved) : {};
    }

    function saveLikes(likesObj) {
        localStorage.setItem("projectLikes", JSON.stringify(likesObj));
    }

    const savedLikes = loadLikes();
    /* DATA (Template-friendly). */
    /* Key = completed, in-progress, paused, under-maintenance */
    /* Text Values = Updated / Completed, In Progress, Paused, Under Maintenance */
    /* Logs = Format: "YYYY-MM-DD" -m */
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

    const grid = document.getElementById("projects-grid");
    const searchInput = document.getElementById("project-search");
    const activeFilters = document.getElementById("active-filters");
    const filterSelect = document.querySelector('.project-filter');
    const headerStatusDot = document.querySelector(".projects-status .status-dot");
    const modalRoot = document.getElementById("project-modal");

    // Exit if crucial elements are missing
    if (!grid || !searchInput || !filterSelect || !modalRoot) {
        console.warn("Project script exiting: crucial elements not found.");
        return;
    }

    const modalClose = document.getElementById("modal-close");
    const modalTitle = modalRoot.querySelector(".modal-title");
    const modalStatusDot = modalRoot.querySelector(".modal-status .status-dot");
    const modalStatusText = modalRoot.querySelector(".modal-status-text");
    const modalDesc = modalRoot.querySelector(".modal-description");
    const modalImg = modalRoot.querySelector(".modal-image img");
    const modalRepo = modalRoot.querySelector(".github-btn");
    const modalTagsWrap = modalRoot.querySelector(".modal-tags");
    const logsList = modalRoot.querySelector(".logs-list");
    const modalScroll = modalRoot.querySelector(".modal-scroll");

    let tagFilters = new Set();
    let emptyState; // will hold our dynamic message element
    let scrollPosition = 0;

    /**
     * Creates a project card DOM element from a project object.
     */
    function createProjectCard(project) {
        const tpl = document.getElementById("project-card-template");
        const node = tpl.content.firstElementChild.cloneNode(true);

        node.querySelector(".project-title").textContent = project.title;
        node.querySelector(".project-desc").textContent = project.desc;

        const statusDot = node.querySelector(".project-card-status .status-dot");
        const statusText = node.querySelector(".project-card-status-text");
        statusDot.setAttribute("data-status", project.status.key);
        statusText.textContent = project.status.text;
        statusText.classList.add("status-text");

        const imgEl = node.querySelector(".project-image img");
        if (imgEl) {
            imgEl.src = project.image || "";
            imgEl.alt = project.title + " preview";
        }

        const tagsWrap = node.querySelector(".project-tags");
        tagsWrap.innerHTML = "";
        const maxVisible = 3;
        const tags = project.tags;

        tags.slice(0, maxVisible).forEach(tag => {
            const span = document.createElement("span");
            span.className = "project-tag";
            span.textContent = tag;
            tagsWrap.appendChild(span);
            span.addEventListener("click", (e) => {
                e.stopPropagation();
                tagFilters.add(tag);
                renderActiveFilters();
                renderProjects(); // Re-render projects when tag is added
            });
        });

        if (tags.length > maxVisible) {
            const moreCount = tags.length - maxVisible;
            const moreTag = document.createElement("span");
            moreTag.className = "project-tag more-tag";
            moreTag.textContent = `+${moreCount} more`;

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

        const likeCountEl = node.querySelector(".like-count");
        const starBtn = node.querySelector(".star-btn");
        if (likeCountEl && starBtn) {
            likeCountEl.textContent = project.likes;
            starBtn.textContent = project.liked ? "🌟" : "⭐";

            starBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                project.liked = !project.liked;
                project.likes += project.liked ? 1 : -1;
                project.likes = Math.max(0, project.likes); // Prevent negative likes

                starBtn.textContent = project.liked ? "🌟" : "⭐";
                likeCountEl.textContent = project.likes;

                const saved = loadLikes();
                saved[project.id] = { count: project.likes, liked: project.liked };
                saveLikes(saved);
            });
        }

        node.querySelector(".project-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(project);
        });

        node.addEventListener("click", (e) => {
            const target = e.target;
            const isAction = target.closest(".project-btn, .project-tag, .star-btn");
            if (!isAction) openModal(project);
        });

        return node;
    }

    /**
     * Renders the active tag filters as chips.
     */
    function renderActiveFilters() {
        activeFilters.innerHTML = "";
        tagFilters.forEach(tag => {
            const chip = document.createElement("span");
            chip.className = "filter-chip";
            chip.innerHTML = `${tag} <button type="button" aria-label="Remove filter ${tag}">✕</button>`;

            chip.querySelector("button").addEventListener("click", () => {
                tagFilters.delete(tag);
                renderActiveFilters();
                renderProjects(); // Re-render projects when tag is removed
            });

            activeFilters.appendChild(chip);
        });
    }

    /**
     * Creates or returns the 'empty state' message element.
     */
    function ensureEmptyState() {
        if (emptyState) return emptyState;

        emptyState = document.createElement("div");
        emptyState.className = "projects-empty";
        emptyState.style.textAlign = "center";
        emptyState.style.padding = "80px";
        emptyState.style.color = "#555";
        emptyState.style.fontSize = "1.5rem";
        emptyState.innerHTML = `<p>No matching projects or tags found.</p>`;

        grid.parentNode.insertBefore(emptyState, grid.nextSibling);
        return emptyState;
    }

    /**
     * Renders the project grid based on ALL current filters.
     */
    function renderProjects() {
        const q = (searchInput.value || "").toLowerCase();
        const statusFilter = filterSelect.value;

        grid.innerHTML = "";

        const filteredProjects = projects.filter(p => {
            // Stage 1: Filter by Status
            const matchesStatus = (statusFilter === 'all') || (p.status.key === statusFilter);
            if (!matchesStatus) return false;

            // Stage 2: Filter by Tags
            const matchesTags = (tagFilters.size === 0) || [...tagFilters].every(t => p.tags.includes(t));
            if (!matchesTags) return false;

            // Stage 3: Filter by Search Query
            const matchesText = !q ||
                p.title.toLowerCase().includes(q) ||
                p.desc.toLowerCase().includes(q) ||
                p.tags.some(tag => tag.toLowerCase().includes(q));

            return matchesText; // Must pass all filters
        });

        // Render cards
        filteredProjects.forEach(p => grid.appendChild(createProjectCard(p)));

        // Toggle empty state
        const empty = ensureEmptyState();
        empty.style.display = filteredProjects.length === 0 ? "block" : "none";
    }

    /**
     * Opens and populates the project details modal.
     */
    function openModal(project) {
        scrollPosition = window.scrollY;

        modalTitle.textContent = project.title;
        modalStatusDot.setAttribute("data-status", project.status.key);
        modalStatusText.textContent = project.status.text;
        modalStatusText.classList.add("status-text");
        modalDesc.textContent = project.extended;
        modalImg.src = project.image || "";
        modalImg.alt = project.title + " sample image";
        modalRepo.href = project.repo || "#";

        // Tags under heading
        modalTagsWrap.innerHTML = "";
        project.tags.forEach(tag => {
            const span = document.createElement("span");
            span.className = "modal-tag";
            span.textContent = tag;
            modalTagsWrap.appendChild(span);
        });

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


        modalRoot.style.display = "flex";
        modalRoot.setAttribute("aria-hidden", "false");
        modalClose.focus();

        document.documentElement.classList.add("modal-open");
    }


    /**
     * Closes the project details modal and restores scroll.
     */
    function closeModal() {
        modalRoot.style.display = "none";
        modalRoot.setAttribute("aria-hidden", "true");
        document.documentElement.classList.remove("modal-open");

        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, scrollPosition);
        html.style.scrollBehavior = "";
    }

    // Modal listeners
    modalClose.addEventListener("click", closeModal);
    modalRoot.addEventListener("click", (e) => {
        if (e.target === modalRoot) closeModal();
    });
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    // Filter listeners
    searchInput.addEventListener("input", renderProjects);
    filterSelect.addEventListener('change', renderProjects);

    // Set header status dot
    if (headerStatusDot) {
        headerStatusDot.dataset.status = "updated";
    }

    // Initial render
    renderProjects();
}