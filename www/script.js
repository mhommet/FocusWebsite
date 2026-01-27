/**
 * FocusApp - Modern Landing Page 2026
 * GSAP Animations + Interactive Features
 */

// =====================================================
// CONFIGURATION
// =====================================================
const CONFIG = {
    github: {
        repo: 'mhommet/FocusAPP',
        apiUrl: 'https://api.github.com/repos/mhommet/FocusAPP'
    },
    tierlist: {
        baseUrl: 'http://localhost:8000/api/tierlist',
        refreshInterval: 300000 // 5 minutes
    },
    ddragon: {
        version: '14.1.1',
        baseUrl: 'https://ddragon.leagueoflegends.com/cdn'
    },
    carousel: {
        autoplayInterval: 5000,
        transitionDuration: 600
    },
    background: {
        rotationInterval: 6000
    }
};

// =====================================================
// DOM READY
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // initThemeToggle(); // Theme sombre uniquement
    initMobileMenu();
    initBackgroundRotator();
    initCarousel();
    // initLiveTierlist(); // Disabled
    fetchGitHubData();
    fetchLatestRelease();

    // Check if GSAP is loaded (it should be since it's before this script)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        initGSAPAnimations();
    } else {
        // Fallback if GSAP not loaded - add class for CSS animations
        document.body.classList.add('no-gsap');
        console.log('GSAP not loaded, using CSS fallback animations');
    }
});

// =====================================================
// THEME TOGGLE (Dark/Light)
// =====================================================
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    toggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        // Update meta theme-color for mobile browsers
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = newTheme === 'dark' ? '#1e1e2e' : '#eff1f5';
        }
    });
}

// =====================================================
// MOBILE MENU
// =====================================================
function initMobileMenu() {
    const burgerToggle = document.getElementById('burger-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (!burgerToggle || !navMenu) return;

    burgerToggle.addEventListener('click', (e) => {
        e.preventDefault();
        burgerToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // Close menu on link click
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            burgerToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !burgerToggle.contains(e.target)) {
            burgerToggle.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
}

// =====================================================
// BACKGROUND ROTATOR
// =====================================================
function initBackgroundRotator() {
    const backgrounds = document.querySelectorAll('.hero-bg');
    if (backgrounds.length < 2) return;

    let currentIndex = 0;

    setInterval(() => {
        backgrounds[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % backgrounds.length;
        backgrounds[currentIndex].classList.add('active');
    }, CONFIG.background.rotationInterval);
}

// =====================================================
// CAROUSEL
// =====================================================
function initCarousel() {
    const track = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dotsContainer = document.getElementById('carousel-dots');

    if (!track) return;

    const slides = track.querySelectorAll('.carousel-slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.dot') : [];
    let currentIndex = 0;
    let autoplayTimer;

    function goToSlide(index) {
        slides[currentIndex].classList.remove('active');
        if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

        currentIndex = (index + slides.length) % slides.length;

        slides[currentIndex].classList.add('active');
        if (dots[currentIndex]) dots[currentIndex].classList.add('active');
    }

    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(nextSlide, CONFIG.carousel.autoplayInterval);
    }

    function stopAutoplay() {
        if (autoplayTimer) clearInterval(autoplayTimer);
    }

    // Event listeners
    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoplay(); });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            startAutoplay();
        });
    });

    // Start autoplay
    startAutoplay();

    // Pause on hover
    track.addEventListener('mouseenter', stopAutoplay);
    track.addEventListener('mouseleave', startAutoplay);
}

// =====================================================
// LIVE TIERLIST API (localhost:8000)
// =====================================================
let currentRole = 'top';
let tierlistRefreshTimer = null;

function initLiveTierlist() {
    const grid = document.getElementById('hero-tierlist-grid');
    const roleSelect = document.getElementById('role-select');
    const refreshBtn = document.getElementById('refresh-tierlist');

    if (!grid) return;

    // Load initial tierlist
    loadLiveTierlist(currentRole);

    // Role select change
    if (roleSelect) {
        roleSelect.addEventListener('change', (e) => {
            currentRole = e.target.value;
            loadLiveTierlist(currentRole);
        });
    }

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLiveTierlist(currentRole, true);
        });
    }

    // Auto-refresh every 5 minutes
    tierlistRefreshTimer = setInterval(() => {
        loadLiveTierlist(currentRole);
    }, CONFIG.tierlist.refreshInterval);

    // Create tooltip element
    createGridTooltip();
}

