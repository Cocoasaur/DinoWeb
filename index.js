document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburgerBtn');
    const mobileNav = document.querySelector('.mobile-only');

    hamburger.addEventListener('click', function () {
        mobileNav.classList.toggle('show');
        hamburger.classList.toggle('active');
    });
});