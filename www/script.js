/**
 * FocusAPP Website Logic
 */

const GITHUB_REPO = 'mhommet/FocusAPP';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

// Elements
const downloadBtn = document.getElementById('download-btn');
const downloadText = document.getElementById('download-text');
const versionInfo = document.getElementById('version-info');

/**
 * 1. Fetch GitHub Release
 */
async function fetchLatestRelease() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        const exeAsset = data.assets.find(a => a.name.endsWith('.exe'));
        
        if (exeAsset) {
            updateDownloadButton(exeAsset, data.tag_name);
        } else {
            // Fallback if no exe found
            enableGenericDownload();
        }
    } catch (error) {
        console.error('Release fetch failed:', error);
        enableGenericDownload();
    }
}

function updateDownloadButton(asset, version) {
    const sizeMB = (asset.size / (1024*1024)).toFixed(1);
    downloadText.textContent = 'Download for Windows';
    versionInfo.textContent = `${version} • ${sizeMB} MB • Installer`;
    downloadBtn.disabled = false;
    
    downloadBtn.onclick = () => window.location.href = asset.browser_download_url;
}

function enableGenericDownload() {
    downloadText.textContent = 'Download from GitHub';
    versionInfo.textContent = 'Latest Release';
    downloadBtn.disabled = false;
    downloadBtn.onclick = () => window.open(`https://github.com/${GITHUB_REPO}/releases`, '_blank');
}

/**
 * 2. Background Rotator
 */
function initBackgrounds() {
    const bgs = document.querySelectorAll('.hero-bg');
    if(bgs.length < 2) return;
    
    let current = 0;
    setInterval(() => {
        bgs[current].classList.remove('active');
        current = (current + 1) % bgs.length;
        bgs[current].classList.add('active');
    }, 5000);
}

/**
 * 3. Scroll Animations (Intersection Observer)
 */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed
                // observer.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.scroll-reveal, .glass-panel').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
    
    // Custom CSS class for revealed state
    const style = document.createElement('style');
    style.innerHTML = `
        .visible { opacity: 1 !important; transform: translateY(0) !important; }
    `;
    document.head.appendChild(style);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestRelease();
    initBackgrounds();
    initScrollReveal();
});

/**
 * 4. Mobile Menu Toggle
 */
function initMobileMenu() {
    const burgerToggle = document.getElementById('burger-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (!burgerToggle || !navMenu) {
        console.error('Burger ou menu introuvable!');
        return;
    }
    
    // Toggle au clic sur le burger
    burgerToggle.addEventListener('click', function(e) {
        e.preventDefault();
        this.classList.toggle('active');
        navMenu.classList.toggle('active');
        console.log('Menu toggled'); // Debug
    });
    
    // Fermer au clic sur un lien
    const links = navMenu.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            burgerToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// Dans le DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestRelease();
    initBackgrounds();
    initScrollReveal();
    initMobileMenu();
    
    console.log('Page loaded'); // Debug
});