async function loadLiveTierlist(role = 'top', showLoading = true) {
    const grid = document.getElementById('hero-tierlist-grid');
    const refreshBtn = document.getElementById('refresh-tierlist');

    if (!grid) return;

    // Show loading state
    if (showLoading) {
        grid.innerHTML = `
            <div class="grid-loading">
                <div class="loader"></div>
                <span>Chargement tierlist ${role.toUpperCase()}...</span>
            </div>
        `;
    }

    if (refreshBtn) {
        refreshBtn.classList.add('loading');
    }

    try {
        const response = await fetch(`${CONFIG.tierlist.baseUrl}/${role}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Handle different response formats
        let champions = [];
        if (data[role]) {
            champions = data[role];
        } else if (Array.isArray(data)) {
            champions = data;
        } else if (data.champions) {
            champions = data.champions;
        }

        // Take top 9 champions
        const top9 = champions.slice(0, 9);

        if (top9.length === 0) {
            throw new Error('No champions data');
        }

        renderLiveTierlist(top9, grid);

    } catch (error) {
        console.warn('Failed to fetch live tierlist:', error);

        // Fallback to mock data for demo
        const mockData = getMockTierlist(role);
        renderLiveTierlist(mockData, grid);
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
        }
    }
}

function renderLiveTierlist(champions, container) {
    const html = champions.map((champ, index) => {
        const champName = champ.name || champ.champion || 'Unknown';
        const winrate = champ.winrate || champ.win_rate || 50;
        const pickrate = champ.pickrate || champ.pick_rate || 5;
        const rank = champ.rank || index + 1;

        const wrClass = winrate >= 52 ? '' : winrate < 50 ? 'low' : '';
        const rankClass = rank <= 3 ? `rank-${rank}` : '';

        return `
            <div class="grid-champ-card ${rankClass}"
                 data-champ="${champName}"
                 data-winrate="${winrate}"
                 data-pickrate="${pickrate}"
                 data-rank="${rank}">
                <div class="grid-champ-img">
                    <span class="grid-champ-rank">${rank}</span>
                    <img src="${getChampionIcon(champName)}"
                         alt="${champName}"
                         loading="lazy"
                         onerror="this.src='${CONFIG.ddragon.baseUrl}/${CONFIG.ddragon.version}/img/champion/Aatrox.png'">
                </div>
                <div class="grid-champ-info">
                    <span class="grid-champ-name">${formatChampName(champName)}</span>
                    <div class="grid-champ-stats">
                        <span class="stat-winrate ${wrClass}">${parseFloat(winrate).toFixed(1)}%</span>
                        <span class="stat-pickrate">${parseFloat(pickrate).toFixed(1)}% PR</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;

    // Add hover events for tooltips
    container.querySelectorAll('.grid-champ-card').forEach(card => {
        card.addEventListener('mouseenter', showGridTooltip);
        card.addEventListener('mouseleave', hideGridTooltip);
        card.addEventListener('click', () => {
            // Could open champion detail or copy build
            const champName = card.dataset.champ;
            console.log(`Champion clicked: ${champName} - Build optimise pour ${currentRole.toUpperCase()}`);
        });
    });

    // Animate cards with GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.from(container.querySelectorAll('.grid-champ-card'), {
            scale: 0.8,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease: 'back.out(1.5)'
        });
    }
}

function getChampionIcon(name) {
    const formattedName = formatChampNameForDDragon(name);
    return `${CONFIG.ddragon.baseUrl}/${CONFIG.ddragon.version}/img/champion/${formattedName}.png`;
}

function formatChampNameForDDragon(name) {
    // Handle special champion names for DDragon
    const specialNames = {
        'leesin': 'LeeSin',
        'lee sin': 'LeeSin',
        'masteryi': 'MasterYi',
        'master yi': 'MasterYi',
        'missfortune': 'MissFortune',
        'miss fortune': 'MissFortune',
        'twistedfate': 'TwistedFate',
        'twisted fate': 'TwistedFate',
        'drmundo': 'DrMundo',
        'dr. mundo': 'DrMundo',
        'dr mundo': 'DrMundo',
        'jarvaniv': 'JarvanIV',
        'jarvan iv': 'JarvanIV',
        'jarvan': 'JarvanIV',
        'xinzhao': 'XinZhao',
        'xin zhao': 'XinZhao',
        'aurelionsol': 'AurelionSol',
        'aurelion sol': 'AurelionSol',
        'reksai': 'RekSai',
        'rek\'sai': 'RekSai',
        'tahmkench': 'TahmKench',
        'tahm kench': 'TahmKench',
        'kogmaw': 'KogMaw',
        'kog\'maw': 'KogMaw',
        'wukong': 'MonkeyKing',
        'chogath': 'Chogath',
        'cho\'gath': 'Chogath',
        'khazix': 'Khazix',
        'kha\'zix': 'Khazix',
        'velkoz': 'Velkoz',
        'vel\'koz': 'Velkoz',
        'kaisa': 'Kaisa',
        'kai\'sa': 'Kaisa',
        'belveth': 'Belveth',
        'bel\'veth': 'Belveth',
        'ksante': 'KSante',
        'k\'sante': 'KSante',
        'renataglasc': 'Renata',
        'renata glasc': 'Renata',
        'nunuwillump': 'Nunu',
        'nunu & willump': 'Nunu',
        'nunu': 'Nunu'
    };

    const lowerName = name.toLowerCase().trim();
    if (specialNames[lowerName]) {
        return specialNames[lowerName];
    }

    // Default: capitalize first letter, remove spaces
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replace(/\s+/g, '');
}

