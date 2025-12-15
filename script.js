/*
 * Main function to initialize all parts of the page once the DOM is loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
    initTypingEffect();
    initSkills();
    initProjects();
});

/*
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

/*
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

/*
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

    /* helper: escape HTML to prevent XSS when inserting formatted text */
    function escapeHtml(unsafe) {
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* helper: convert plain text into paragraphs.
       - Double newlines (\n\n) -> separate <p> blocks
       - Single newline -> <br>
    */
    function formatParagraphs(text) {
        if (!text) return "";
        // normalize line endings
        text = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        // split by two-or-more newlines into paragraphs
        const paras = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
        return paras.map(p => "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>").join("");
    }

    /* DATA (Template-friendly). */
    /* Key = completed, in-progress, paused, under-maintenance */
    /* Text Values = Updated / Completed, In Progress, Paused, Under Maintenance */
    /* Logs = Format: "YYYY-MM-DD" -m */
    const projects = [
        {
            id: "tipairlines",
            title: "TIP Airlines Booking System",
            desc: "A Flight Booking Program and Flights Management Database.",
            extended: "TIP Airlines is a comprehensive Flight Booking Program and Flights Management Database designed to simulate the core operations of an airline reservation system.\n\n Developed as our first computer programming group project during our first year, it represents both a milestone in our learning journey and a practical application of fundamental programming and database concepts.",
            images: [
                "Assets/Project_Images/TIP Airlines/TIP Airlines.png",
                "Assets/Project_Images/TIP Airlines/TIP.png"
            ],
            tags: ["Python", "Group-Project", "Flight-Booking-System", "SQLite", "Database-Management", "First-Year-Project"],
            status: { key: "completed", text: "Completed" },
            repo: "https://github.com/FlimsyOwl12/Project_CompProg_DataBase.git",
            likes: savedLikes["tipairlines"]?.count || 0,
            liked: savedLikes["tipairlines"]?.liked || false,
            logs: [
                "2024-12-17: Repository has been set to private.",
                "2024-12-16: Submitted final output.",
                "2024-12-16: Final testing before submission.",
                "2024-12-15: Updated README with project overview",
                "2024-12-15: Designed database schema and created initial tables",
                "2024-12-14: Implemented flight search and booking features",
                "2024-12-12: Currently fixing checkout flow bugs",
                "2024-12-08: Created project repository and initial planning"
            ]
        },
        {
            id: "pastryshopmanagementsystem",
            title: "Pastry Shop Management System",
            desc: "Pastry Shop Management System streamlines pastry shop operations by handling product inventory, customer orders, and sales records in a simple, efficient way.",
            extended: "Pastry Shop Management System streamlines pastry shop operations by handling product inventory, customer orders, and sales records in a simple, efficient way.\n\n It is a group project developed in our 2nd year, and was built with Java for the program logic and MySQL for database management, it provides a structured way to manage products, customers, and transactions.",
            images: [
                "Assets/Project_Images/Pastry Shop Management System/Pastry Shop Management System.png",
            ],
            tags: ["Java", "MySQL", "Database-Management", "Group-Project", "First-Year-Project"],
            status: { key: "completed", text: "Completed" },
            repo: "https://github.com/FlimsyOwl12/Project_CompProg_DataBase.git",
            likes: savedLikes["tipairlines"]?.count || 0,
            liked: savedLikes["tipairlines"]?.liked || false,
            logs: [
                "2025-12-17: Repository has been set to private.",
                "2025-12-16: Submitted final output.",
                "2025-12-16: Final testing before submission.",
                "2025-12-15: Updated README with project overview",
                "2025-12-15: Designed database schema and created initial tables",
                "2025-12-14: Implemented flight search and booking features",
                "2025-12-12: Currently fixing checkout flow bugs",
                "2025-12-08: Created project repository and initial planning"
            ]
        },
    ];

    const grid = document.getElementById("projects-grid");
    const searchInput = document.getElementById("project-search");
    const activeFilters = document.getElementById("active-filters");
    const filterSelect = document.querySelector('.project-filter');
    const headerStatusDot = document.querySelector(".projects-status .status-dot");
    const modalRoot = document.getElementById("project-modal");

    // Background nodes to mark aria-hidden while modal is open
    const backgroundNodes = document.querySelectorAll("header, main, footer");

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
    let emptyState; // will hold dynamic message element
    let scrollPosition = 0;

    /*
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
            // use first image if images[] exists, fall back to singular image property
            imgEl.src = (project.images && project.images[0]) || project.image || "";
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

        node.querySelector(".project-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            openModal(project);
        });

        return node;
    }

    /*
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

    /*
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

    /*
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

    // modal slideshow state
    let modalImages = [];
    let modalImageIndex = 0;
    let modalKeyHandler = null;

    function showModalImage(index) {
        const imgEl = document.getElementById("modal-image-el");
        const counter = document.getElementById("modal-image-counter");
        const prevBtn = document.getElementById("modal-prev");
        const nextBtn = document.getElementById("modal-next");
        if (!imgEl) return;
        modalImageIndex = (index + modalImages.length) % modalImages.length;
        imgEl.src = modalImages[modalImageIndex] || "";
        // update counter and arrows
        if (counter) counter.textContent = `${modalImageIndex + 1} / ${modalImages.length}`;
        if (modalImages.length <= 1) {
            prevBtn?.classList.add("hidden");
            nextBtn?.classList.add("hidden");
            counter?.setAttribute("aria-hidden", "true");
        } else {
            prevBtn?.classList.remove("hidden");
            nextBtn?.classList.remove("hidden");
            counter?.setAttribute("aria-hidden", "false");
        }
    }

    function prevModalImage(e) { if (e) e.stopPropagation(); showModalImage(modalImageIndex - 1); }
    function nextModalImage(e) { if (e) e.stopPropagation(); showModalImage(modalImageIndex + 1); }

    function attachModalImageListeners() {
        const prevBtn = document.getElementById("modal-prev");
        const nextBtn = document.getElementById("modal-next");
        prevBtn?.addEventListener("click", prevModalImage);
        nextBtn?.addEventListener("click", nextModalImage);
        // keyboard navigation while modal open
        modalKeyHandler = (ev) => {
            if (ev.key === "ArrowLeft") prevModalImage(ev);
            if (ev.key === "ArrowRight") nextModalImage(ev);
        };
        document.addEventListener("keydown", modalKeyHandler);
    }

    function detachModalImageListeners() {
        const prevBtn = document.getElementById("modal-prev");
        const nextBtn = document.getElementById("modal-next");
        prevBtn?.removeEventListener("click", prevModalImage);
        nextBtn?.removeEventListener("click", nextModalImage);
        if (modalKeyHandler) {
            document.removeEventListener("keydown", modalKeyHandler);
            modalKeyHandler = null;
        }
    }

    /*
     * Opens and populates the project details modal.
     */
    function openModal(project) {
        scrollPosition = window.scrollY;

        // Mark background for screen readers & add CSS class that prevents scrolling and interactions
        backgroundNodes.forEach(node => node.setAttribute("aria-hidden", "true"));
        document.documentElement.classList.add("modal-open");

        modalTitle.textContent = project.title;
        modalStatusDot.setAttribute("data-status", project.status.key);
        modalStatusText.textContent = project.status.text;
        modalStatusText.classList.add("status-text");
        // description (preserve paragraphs and line breaks)
        modalDesc.innerHTML = formatParagraphs(project.extended || "");
        // setup images array (prefer project.images)
        modalImages = (project.images && project.images.slice()) || (project.image ? [project.image] : []);
        // set modal image element and counter
        showModalImage(0);
        attachModalImageListeners();

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
    }

    /**
     * Closes the project details modal and restores scroll.
     */
    function closeModal() {
        // cleanup image listeners
        detachModalImageListeners();
        modalImages = [];
        modalImageIndex = 0;
        const imgEl = document.getElementById("modal-image-el");
        if (imgEl) imgEl.src = "";
        const counter = document.getElementById("modal-image-counter");
        if (counter) counter.textContent = "";

        modalRoot.style.display = "none";
        modalRoot.setAttribute("aria-hidden", "true");

        // Remove aria hidden and CSS class to restore background interactions & scrolling
        backgroundNodes.forEach(node => node.removeAttribute("aria-hidden"));
        document.documentElement.classList.remove("modal-open");

        const html = document.documentElement;
        html.style.scrollBehavior = "auto";
        window.scrollTo(0, scrollPosition);
        html.style.scrollBehavior = "";
    }

    // Modal listeners
    modalClose.addEventListener("click", closeModal);

    // Backdrop click and Escape-to-close handlers removed so only the X button closes the modal.

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