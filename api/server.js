const express = require('express');

const app = express();
const PORT = 3000;

const GITHUB_REPO = 'mhommet/FocusAPP';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

app.get('/api/release', async (req, res) => {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
            {
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'X-GitHub-Api-Version': '2022-11-28'
                }
            }
        );

        if (!response.ok) {
            return res.status(response.status).json({ error: 'GitHub API error' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching release:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
