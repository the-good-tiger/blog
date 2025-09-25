class MotionUI {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.setupThemeToggle();
    }
    
    setupIntersectionObserver() {
        // Skip if reduced motion is preferred
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('[data-animate]').forEach(el => {
                el.classList.add('animate-in');
            });
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('[data-animate]').forEach((el, index) => {
            el.style.setProperty('--index', index);
            this.observer.observe(el);
        });
    }
    
    setupSmoothScrolling() {
        // Smooth scroll for anchor links
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href^="#"]')) {
                e.preventDefault();
                const target = document.querySelector(e.target.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    }
    
    setupThemeToggle() {
        // Auto-detect theme preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        const updateTheme = () => {
            document.documentElement.setAttribute('data-theme', 
                prefersDark.matches ? 'dark' : 'light');
        };
        
        prefersDark.addEventListener('change', updateTheme);
        updateTheme();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MotionUI();
    
    // Add copy-to-clipboard functionality for code blocks
    document.querySelectorAll('pre').forEach(pre => {
        const button = document.createElement('button');
        button.className = 'copy-btn';
        button.innerHTML = '📋';
        button.title = 'Copy code';
        
        button.addEventListener('click', async () => {
            const code = pre.querySelector('code')?.innerText || pre.innerText;
            try {
                await navigator.clipboard.writeText(code);
                button.innerHTML = '✅';
                setTimeout(() => button.innerHTML = '📋', 2000);
            } catch (err) {
                console.error('Failed to copy code:', err);
            }
        });
        
        pre.style.position = 'relative';
        pre.appendChild(button);
    });
});