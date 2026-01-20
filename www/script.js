/**
 * FocusAPP Website - Auto-fetch latest GitHub release
 */

const GITHUB_REPO = 'mhommet/FocusAPP';
const API_URL = '/api/release';

// DOM Elements
const downloadBtn = document.getElementById('download-btn');
const downloadText = document.getElementById('download-text');
const versionInfo = document.getElementById('version-info');

/**
 * Fetch latest release from GitHub API
 */
async function fetchLatestRelease() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        // Find .exe asset
        const exeAsset = data.assets.find(asset =>
            asset.name.endsWith('.exe') || asset.name.includes('FOCUS')
        );

        if (!exeAsset) {
            throw new Error('No .exe file found in latest release');
        }

        // Update UI
        updateDownloadButton(exeAsset, data.tag_name);

    } catch (error) {
        console.error('Error fetching release:', error);
        showError();
    }
}

/**
 * Update download button with release info
 */
function updateDownloadButton(asset, version) {
    const downloadUrl = asset.browser_download_url;
    const fileName = asset.name;
    const fileSize = (asset.size / 1024 / 1024).toFixed(1); // MB

    // Update button
    downloadText.textContent = `Download FocusAPP`;
    downloadBtn.disabled = false;

    // Update version info
    versionInfo.innerHTML = `
        <strong>${version}</strong> • ${fileName} • ${fileSize} MB
    `;

    // Add click handler
    downloadBtn.onclick = () => {
        window.location.href = downloadUrl;

        // Analytics (optionnel)
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'Release',
                'event_label': version
            });
        }
    };
}

/**
 * Show error state
 */
function showError() {
    downloadText.textContent = 'Download Unavailable';
    versionInfo.textContent = 'Unable to fetch latest release. Visit GitHub directly.';
    downloadBtn.disabled = false;

    // Fallback: redirect to releases page
    downloadBtn.onclick = () => {
        window.open(`https://github.com/${GITHUB_REPO}/releases/latest`, '_blank');
    };
}

/**
 * Random background on page load
 */
function initBackgroundRotation() {
    const backgrounds = document.querySelectorAll('.hero-bg');
    if (backgrounds.length === 0) return;

    const randomIndex = Math.floor(Math.random() * backgrounds.length);
    backgrounds[randomIndex].classList.add('active');
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchLatestRelease();
    initBackgroundRotation();
});
