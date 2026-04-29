// Avatar Dropdown Component for ArtSoul
// Shows user avatar with dropdown menu in navigation

(function() {
    'use strict';

    class AvatarDropdown {
        constructor() {
            this.profile = null;
            this.isOpen = false;
            this.container = null;
        }

        /**
         * Initialize avatar dropdown
         */
        async init(walletAddress) {
            if (!walletAddress) return;

            try {
                // Load profile from Supabase
                this.profile = await window.ArtSoulDB.getProfile(walletAddress);

                // If no profile, redirect to profile page for first-time setup
                if (!this.profile) {
                    console.log('👤 No profile found, redirecting to profile setup...');
                    // Only redirect if not already on profile page
                    if (!window.location.pathname.includes('profile.html')) {
                        localStorage.setItem('artsoul_first_time', 'true');
                        window.location.href = 'profile.html';
                    }
                    return;
                }

                this.render();
            } catch (error) {
                console.error('❌ Failed to load profile:', error);
            }
        }

        /**
         * Render avatar dropdown
         */
        render() {
            const navButtons = document.getElementById('navButtons');
            if (!navButtons) return;

            const isProfilePage = window.location.pathname.includes('profile.html');
            const avatarUrl = this.profile?.avatar_url || this.getDefaultAvatar();
            const username = this.profile?.username || 'Anonymous';
            const walletAddress = this.profile?.wallet_address || '';
            const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

            // Create avatar dropdown HTML
            navButtons.innerHTML = `
                <div class="avatar-dropdown-container" style="position: relative;">
                    <button
                        class="avatar-button"
                        onclick="window.AvatarDropdown.toggle()"
                        style="
                            display: flex;
                            align-items: center;
                            gap: 0.5rem;
                            padding: 0.25rem;
                            border-radius: 9999px;
                            cursor: pointer;
                            transition: all 0.3s;
                            border: 2px solid transparent;
                        "
                    >
                        <img
                            src="${avatarUrl}"
                            alt="${username}"
                            style="
                                width: 40px;
                                height: 40px;
                                border-radius: 9999px;
                                object-fit: cover;
                            "
                            onerror="this.src='${this.getDefaultAvatar()}'"
                        />
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            style="transition: transform 0.3s;"
                            class="dropdown-arrow"
                        >
                            <path d="M4 6l4 4 4-4"/>
                        </svg>
                    </button>

                    <div
                        id="avatarDropdownMenu"
                        class="avatar-dropdown-menu"
                        style="
                            display: none;
                            position: absolute;
                            top: calc(100% + 0.5rem);
                            right: 0;
                            min-width: 200px;
                            border-radius: 0.75rem;
                            padding: 0.5rem;
                            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                            z-index: 1000;
                        "
                    >
                        <!-- Profile Info -->
                        <div style="padding: 0.75rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <div style="font-weight: 600; margin-bottom: 0.25rem;">${username}</div>
                            <div style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">${shortAddress}</div>
                        </div>

                        <!-- Menu Items -->
                        <div style="padding: 0.25rem 0;">
                            ${!isProfilePage ? `
                                <a
                                    href="profile.html"
                                    class="dropdown-item"
                                    style="
                                        display: flex;
                                        align-items: center;
                                        gap: 0.75rem;
                                        padding: 0.75rem;
                                        border-radius: 0.5rem;
                                        cursor: pointer;
                                        transition: all 0.2s;
                                        text-decoration: none;
                                        color: inherit;
                                    "
                                >
                                    <span style="font-size: 1.25rem;">👤</span>
                                    <span>My Profile</span>
                                </a>
                            ` : ''}

                            <a
                                href="upload.html"
                                class="dropdown-item"
                                style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.75rem;
                                    padding: 0.75rem;
                                    border-radius: 0.5rem;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    text-decoration: none;
                                    color: inherit;
                                "
                            >
                                <span style="font-size: 1.25rem;">🎨</span>
                                <span>Upload Artwork</span>
                            </a>

                            <a
                                href="index.html"
                                class="dropdown-item"
                                style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.75rem;
                                    padding: 0.75rem;
                                    border-radius: 0.5rem;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    text-decoration: none;
                                    color: inherit;
                                "
                            >
                                <span style="font-size: 1.25rem;">🏠</span>
                                <span>Gallery</span>
                            </a>

                            <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0.25rem 0;"></div>

                            <button
                                onclick="window.resetWalletConnection()"
                                class="dropdown-item"
                                style="
                                    display: flex;
                                    align-items: center;
                                    gap: 0.75rem;
                                    padding: 0.75rem;
                                    border-radius: 0.5rem;
                                    cursor: pointer;
                                    transition: all 0.2s;
                                    width: 100%;
                                    border: none;
                                    background: transparent;
                                    color: inherit;
                                    text-align: left;
                                "
                            >
                                <span style="font-size: 1.25rem;">🚪</span>
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Apply theme-specific styles
            this.applyThemeStyles();

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                const container = document.querySelector('.avatar-dropdown-container');
                if (container && !container.contains(e.target) && this.isOpen) {
                    this.close();
                }
            });
        }

        /**
         * Toggle dropdown menu
         */
        toggle() {
            this.isOpen = !this.isOpen;
            const menu = document.getElementById('avatarDropdownMenu');
            const arrow = document.querySelector('.dropdown-arrow');

            if (menu) {
                menu.style.display = this.isOpen ? 'block' : 'none';
            }

            if (arrow) {
                arrow.style.transform = this.isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        }

        /**
         * Close dropdown menu
         */
        close() {
            this.isOpen = false;
            const menu = document.getElementById('avatarDropdownMenu');
            const arrow = document.querySelector('.dropdown-arrow');

            if (menu) {
                menu.style.display = 'none';
            }

            if (arrow) {
                arrow.style.transform = 'rotate(0deg)';
            }
        }

        /**
         * Apply theme-specific styles
         */
        applyThemeStyles() {
            const theme = localStorage.getItem('artsoul_theme') || 'classic';
            const menu = document.getElementById('avatarDropdownMenu');
            const avatarButton = document.querySelector('.avatar-button');
            const items = document.querySelectorAll('.dropdown-item');

            if (!menu || !avatarButton) return;

            if (theme === 'classic') {
                menu.style.background = '#1a1a1a';
                menu.style.border = '1px solid #a9ddd3';
                avatarButton.style.borderColor = '#a9ddd3';

                items.forEach(item => {
                    item.addEventListener('mouseenter', function() {
                        this.style.background = 'rgba(169, 221, 211, 0.1)';
                    });
                    item.addEventListener('mouseleave', function() {
                        this.style.background = 'transparent';
                    });
                });
            } else {
                menu.style.background = 'rgba(0, 20, 40, 0.95)';
                menu.style.border = '1px solid rgba(0, 245, 255, 0.3)';
                menu.style.boxShadow = '0 0 30px rgba(0, 245, 255, 0.2)';
                avatarButton.style.borderColor = '#00f5ff';

                items.forEach(item => {
                    item.addEventListener('mouseenter', function() {
                        this.style.background = 'rgba(0, 245, 255, 0.1)';
                    });
                    item.addEventListener('mouseleave', function() {
                        this.style.background = 'transparent';
                    });
                });
            }
        }

        /**
         * Get default avatar (first letter of username or generic icon)
         */
        getDefaultAvatar() {
            // Generate a simple SVG avatar
            const letter = this.profile?.username?.[0]?.toUpperCase() || '?';
            const svg = `data:image/svg+xml,${encodeURIComponent(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="40" height="40" fill="#00f5ff"/>
                    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                          font-family="Arial" font-size="20" fill="#000">${letter}</text>
                </svg>
            `)}`;
            return svg;
        }

        /**
         * Update profile (call after profile changes)
         */
        async refresh(walletAddress) {
            await this.init(walletAddress);
        }
    }

    // Export singleton
    window.AvatarDropdown = new AvatarDropdown();

    console.log('📦 Avatar Dropdown module loaded');
})();
