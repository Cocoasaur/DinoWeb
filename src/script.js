// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTypingEffect();
    initProjects();
    initScrollAnimations();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    // Throttle function for performance
    function throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            if (!timeout) {
                func.apply(this, args);
                timeout = setTimeout(() => {
                    timeout = null;
                }, wait);
            }
        };
    }

    // Initialize modal operation flag
    window.isModalOperation = false;

    // Navbar scroll effect with throttle
    const handleNavbarScroll = throttle(() => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 100);

    // Mobile menu toggle
    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu?.classList.contains('active') &&
            !navMenu.contains(e.target) &&
            !navToggle?.contains(e.target)) {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
            navToggle?.classList.remove('active');
            navMenu?.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });

    // Function to update active nav link based on scroll position
    function updateActiveNavLink() {
        if (window.isModalOperation) return;

        const scrollY = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Special case: at bottom of page
        if (scrollY + windowHeight >= documentHeight - 50) {
            navLinks.forEach(link => link.classList.remove('active'));
            const lastSection = sections[sections.length - 1];
            if (lastSection) {
                const lastSectionId = lastSection.getAttribute('id');
                const lastNavLink = document.querySelector(`.nav-link[href="#${lastSectionId}"]`);
                lastNavLink?.classList.add('active');
            }
            return;
        }

        // Find active section
        let activeSection = null;
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                activeSection = section;
            }
        });

        // Update nav links
        navLinks.forEach(link => link.classList.remove('active'));
        if (activeSection) {
            const sectionId = activeSection.getAttribute('id');
            const activeNavLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            activeNavLink?.classList.add('active');
        }
    }

    // Make updateActiveNavLink available globally
    window.updateActiveNavLink = updateActiveNavLink;

    // Scroll event with throttle for performance
    const handleScroll = throttle(() => {
        handleNavbarScroll();
        updateActiveNavLink();
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Set initial active state
    updateActiveNavLink();
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
    const typingText = document.getElementById('typing-text');
    if (!typingText) return;

    const roles = [
        'Computer Science Student',
        'Problem Solver'
    ];

    let roleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    function type() {
        const currentRole = roles[roleIndex];

        if (isDeleting) {
            typingText.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            typingSpeed = 50;
        } else {
            typingText.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            typingSpeed = 100;
        }

        if (!isDeleting && charIndex === currentRole.length) {
            isDeleting = true;
            typingSpeed = 2000;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            typingSpeed = 500;
        }

        setTimeout(type, typingSpeed);
    }

    type();
}

// ===== PROJECTS =====
/* Project data */
/* DATA (Template-friendly). */
/* Key = completed, in-progress, paused, under-maintenance */
/* Text Values = Updated / Completed, In Progress, Paused, Under Maintenance */
/* Logs = Format: "YYYY-MM-DD" -m */
function initProjects() {
    const projectsData = [
        {
            id: 'tipairlines',
            title: 'TIP Airlines Booking System',
            description: 'A comprehensive Flight Booking Program and Flights Management Database designed to simulate the core operations of an airline reservation system.',
            extendedDescription: `TIP Airlines is a comprehensive Flight Booking Program and Flights Management Database designed to simulate the core operations of an airline reservation system.

Developed as our first computer programming group project during our first year, it represents both a milestone in our learning journey and a practical application of fundamental programming and database concepts.

The system features a user-friendly interface for booking flights, managing reservations, and handling customer data. It integrates seamlessly with a SQLite database to ensure data persistence and efficient query handling.`,
            images: [
                '../Assets/Project_Images/TIP Airlines/TIP Airlines.png',
                '../Assets/Project_Images/TIP Airlines/TIP Airlines2.png',
                '../Assets/Project_Images/TIP Airlines/TIP Airlines3.png',
                '../Assets/Project_Images/TIP Airlines/TIP.png'
            ],
            tags: ['Python', 'SQLite', 'Database Management', 'Group Project'],
            status: 'completed',
            repository: 'https://github.com/FlimsyOwl12/Project_CompProg_DataBase.git',
            logs: [
                '2024-12-17: Repository has been set to private.',
                '2024-12-16: Submitted final output.',
                '2024-12-16: Final testing before submission.',
                '2024-12-15: Updated README with project overview',
                '2024-12-15: Designed database schema and created initial tables',
                '2024-12-14: Implemented flight search and booking features',
                '2024-12-12: Currently fixing checkout flow bugs',
                '2024-12-08: Created project repository and initial planning'
            ]
        },
        {
            id: 'pastryshopmanagementsystem',
            title: 'Pastry Shop Management System',
            description: 'Streamlines pastry shop operations by handling product inventory, customer orders, and sales records in a simple, efficient way.',
            extendedDescription: `Pastry Shop Management System streamlines pastry shop operations by handling product inventory, customer orders, and sales records in a simple, efficient way.

It is a group project developed in our 2nd year, built with Java for the program logic and MySQL for database management. It provides a structured way to manage products, customers, and transactions.

The system includes features for inventory tracking, order processing, sales reporting, and customer management. Built with a focus on usability and efficiency, it helps small businesses manage their daily operations effectively.`,
            images: [
                '../Assets/Project_Images/Pastry Shop Management System/Pastry Shop Management System.png'
            ],
            tags: ['Java', 'MySQL', 'Database Management', 'Group Project'],
            status: 'completed',
            repository: 'https://github.com/FlimsyOwl12/Project_CompProg_DataBase.git',
            logs: [
                '2025-05-18: Project completed and submitted',
                '2025-05-18: Final testing and bug fixes',
                '2025-05-15: Implemented features for different process flows and user roles',
                '2025-05-11: Bug fixes and code cleanup',
                '2025-05-07: Created project repository and initial planning',
            ]
        },
        {
            id: 'eartharcade',
            title: 'Earth Arcade',
            description: 'A 2D progressive arcade game that combines fun mini-games with lessons in environmental awareness.',
            extendedDescription: `Earth Arcade is a 2D progressive arcade game experience that combines all the fun mini-games with lessons in environmental awareness. Developed in GDscript with the Godot Engine during the GAME ON Hackathon, this 2D progressive arcade game blends fun mini-games with environmental awareness.

Players advance through levels by performing eco-friendly actions, like proper waste disposal, planting, and cleaning oceans, turning small sustainable habits into engaging gameplay that highlights how everyday choices can make a big difference for our planet.

Team Members:
• Gilo, Janwel - Project Lead
• Andrada, Rey Jane - Full Stack Developer
• Arquesola, John Jessienel - Full Stack Developer
• Baja, Riza May - Front End/Graphics Designer
• Solis, Charleign Kim - Front End/Graphics Designer`,
            images: [
                '../Assets/Project_Images/EarthArcade/EarthArcade1.png',
                '../Assets/Project_Images/EarthArcade/EarthArcade2.png',
                '../Assets/Project_Images/EarthArcade/EarthArcade3.png',
                '../Assets/Project_Images/EarthArcade/EarthArcade4.png',
                '../Assets/Project_Images/EarthArcade/EarthArcade5.png'
            ],
            tags: ['Godot', 'GDScript', '2D Game', 'Group Project', 'Hackathon'],
            status: 'paused',
            repository: 'https://github.com/FlimsyOwl12/GAME-ON-Hackathon-Earth-Arcade.git',
            logs: [
                '2025-08-31: Hackathon ends with out entering semi-finals',
                '2025-08-31: Final testing and polish for hackathon submission',
                '2025-08-30: Created tutorial and instructions for players',
                '2025-08-29: Fixed transition issues between scenes and cutscene 3 storyline added',
                '2025-08-28: Adjustments with cutscenes and game flow',
                '2025-08-27: Fixed last commit issue and clean up codebase',
                '2025-08-26: Updated cutscenes and added game 2',
                '2025-08-25: Added new assets and code optimizations',
                '2025-08-24: Added background music and cutscenes',
                '2025-08-23: Created game mechanics and level progression',
                '2025-08-22: Initial project setup and team organization'
            ]
        },
        {
            id: 'dinoweb',
            title: 'DinoWeb',
            description: 'My personal portfolio website showcasing my skills, projects, and experience in computer science.',
            extendedDescription: `DinoWeb is my personal portfolio website showcasing my skills, projects, and other information. It is built using HTML, CSS, and JavaScript to highlight my work and experience in the field of computer science.

The portfolio features a modern, responsive design with smooth animations and interactive elements. It includes sections for my projects, skills, about me, and contact information.

This website serves as my online presence and a platform to showcase my work to potential employers and collaborators.`,
            images: [
                '../Assets/Project_Images/DinoWebsite/DinoWebsite1.png',
                '../Assets/Project_Images/DinoWebsite/DinoWebsite2.png',
                '../Assets/Project_Images/DinoWebsite/DinoWebsite3.png'
            ],
            tags: ['HTML', 'CSS', 'JavaScript', 'Portfolio', 'Web Design'],
            status: 'in-progress',
            repository: 'https://github.com/Cocoasaur/DinoWeb',
            logs: [
                '2026-02-15: Complete redesign with modern UI/UX, and assignment of legacy design of the previous website state',
                '2026-02-08: Improved responsive design',
                '2026-02-02: Updated markdown file',
                '2025-12-25: Updated js const var values and project data',
                '2025-12-19: Project adjustments and refinements',
                '2025-12-16: Added more assets and project refinements',
                '2025-12-15: Added new js logic for truncating project descriptions and showing full description on click',
                '2025-12-14: Updated markdown files and project descriptions, updated html, css, and js files for refinements',
                '2025-11-07: Modified html strucuture for uniformity',
                '2025-11-05: Update web functions and fixed styles',
                '2025-10-24: Pop up modal for project details implemented',
                '2025-10-09: Assets and content updates',
                '2025-10-02: Redesign and code refactor for better performance and maintainability',
                '2025-09-08: Continuation of project development and improvements',
                '2025-08-04: Modified project styles and created 2nd iteration of the project',
                '2025-08-03: Initial project setup and design planning',
            ]
        }
    ];

    const projectsGrid = document.getElementById('projects-grid');
    const searchInput = document.getElementById('project-search');
    const filterSelect = document.getElementById('filter-select');
    const customFilter = document.getElementById('custom-filter');
    const filterTrigger = document.getElementById('filter-trigger');
    const filterTriggerText = document.getElementById('filter-trigger-text');
    const filterMenu = document.getElementById('filter-menu');
    const filterOptions = filterMenu?.querySelectorAll('.custom-filter-option');
    const emptyState = document.getElementById('empty-state');
    const template = document.getElementById('project-card-template');

    if (!projectsGrid || !template) {
        console.error('Required elements not found: projectsGrid or template');
        return;
    }

    if (!searchInput) {
        console.warn('Search input not found - search functionality will be disabled');
    }

    if (!filterSelect) {
        console.warn('Filter select not found - filter functionality will be disabled');
    }

    if (!customFilter) {
        console.warn('Custom filter not found - custom dropdown functionality will be disabled');
    }

    let currentFilter = filterSelect?.value || 'all';
    let searchQuery = '';

    // Render projects
    function renderProjects() {
        projectsGrid.innerHTML = '';

        const filtered = projectsData.filter(project => {
            const matchesFilter = currentFilter === 'all' || project.status === currentFilter;

            // Improved search matching - handle empty/whitespace queries
            const trimmedQuery = searchQuery.trim();
            const matchesSearch = trimmedQuery === '' ||
                project.title.toLowerCase().includes(trimmedQuery) ||
                project.description.toLowerCase().includes(trimmedQuery) ||
                project.tags.some(tag => tag.toLowerCase().includes(trimmedQuery));

            return matchesFilter && matchesSearch;
        });

        console.log('Filtered projects:', filtered.length);

        if (filtered.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        filtered.forEach(project => {
            const card = createProjectCard(project);
            if (card) {
                projectsGrid.appendChild(card);
            }
        });
    }

    // Create project card
    function createProjectCard(project) {
        try {
            const card = template.content.cloneNode(true);
            const article = card.querySelector('.project-card');

            if (!article) {
                console.error('Could not find .project-card in template');
                return null;
            }

            // Add is-visible class immediately for dynamically created cards
            article.classList.add('is-visible');

            // Update selectors for new structure
            const img = article.querySelector('.project-card-image-bg img');
            const title = article.querySelector('.project-card-title');
            const desc = article.querySelector('.project-card-desc');
            const statusDot = article.querySelector('.project-card-status .status-dot');

            if (img) {
                img.src = project.images[0];
                img.alt = project.title;
            }
            if (title) title.textContent = project.title;
            if (desc) desc.textContent = project.description;
            if (statusDot) statusDot.dataset.status = project.status;

            const tagsContainer = article.querySelector('.project-card-tags');
            if (tagsContainer) {
                const visibleTags = project.tags.slice(0, 2);
                const hiddenTags = project.tags.slice(2);

                visibleTags.forEach(tag => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'project-tag';
                    tagEl.textContent = tag;
                    tagsContainer.appendChild(tagEl);
                });

                if (hiddenTags.length > 0) {
                    const moreTag = document.createElement('span');
                    moreTag.className = 'project-tag more-tags';
                    moreTag.textContent = `+${hiddenTags.length}`;
                    moreTag.dataset.tags = JSON.stringify(hiddenTags);

                    // Add tooltip functionality
                    moreTag.addEventListener('mouseenter', (e) => showTagTooltip(e, hiddenTags));
                    moreTag.addEventListener('mouseleave', hideTagTooltip);
                    moreTag.addEventListener('mousemove', updateTooltipPosition);

                    tagsContainer.appendChild(moreTag);
                }
            }

            // IMPORTANT: Only the button triggers the modal, NOT the card itself
            const viewBtn = article.querySelector('.project-view-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(project);
                });
            }

            console.log('Created card for:', project.title);
            return article;
        } catch (error) {
            console.error('Error creating project card:', error, project);
            return null;
        }
    }

    // Tag tooltip functionality
    const tooltip = document.getElementById('tag-tooltip');
    const tooltipContent = tooltip?.querySelector('.tag-tooltip-content');
    let currentTooltipEvent = null;

    function showTagTooltip(event, tags) {
        if (!tooltip || !tooltipContent) return;

        currentTooltipEvent = event;
        tooltipContent.innerHTML = '';

        tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'project-tag';
            tagEl.textContent = tag;
            tooltipContent.appendChild(tagEl);
        });

        tooltip.setAttribute('aria-hidden', 'false');
        updateTooltipPosition(event);
    }

    function hideTagTooltip() {
        if (!tooltip) return;
        tooltip.setAttribute('aria-hidden', 'true');
        currentTooltipEvent = null;
    }

    function updateTooltipPosition(event) {
        if (!tooltip || tooltip.getAttribute('aria-hidden') === 'true') return;

        const e = event || currentTooltipEvent;
        if (!e) return;

        const tooltipRect = tooltip.getBoundingClientRect();
        const offset = 10;

        let x = e.clientX + offset;
        let y = e.clientY + offset;

        // Keep tooltip within viewport
        if (x + tooltipRect.width > window.innerWidth) {
            x = e.clientX - tooltipRect.width - offset;
        }
        if (y + tooltipRect.height > window.innerHeight) {
            y = e.clientY - tooltipRect.height - offset;
        }

        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
    }

    // Search and filter
    searchInput?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderProjects();
    });

    function updateFilterUI(value) {
        if (!filterOptions || !filterTriggerText) return;

        let activeLabel = 'All Projects';
        filterOptions.forEach(option => {
            const isActive = option.dataset.value === value;
            option.classList.toggle('active', isActive);
            option.setAttribute('aria-selected', String(isActive));
            if (isActive) activeLabel = option.textContent.trim();
        });
        filterTriggerText.textContent = activeLabel;
    }

    function closeCustomFilter() {
        if (!customFilter || !filterTrigger) return;
        customFilter.classList.remove('open');
        filterTrigger.setAttribute('aria-expanded', 'false');
    }

    function applyFilter(value) {
        currentFilter = value;
        if (filterSelect && filterSelect.value !== value) {
            filterSelect.value = value;
        }
        updateFilterUI(value);
        renderProjects();
        closeCustomFilter();
    }

    filterSelect?.addEventListener('change', (e) => {
        applyFilter(e.target.value);
    });

    filterTrigger?.addEventListener('click', () => {
        if (!customFilter) return;
        const isOpen = customFilter.classList.toggle('open');
        filterTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    filterOptions?.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            if (!value) return;
            applyFilter(value);
        });
    });

    document.addEventListener('click', (e) => {
        if (!customFilter) return;
        if (!customFilter.contains(e.target)) {
            closeCustomFilter();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCustomFilter();
        }
    });

    updateFilterUI(currentFilter);

    // Modal functionality
    const modal = document.getElementById('project-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');
    const modalTitle = document.getElementById('modal-title');
    const modalStatusDot = document.getElementById('modal-status-dot');
    const modalStatusText = document.getElementById('modal-status-text');
    const modalTags = document.getElementById('modal-tags');
    const modalDescription = document.getElementById('modal-description');
    const modalLogsList = document.getElementById('modal-logs-list');
    const modalRepoLink = document.getElementById('modal-repo-link');
    const modalImage = document.getElementById('modal-image');
    const galleryCounter = document.getElementById('gallery-counter');
    const galleryPrev = document.getElementById('gallery-prev');
    const galleryNext = document.getElementById('gallery-next');
    const galleryThumbnails = document.getElementById('gallery-thumbnails');

    let currentProject = null;
    let currentImageIndex = 0;

    let savedScrollPosition = 0;

    function lockPageScroll() {
        savedScrollPosition = window.pageYOffset;
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        document.body.style.top = `-${savedScrollPosition}px`;
    }

    function unlockPageScroll() {
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.top = '';
        window.scrollTo(0, savedScrollPosition);
    }

    function getScrollableParent(element) {
        let el = element;
        while (el && el !== document.body) {
            const isScrollable = el.scrollHeight > el.clientHeight;
            if (isScrollable) return el;
            el = el.parentElement;
        }
        return null;
    }

    function shouldPreventWheelScroll(event) {
        if (modal.getAttribute('aria-hidden') !== 'false') return false;

        const modalContainer = event.target.closest('.modal-container');
        if (!modalContainer) return true;

        const deltaY = event.deltaY || 0;
        const scrollable = getScrollableParent(event.target);
        if (!scrollable) return true;

        const atTop = scrollable.scrollTop <= 0;
        const atBottom = scrollable.scrollTop + scrollable.clientHeight >= scrollable.scrollHeight - 1;

        if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
            return true;
        }
        return false;
    }

    function handleModalWheel(event) {
        if (shouldPreventWheelScroll(event)) {
            event.preventDefault();
        }
    }

    function handleModalTouchMove(event) {
        if (modal.getAttribute('aria-hidden') === 'false') {
            const modalContainer = event.target.closest('.modal-container');
            if (!modalContainer) {
                event.preventDefault();
            }
        }
    }

    function openModal(project) {
        currentProject = project;
        currentImageIndex = 0;

        modalTitle.textContent = project.title;
        modalStatusDot.dataset.status = project.status;
        modalStatusText.textContent = getStatusText(project.status);

        modalTags.innerHTML = '';
        project.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'modal-tag';
            tagEl.textContent = tag;
            modalTags.appendChild(tagEl);
        });

        modalDescription.innerHTML = formatDescription(project.extendedDescription);

        modalLogsList.innerHTML = '';
        if (project.logs.length > 0) {
            project.logs.forEach(log => {
                const li = document.createElement('li');
                li.textContent = log;
                modalLogsList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No development logs available.';
            modalLogsList.appendChild(li);
        }

        modalRepoLink.href = project.repository;
        setupGallery(project.images);

        // Lock page scroll while modal is open
        window.isModalOperation = true;
        lockPageScroll();
        document.addEventListener('wheel', handleModalWheel, { passive: false });
        document.addEventListener('touchmove', handleModalTouchMove, { passive: false });

        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('active');
    }

    function closeModal() {
        // Close modal immediately
        modal.setAttribute('aria-hidden', 'true');
        modal.classList.remove('active');
        currentProject = null;

        // Prevent hash changes
        if (window.location.hash) {
            history.replaceState(null, null, ' ');
        }

        // Unlock page scroll and restore original scroll position
        unlockPageScroll();
        document.removeEventListener('wheel', handleModalWheel);
        document.removeEventListener('touchmove', handleModalTouchMove);

        // Clear modal flag and refresh active nav state
        window.isModalOperation = false;
        if (window.updateActiveNavLink) {
            setTimeout(() => window.updateActiveNavLink(), 0);
        }
    }

    // Keep compatibility with inline onclick in markup
    window.closeModal = closeModal;

    function setupGallery(images) {
        if (images.length === 0) return;

        modalImage.src = images[0];
        galleryCounter.textContent = `1 / ${images.length}`;

        // Show/hide navigation buttons
        if (images.length <= 1) {
            galleryPrev.classList.add('hidden');
            galleryNext.classList.add('hidden');
        } else {
            galleryPrev.classList.remove('hidden');
            galleryNext.classList.remove('hidden');
        }

        // Setup thumbnails
        galleryThumbnails.innerHTML = '';
        if (images.length > 1) {
            images.forEach((img, index) => {
                const thumb = document.createElement('div');
                thumb.className = 'gallery-thumbnail';
                if (index === 0) thumb.classList.add('active');

                const thumbImg = document.createElement('img');
                thumbImg.src = img;
                thumbImg.alt = `${currentProject.title} screenshot ${index + 1}`;
                thumb.appendChild(thumbImg);

                thumb.addEventListener('click', () => showImage(index));
                galleryThumbnails.appendChild(thumb);
            });
        }
    }

    function showImage(index) {
        if (!currentProject) return;

        const images = currentProject.images;
        currentImageIndex = (index + images.length) % images.length;

        modalImage.src = images[currentImageIndex];
        galleryCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;

        // Update active thumbnail
        const thumbnails = galleryThumbnails.querySelectorAll('.gallery-thumbnail');
        thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === currentImageIndex);
        });
    }

    galleryPrev?.addEventListener('click', () => {
        showImage(currentImageIndex - 1);
    });

    galleryNext?.addEventListener('click', () => {
        showImage(currentImageIndex + 1);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (modal.getAttribute('aria-hidden') === 'false') {
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                showImage(currentImageIndex - 1);
            } else if (e.key === 'ArrowRight') {
                showImage(currentImageIndex + 1);
            }
        }
    });

    modalClose?.addEventListener('click', closeModal);
    // Modal can only be closed via the close button, not by clicking the overlay

    function getStatusText(status) {
        const statusMap = {
            'completed': 'Completed',
            'in-progress': 'In Progress',
            'paused': 'Paused',
            'under-maintenance': 'Under Maintenance'
        };
        return statusMap[status] || status;
    }

    function formatDescription(text) {
        function formatParagraphLine(line) {
            const content = line.trim();
            // Add indent only if the line looks like a real sentence or paragraph:
            // - Has more than 5 words, AND
            // - Does not end with a colon (label/header pattern like "Team Members:")
            const wordCount = content.split(/\s+/).filter(Boolean).length;
            const isLabel = content.endsWith(':') || content.endsWith(':\u200b');
            const isSentence = wordCount > 5 && !isLabel;
            return `<p${isSentence ? ' class="indent"' : ''}>${content}</p>`;
        }

        const paragraphs = text.split('\n\n');
        return paragraphs.map(para => {
            const trimmed = para.trim();

            // Check if paragraph contains bullet points (starts with • or -)
            if (trimmed.includes('\n•') || trimmed.includes('\n-')) {
                const lines = trimmed.split('\n');
                let html = '';
                let inList = false;

                lines.forEach(line => {
                    const trimmedLine = line.trim();

                    // Check for bullet points
                    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                        if (!inList) {
                            html += '<ul>';
                            inList = true;
                        }
                        // Remove the bullet character and create list item
                        const content = trimmedLine.substring(1).trim();
                        html += `<li>${content}</li>`;
                    } else if (trimmedLine) {
                        if (inList) {
                            html += '</ul>';
                            inList = false;
                        }
                        html += formatParagraphLine(line);
                    }
                });

                if (inList) {
                    html += '</ul>';
                }

                return html;
            } else {
                // Regular paragraph - always indented
                return formatParagraphLine(para);
            }
        }).join('');
    }

    // Initial render
    renderProjects();
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements with fade-in animation
    const animatedElements = document.querySelectorAll('.contact-card, .skill-item, .tool-item');
    animatedElements.forEach(el => {
        // Check if element is already in viewport
        const rect = el.getBoundingClientRect();
        const inViewport = rect.top < window.innerHeight && rect.bottom > 0;

        if (inViewport) {
            // Immediately add is-visible class for elements already in view
            el.classList.add('is-visible');
        } else {
            // Observe elements not yet in view
            observer.observe(el);
        }
    });

    // Tool cards can live inside their own scroll container; make them visible immediately.
    document.querySelectorAll('.tool-item').forEach(el => {
        el.classList.add('is-visible');
    });
}

// ===== UTILITY FUNCTIONS =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // Only intercept real same-page section links
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});