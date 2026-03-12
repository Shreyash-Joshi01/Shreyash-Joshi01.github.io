document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for glow orbs
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const orbs = document.querySelectorAll('.orb');
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 0.02;
            const x = (window.innerWidth / 2 - mouseX) * speed;
            const y = (window.innerHeight / 2 - mouseY) * speed;
            orb.style.transform = `translate(${x}px, ${y}px)`;
        });
    });

    // Neon Data Stream Effect (Flowing Lines)
    const linesContainer = document.querySelector('.flowing-lines-container');
    const createLine = () => {
        const line = document.createElement('div');
        line.className = 'flowing-line';
        
        const startX = Math.random() * 100;
        const duration = 2 + Math.random() * 4;
        const delay = Math.random() * 5;
        const height = 50 + Math.random() * 150;
        
        line.style.left = `${startX}%`;
        line.style.height = `${height}px`;
        line.style.animationDuration = `${duration}s`;
        line.style.animationDelay = `-${delay}s`;
        
        linesContainer.appendChild(line);
        
        // Remove line after animation to keep DOM clean
        setTimeout(() => {
            line.remove();
            createLine();
        }, (duration) * 1000);
    };

    // Initial pool of lines
    for (let i = 0; i < 15; i++) {
        setTimeout(createLine, i * 300);
    }

    // Smooth scroll for nav links
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const offset = 100;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = targetElement.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.glass-card, .section-header, .stat-item, .hero-content > *');
    revealElements.forEach((el, index) => {
        el.classList.add('reveal-item');
        el.style.transitionDelay = `${(index % 3) * 0.1}s`;
        observer.observe(el);
    });
});
