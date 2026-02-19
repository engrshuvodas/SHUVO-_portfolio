// Theme Toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const themeIcon = themeToggle.querySelector('i');

// Check local storage for theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);
}

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateIcon(newTheme);
});

function updateIcon(theme) {
    if (theme === 'dark') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }
}

// Mobile Menu functionality
const mobileMenuBtn = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');

    // Animate burger to close icon (optional, just simple toggle for now)
    const icon = mobileMenuBtn.querySelector('i');
    if (navLinks.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    });
});

// Sticky Header on Scroll
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('sticky');
    } else {
        header.classList.remove('sticky');
    }
});

// Skill Bar Animation on Scroll
const skillsSection = document.getElementById('skills');
const skillProgressBars = document.querySelectorAll('.skill-progress');
let skillsAnimated = false;

function animateSkills() {
    const sectionPos = skillsSection.getBoundingClientRect().top;
    const screenPos = window.innerHeight / 1.3;

    if (sectionPos < screenPos && !skillsAnimated) {
        skillProgressBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            bar.style.width = width;
        });
        skillsAnimated = true;
    }
}

window.addEventListener('scroll', animateSkills);

// Smooth Scroll for Anchor Links (Polyfill for older browsers mostly handled by CSS, but robust here)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Offset for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// REVIEW MODAL LOGIC
function openReviewModal(card) {
    const modal = document.getElementById('reviewModal');
    const name = card.getAttribute('data-name');
    const role = card.getAttribute('data-role');
    const text = card.getAttribute('data-text');
    const image = card.getAttribute('data-image');
    const stars = parseInt(card.getAttribute('data-stars'));
    const flag = card.getAttribute('data-flag');

    document.getElementById('modalName').innerText = name;
    const modalFlag = document.getElementById('modalFlag');
    if (modalFlag) {
        modalFlag.className = 'modal-flag fi fi-' + flag.toLowerCase();
        modalFlag.style.display = 'inline-block';
    }
    document.getElementById('modalRole').innerText = role;
    document.getElementById('modalText').innerText = text;
    document.getElementById('modalImg').src = image;

    const starsContainer = document.getElementById('modalStars');
    starsContainer.innerHTML = '';
    for (let i = 0; i < stars; i++) {
        const star = document.createElement('i');
        star.className = 'fas fa-star';
        starsContainer.appendChild(star);
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeReviewModal(event) {
    const modal = document.getElementById('reviewModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Restore scrolling
}