function formatChampName(name) {
    // Display name formatting (human readable)
    const displayNames = {
        'monkeyking': 'Wukong',
        'jarvaniv': 'Jarvan IV',
        'drmundo': 'Dr. Mundo',
        'leesin': 'Lee Sin',
        'masteryi': 'Master Yi',
        'missfortune': 'Miss Fortune',
        'twistedfate': 'Twisted Fate',
        'xinzhao': 'Xin Zhao',
        'aurelionsol': 'Aurelion Sol',
        'reksai': 'Rek\'Sai',
        'tahmkench': 'Tahm Kench',
        'kogmaw': 'Kog\'Maw',
        'chogath': 'Cho\'Gath',
        'khazix': 'Kha\'Zix',
        'velkoz': 'Vel\'Koz',
        'kaisa': 'Kai\'Sa',
        'belveth': 'Bel\'Veth',
        'ksante': 'K\'Sante'
    };

    const lowerName = name.toLowerCase().replace(/[^a-z]/g, '');
    if (displayNames[lowerName]) {
        return displayNames[lowerName];
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
}

// Tooltip for champion grid
function createGridTooltip() {
    if (document.getElementById('grid-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'grid-tooltip';
    tooltip.className = 'grid-tooltip';
    tooltip.innerHTML = `
        <div class="grid-tooltip-header">
            <img src="" alt="">
            <div>
                <h4></h4>
                <span></span>
            </div>
        </div>
        <div class="grid-tooltip-stats">
            <div>
                <span>Win Rate</span>
                <strong class="tooltip-wr"></strong>
            </div>
            <div>
                <span>Pick Rate</span>
                <strong class="tooltip-pr"></strong>
            </div>
        </div>
        <div class="grid-tooltip-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
            Build optimise pour ${currentRole.toUpperCase()}
        </div>
    `;
    document.body.appendChild(tooltip);
}

function showGridTooltip(e) {
    const card = e.currentTarget;
    const tooltip = document.getElementById('grid-tooltip');
    if (!tooltip) return;

    const champName = card.dataset.champ;
    const winrate = card.dataset.winrate;
    const pickrate = card.dataset.pickrate;
    const rank = card.dataset.rank;

    // Update tooltip content
    const img = tooltip.querySelector('.grid-tooltip-header img');
    img.src = getChampionIcon(champName);
    img.alt = champName;

    tooltip.querySelector('.grid-tooltip-header h4').textContent = formatChampName(champName);
    tooltip.querySelector('.grid-tooltip-header span').textContent = `Rank #${rank} ${currentRole.toUpperCase()}`;
    tooltip.querySelector('.tooltip-wr').textContent = `${parseFloat(winrate).toFixed(1)}%`;
    tooltip.querySelector('.tooltip-pr').textContent = `${parseFloat(pickrate).toFixed(1)}%`;
    tooltip.querySelector('.grid-tooltip-cta').innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>
        Build optimise pour ${currentRole.toUpperCase()}
    `;

    // Position tooltip
    const rect = card.getBoundingClientRect();
    let left = rect.right + 10;
    let top = rect.top;

    // Check if tooltip would go off-screen
    if (left + 280 > window.innerWidth) {
        left = rect.left - 290;
    }
    if (top + 200 > window.innerHeight) {
        top = window.innerHeight - 210;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');
}

function hideGridTooltip() {
    const tooltip = document.getElementById('grid-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
    }
}

// Mock tierlist data (fallback when API unavailable)
function getMockTierlist(role) {
    const mockData = {
        top: [
            { name: 'Sion', winrate: 53.2, pickrate: 8.4, rank: 1 },
            { name: 'Ambessa', winrate: 52.8, pickrate: 12.1, rank: 2 },
            { name: 'Mordekaiser', winrate: 52.5, pickrate: 7.8, rank: 3 },
            { name: 'Darius', winrate: 52.1, pickrate: 9.2, rank: 4 },
            { name: 'Garen', winrate: 51.9, pickrate: 6.5, rank: 5 },
            { name: 'Yorick', winrate: 51.7, pickrate: 4.3, rank: 6 },
            { name: 'Illaoi', winrate: 51.5, pickrate: 3.8, rank: 7 },
            { name: 'Urgot', winrate: 51.3, pickrate: 4.1, rank: 8 },
            { name: 'Malphite', winrate: 51.1, pickrate: 5.2, rank: 9 }
        ],
        jungle: [
            { name: 'Viego', winrate: 52.8, pickrate: 14.2, rank: 1 },
            { name: 'LeeSin', winrate: 52.3, pickrate: 18.5, rank: 2 },
            { name: 'Elise', winrate: 52.1, pickrate: 6.8, rank: 3 },
            { name: 'Nidalee', winrate: 51.9, pickrate: 5.4, rank: 4 },
            { name: 'Graves', winrate: 51.7, pickrate: 8.9, rank: 5 },
            { name: 'Hecarim', winrate: 51.5, pickrate: 7.2, rank: 6 },
            { name: 'Rek\'Sai', winrate: 51.3, pickrate: 3.1, rank: 7 },
            { name: 'Kha\'Zix', winrate: 51.1, pickrate: 9.8, rank: 8 },
            { name: 'Nocturne', winrate: 50.9, pickrate: 4.5, rank: 9 }
        ],
        mid: [
            { name: 'Syndra', winrate: 53.1, pickrate: 11.2, rank: 1 },
            { name: 'Aurora', winrate: 52.7, pickrate: 8.9, rank: 2 },
            { name: 'Ahri', winrate: 52.4, pickrate: 12.8, rank: 3 },
            { name: 'Orianna', winrate: 52.1, pickrate: 6.4, rank: 4 },
            { name: 'Viktor', winrate: 51.8, pickrate: 7.1, rank: 5 },
            { name: 'Hwei', winrate: 51.5, pickrate: 9.3, rank: 6 },
            { name: 'Lux', winrate: 51.3, pickrate: 8.7, rank: 7 },
            { name: 'Zed', winrate: 51.1, pickrate: 15.2, rank: 8 },
            { name: 'Yasuo', winrate: 50.8, pickrate: 14.8, rank: 9 }
        ],
        adc: [
            { name: 'Jinx', winrate: 53.4, pickrate: 16.8, rank: 1 },
            { name: 'Jhin', winrate: 52.9, pickrate: 18.2, rank: 2 },
            { name: 'Kai\'Sa', winrate: 52.5, pickrate: 22.1, rank: 3 },
            { name: 'Caitlyn', winrate: 52.2, pickrate: 14.5, rank: 4 },
            { name: 'Miss Fortune', winrate: 51.9, pickrate: 11.3, rank: 5 },
            { name: 'Ashe', winrate: 51.6, pickrate: 9.8, rank: 6 },
            { name: 'Vayne', winrate: 51.3, pickrate: 12.4, rank: 7 },
            { name: 'Ezreal', winrate: 51.0, pickrate: 19.7, rank: 8 },
            { name: 'Lucian', winrate: 50.7, pickrate: 8.9, rank: 9 }
        ],
        support: [
            { name: 'Thresh', winrate: 52.8, pickrate: 14.2, rank: 1 },
            { name: 'Nautilus', winrate: 52.5, pickrate: 11.8, rank: 2 },
            { name: 'Lulu', winrate: 52.2, pickrate: 9.4, rank: 3 },
            { name: 'Leona', winrate: 51.9, pickrate: 8.7, rank: 4 },
            { name: 'Janna', winrate: 51.6, pickrate: 6.3, rank: 5 },
            { name: 'Blitzcrank', winrate: 51.3, pickrate: 10.2, rank: 6 },
            { name: 'Nami', winrate: 51.0, pickrate: 7.8, rank: 7 },
            { name: 'Pyke', winrate: 50.7, pickrate: 8.1, rank: 8 },
            { name: 'Senna', winrate: 50.4, pickrate: 12.5, rank: 9 }
        ]
    };

    return mockData[role] || mockData.top;
}

// =====================================================
// GITHUB API
// =====================================================
async function fetchGitHubData() {
    const starsEl = document.getElementById('github-stars');
    const forksEl = document.getElementById('github-forks');

    if (!starsEl && !forksEl) return;

    try {
        const response = await fetch(CONFIG.github.apiUrl);
        if (!response.ok) throw new Error('GitHub API error');

        const data = await response.json();

        if (starsEl) starsEl.textContent = formatNumber(data.stargazers_count);
        if (forksEl) forksEl.textContent = formatNumber(data.forks_count);
    } catch (error) {
        console.warn('Failed to fetch GitHub data:', error);
        if (starsEl) starsEl.textContent = '--';
        if (forksEl) forksEl.textContent = '--';
    }
}

async function fetchLatestRelease() {
    const downloadBtn = document.getElementById('download-windows');
    const versionEl = document.getElementById('windows-version');

    if (!downloadBtn) return;

    try {
        const response = await fetch(`${CONFIG.github.apiUrl}/releases/latest`);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();
        const exeAsset = data.assets.find(a => a.name.endsWith('.exe'));

        if (exeAsset) {
            downloadBtn.href = exeAsset.browser_download_url;
            if (versionEl) {
                const sizeMB = (exeAsset.size / (1024 * 1024)).toFixed(1);
                versionEl.textContent = `${data.tag_name} (${sizeMB} MB)`;
            }
        } else {
            downloadBtn.href = `https://github.com/${CONFIG.github.repo}/releases`;
        }
    } catch (error) {
        console.warn('Failed to fetch latest release:', error);
        downloadBtn.href = `https://github.com/${CONFIG.github.repo}/releases`;
    }
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
}

// =====================================================
// GSAP ANIMATIONS
// =====================================================
function initGSAPAnimations() {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Set initial states for hero elements
    gsap.set('.hero-content .gsap-fade', { opacity: 0, y: 30 });
    gsap.set('.hero-visual .gsap-scale', { opacity: 0, scale: 0.95 });

    // Hero animations
    const heroTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTimeline
        .to('.hero-content .gsap-fade', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15
        })
        .to('.hero-visual .gsap-scale', {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'back.out(1.2)'
        }, '-=0.4');

    // Scroll-triggered animations for sections
    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
        const fadeElements = section.querySelectorAll('.gsap-fade');
        const scaleElements = section.querySelectorAll('.gsap-scale');

        if (fadeElements.length > 0) {
            // Set initial state
            gsap.set(fadeElements, { opacity: 0, y: 30 });

            gsap.to(fadeElements, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 1,
                y: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }

        if (scaleElements.length > 0) {
            // Set initial state
            gsap.set(scaleElements, { opacity: 0, scale: 0.95 });

            gsap.to(scaleElements, {
                scrollTrigger: {
                    trigger: section,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                opacity: 1,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'back.out(1.2)'
            });
        }
    });

    // Parallax effect on hero background
    gsap.to('.hero-bg-wrapper', {
        scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
        },
        y: 150,
        ease: 'none'
    });

    // Feature cards hover enhancement
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Download buttons animation
    document.querySelectorAll('.download-btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            gsap.to(btn, {
                x: 8,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, {
                x: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Champion cards stagger animation
    const champCards = document.querySelectorAll('.champ-card');
    if (champCards.length > 0) {
        gsap.from(champCards, {
            scrollTrigger: {
                trigger: '.champ-grid',
                start: 'top 90%'
            },
            scale: 0,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.5)'
        });
    }
}

