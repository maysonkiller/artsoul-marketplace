// Theme Synchronization Module for ArtSoul
// Syncs theme (classic/future) across all pages using localStorage

(function() {
    'use strict';

    const THEME_KEY = 'artsoul_theme';
    const DEFAULT_THEME = 'classic';

    /**
     * Get current theme from localStorage
     */
    function getTheme() {
        return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
    }

    /**
     * Save theme to localStorage
     */
    function saveTheme(theme) {
        localStorage.setItem(THEME_KEY, theme);
        console.log(`🎨 Theme saved: ${theme}`);
    }

    /**
     * Apply theme to body
     */
    function applyTheme(theme) {
        document.body.className = theme;
        console.log(`🎨 Theme applied: ${theme}`);
    }

    /**
     * Initialize theme on page load
     */
    function initTheme() {
        const savedTheme = getTheme();
        applyTheme(savedTheme);

        // Update theme toggle buttons if they exist
        updateThemeButtons(savedTheme);
    }

    /**
     * Update theme toggle buttons state
     */
    function updateThemeButtons(theme) {
        const classicBtn = document.querySelector('[data-theme="classic"]');
        const futureBtn = document.querySelector('[data-theme="future"]');

        if (classicBtn && futureBtn) {
            classicBtn.classList.toggle('active', theme === 'classic');
            futureBtn.classList.toggle('active', theme === 'future');
        }
    }

    /**
     * Set up theme toggle listeners
     */
    function setupThemeToggle() {
        const themeButtons = document.querySelectorAll('[data-theme]');

        themeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const theme = button.getAttribute('data-theme');
                saveTheme(theme);
                applyTheme(theme);
                updateThemeButtons(theme);
            });
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initTheme();
            setupThemeToggle();
        });
    } else {
        initTheme();
        setupThemeToggle();
    }

    // Export functions for external use
    window.ThemeSync = {
        getTheme,
        saveTheme,
        applyTheme,
        initTheme
    };

    console.log('🎨 Theme Sync module loaded');
})();