// =====================================================
// SMOOTH SCROLL
// =====================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// =====================================================
// HEADER SCROLL EFFECT
// =====================================================
let lastScrollY = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 100) {
        header.style.background = 'var(--glass-bg)';
        header.style.boxShadow = 'var(--shadow-md)';
    } else {
        header.style.background = 'var(--glass-bg)';
        header.style.boxShadow = 'none';
    }

    lastScrollY = currentScrollY;
});

// =====================================================
// LAZY LOADING ENHANCEMENT
// =====================================================
if ('IntersectionObserver' in window) {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => imageObserver.observe(img));
}

// =====================================================
// VIDEO DEMO PLACEHOLDER
// =====================================================
const videoPlaceholder = document.getElementById('video-placeholder');
if (videoPlaceholder) {
    videoPlaceholder.addEventListener('click', () => {
        // Could embed YouTube/TikTok video here
        // For now, just log the interaction
        console.log('Video demo clicked - would open video player');

        // Example: Replace with YouTube embed
        // videoPlaceholder.innerHTML = '<iframe src="https://youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>';
    });
}

// =====================================================
// PERFORMANCE MONITORING
// =====================================================
if ('performance' in window) {
    window.addEventListener('load', () => {
        const timing = performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`Page load time: ${loadTime}ms`);

        // Report to analytics if load time > 2s
        if (loadTime > 2000) {
            console.warn('Page load exceeded 2s target');
        }
    });
}
