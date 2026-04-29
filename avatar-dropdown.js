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
            // If no wallet connected, show connect button
            if (!walletAddress) {
                this.renderConnectButton();
                return;
            }

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
         * Get current network info with balance
         */
        async getCurrentNetworkInfo() {
            // Try to get network from web3Modal state
            let chainId = null;
            if (window.web3Modal) {
                const state = window.web3Modal.getState();
                chainId = state?.chainId;
            }

            // If no chainId from modal, try from provider
            if (!chainId && window.ethereum) {
                const hexChainId = window.ethereum.chainId;
                if (hexChainId) {
                    chainId = parseInt(hexChainId, 16);
                }
            }

            // Network mapping with proper icons (matching AppKit)
            const networks = {
                84532: {
                    name: 'Base Sepolia',
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTExIiBoZWlnaHQ9IjExMSIgdmlld0JveD0iMCAwIDExMSAxMTEiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik01NC45MjEgMTEwLjAzNEM4NS4zNTkgMTEwLjAzNCAxMTAuMDQyIDg1LjM1MDggMTEwLjA0MiA1NC45MTI5QzExMC4wNDIgMjQuNDc1IDg1LjM1OSAtMC4yMDgwMDggNTQuOTIxIC0wLjIwODAwOEMyNi4wODM4IC0wLjIwODAwOCAxLjgzMzU4IDIyLjQwMTYgMC4wNDIwNTMyIDUwLjUwNzlIMzEuNjcyNkMzMy4zMzE5IDM4Ljk5MzEgNDMuMjU1MSAzMC4xNTQ2IDU0LjkyMSAzMC4xNTQ2QzY3LjU5MzggMzAuMTU0NiA3Ny44OTc0IDQwLjQ1ODMgNzcuODk3NCA1My4xMzExQzc3Ljg5NzQgNjUuODAzOSA2Ny41OTM4IDc2LjEwNzYgNTQuOTIxIDc2LjEwNzZDNDMuMjU1MSA3Ni4xMDc2IDMzLjMzMTkgNjcuMjY5MSAzMS42NzI2IDU1Ljc1NDJIMS4wNDIwNTNDMi44MzM1OCA4My44NjA1IDI2LjA4MzggMTA2LjQ3IDU0LjkyMSAxMDYuNDdWMTEwLjAzNFoiIGZpbGw9IiMwMDUyRkYiLz4KPC9zdmc+Cg==',
                    color: '#0052FF',
                    currency: 'ETH'
                },
                11155111: {
                    name: 'Ethereum Sepolia',
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMiIgZmlsbD0iIzYyN0VFQSIvPjxwYXRoIGQ9Ik0xMiA0TDYgMTJMMTIgMTZMMTggMTJMMTIgNFoiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEyIDE3TDYgMTNMMTIgMjBMMTggMTNMMTIgMTdaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
                    color: '#627EEA',
                    currency: 'ETH'
                },
                2025: {
                    name: 'Rialo',
                    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiMwMDAwMDAiLz4KPHBhdGggZD0iTTEyLjUgOC4yQzEyLjIgOC4xOCAxMS44NSA3Ljk1IDExLjY1IDcuNjVDMTEuMzUgNy4yIDExLjI1IDYuNSAxMS41NSA2QzExLjk1IDUuMyAxMi41IDUuMTUgMTMuMDUgNS4yQzEzLjUgNS4yIDE0LjUgNS4yMiAxNS4xIDUuMjJDMTUuMzUgNS4yMiAxNS41NSA1LjI0IDE1Ljc1IDUuMkMxNi4yIDUuMTIgMTYuNiA0Ljg1IDE2Ljg1IDQuNUMxNy4zIDMuODUgMTcuMTUgMi45IDE2LjU1IDIuNUMxNi4yIDIuMjUgMTUuOCAyLjE1IDE1LjQgMi4xMkMxNS4yIDIuMSAxNSAyLjA4IDE0Ljg1IDIuMDJDMTQuMyAxLjggMTMuOSAxLjMgMTMuNzUgMC44QzEzLjY1IDAuNTUgMTMuNjUgMC4yOCAxMy42IDAuMDJDMTMuNDUgLTAuNSAxMyAtMC45IDEyLjUgLTFDMTIuMzUgLTEuMDUgMTIuMiAtMS4wOCAxMi4wNSAtMS4wOEMxMC41IC0xLjEgOCAtMS4xNSA3LjUgLTEuMTVDNi44IC0xLjE3IDYuMTUgLTAuNjUgNiAwLjAyQzUuOCAwLjcgNi4xNSAxLjQ1IDYuOCAxLjhDNy4xIDEuOTUgNy4zIDEuOTggNy42IDEuOTdDOC41IDEuOTggOC40NSAyIDguOTUgMi4wMkM5LjU1IDEuOTggMTAuMiAyLjMgMTAuNSAyLjlDMTEuMTUgNC4yIDEwLjIgNS4yIDkgNS4xMkM3LjUgNS4xNSA2LjggNS4xMyA0LjUgNS4xM0M0LjEgNS4xNCAzLjg1IDUuMSAzLjUgNS4yMkMyLjUgNS41IDIgNi41IDIuMiA3LjRDMi40IDggMi45IDguNDUgMy41IDguNkM0LjMgOC43IDUuNSA4LjY1IDcuNSA4LjY4QzggOC42OCA4LjMgOC42OCA4LjUgOC42OEM4LjY1IDguNjggOC44IDguNyA4Ljk1IDguNzVDOS44IDguOTUgMTAuMzUgOS43NSAxMC4zIDEwLjZDMTAuMyAxMS4yIDEwLjMgMTMuNSAxMC4zIDE0LjVDMTAuMyAxNC44NSAxMC4zNSAxNS4yIDEwLjU1IDE1LjU1QzExIDE2LjUgMTIuMiAxNi44NSAxMyAxNi4zQzEzLjYgMTUuOSAxMy43NSAxNS4yIDEzLjcgMTQuNEMxMy43IDEzLjYgMTMuNyAxMi4yIDEzLjcgMTEuNUMxMy44IDEwLjIgMTMgOS4zIDEyLjUgOS4yVjguMloiIGZpbGw9IiNBOURERDMiLz4KPC9zdmc+Cg==',
                    color: '#A9DDD3',
                    currency: 'RIA'
                }
            };

            // Get balance
            let balance = '0.0000';
            if (chainId && window.currentWalletAddress) {
                try {
                    const provider = await window.web3Modal?.getWalletProvider();
                    if (provider && provider.request) {
                        const balanceHex = await provider.request({
                            method: 'eth_getBalance',
                            params: [window.currentWalletAddress, 'latest']
                        });
                        balance = (parseInt(balanceHex, 16) / 1e18).toFixed(4);
                    }
                } catch (error) {
                    console.warn('Failed to get balance:', error);
                }
            }

            // Return network info
            if (!chainId) {
                // If wallet connected but no chainId yet, try to get it
                if (window.currentWalletAddress) {
                    // Retry after a short delay
                    setTimeout(() => {
                        if (this.profile) {
                            this.updateNetworkDisplay();
                        }
                    }, 500);
                }
                return { name: 'Connecting...', icon: '', color: '#888888', currency: 'ETH', balance: '0.0000' };
            }

            const network = networks[chainId];
            if (!network) {
                // Unsupported network
                return { name: 'Unsupported', icon: '', color: '#ff6b6b', currency: 'ETH', balance: '0.0000' };
            }

            return { ...network, balance };
        }

        /**
         * Update network display dynamically
         */
        updateNetworkDisplay() {
            const networkInfo = this.getCurrentNetworkInfo();
            const networkButton = document.querySelector('.dropdown-item[onclick*="Networks"]');
            if (networkButton) {
                const iconSpan = networkButton.querySelector('span:first-child');
                const nameSpan = networkButton.querySelector('span:last-child');
                if (iconSpan) iconSpan.textContent = networkInfo.icon;
                if (nameSpan) nameSpan.textContent = networkInfo.name;
            }
        }

        /**
         * Render avatar dropdown
         */
        async render() {
            const navButtons = document.getElementById('navButtons');
            if (!navButtons) return;

            const currentPath = window.location.pathname;
            const isIndexPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath.endsWith('/');
            const isProfilePage = currentPath.includes('profile.html');
            const isGalleryPage = currentPath.includes('gallery.html');
            const isUploadPage = currentPath.includes('upload.html');
            const isDocsPage = currentPath.includes('docs.html');

            const avatarUrl = this.profile?.avatar_url || this.getDefaultAvatar();
            const username = this.profile?.username || 'Anonymous';
            const walletAddress = this.profile?.wallet_address || '';
            const shortAddress = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : '';

            // Get current network info with balance
            const networkInfo = await this.getCurrentNetworkInfo();

            // Create avatar dropdown HTML
            navButtons.innerHTML = `
                <div class="avatar-dropdown-container" style="position: relative;">
                    <!-- Avatar Button -->
                    <button
                        class="avatar-button"
                        onclick="window.AvatarDropdown.toggle()"
                        style="
                            display: flex;
                            align-items: center;
                            gap: 0.75rem;
                            padding: 0.5rem;
                            border-radius: 9999px;
                            cursor: pointer;
                            transition: all 0.3s;
                            border: 2px solid transparent;
                        "
                    >
                        <!-- Avatar -->
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

                        <!-- Username & Address -->
                        <div style="text-align: left;">
                            <div style="font-weight: 600; font-size: 0.875rem;">${username}</div>
                            <div style="font-size: 0.75rem; opacity: 0.6; font-family: monospace;">${shortAddress}</div>
                        </div>

                        <!-- Dropdown Arrow -->
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
                            min-width: 220px;
                            border-radius: 0.75rem;
                            padding: 0.5rem;
                            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                            z-index: 10000;
                        "
                    >
                        <!-- Theme Switcher -->
                        <div style="padding: 0.5rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                            <div style="font-size: 0.75rem; opacity: 0.6; margin-bottom: 0.5rem;">Theme</div>
                            <div class="theme-toggle" style="width: 100%;">
                                <button onclick="window.setTheme('classic')" id="classicBtnDropdown" class="theme-btn" style="flex: 1;">Classic</button>
                                <button onclick="window.setTheme('future')" id="futureBtnDropdown" class="theme-btn" style="flex: 1;">Future</button>
                            </div>
                        </div>

                        <!-- Network Switcher -->
                        <button
                            onclick="window.web3Modal?.open({ view: 'Networks' })"
                            class="dropdown-item network-switcher-btn"
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
                            <img src="${networkInfo.icon}" alt="${networkInfo.name}" style="width: 20px; height: 20px; border-radius: 50%;" onerror="this.style.display='none'" />
                            <div style="flex: 1;">
                                <div><span>${networkInfo.name}</span></div>
                                <div style="font-size: 0.75rem; opacity: 0.7; font-family: monospace;">${networkInfo.balance} ${networkInfo.currency}</div>
                            </div>
                        </button>

                        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 0.25rem 0;"></div>

                        <!-- Menu Items -->
                        <div style="padding: 0.25rem 0;">
                            ${!isIndexPage ? `
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
                                    <span>Home</span>
                                </a>
                            ` : ''}

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
                                    <span>My Profile</span>
                                </a>
                            ` : ''}

                            ${!isUploadPage ? `
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
                                    <span>Upload Artwork</span>
                                </a>
                            ` : ''}

                            ${!isGalleryPage ? `
                                <a
                                    href="gallery.html"
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
                                    <span>Gallery</span>
                                </a>
                            ` : ''}

                            ${!isDocsPage ? `
                                <a
                                    href="docs.html"
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
                                    <span>Docs</span>
                                </a>
                            ` : ''}

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
                                <span>Disconnect</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Apply theme-specific styles
            this.applyThemeStyles();

            // Clean up old event listeners before adding new ones
            if (this.closeHandler) {
                document.removeEventListener('click', this.closeHandler);
                document.removeEventListener('touchstart', this.closeHandler);
            }

            // Close dropdown when clicking outside
            this.closeHandler = (e) => {
                const container = document.querySelector('.avatar-dropdown-container');
                const menu = document.getElementById('avatarDropdownMenu');

                // Don't close if clicking inside the menu
                if (menu && menu.contains(e.target)) {
                    // Allow navigation links to work
                    if (e.target.tagName === 'A' || e.target.closest('a')) {
                        return; // Let link navigate
                    }
                    // Only close if clicking disconnect button
                    if (e.target.closest('button')?.textContent?.includes('Disconnect')) {
                        return; // Let disconnect handler close it
                    }
                    return; // Don't close for other menu items
                }

                // Close if clicking outside container
                if (container && !container.contains(e.target) && this.isOpen) {
                    this.close();
                }
            };

            document.addEventListener('click', this.closeHandler);
            document.addEventListener('touchstart', this.closeHandler, { passive: true });
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
            const classicBtn = document.getElementById('classicBtnDropdown');
            const futureBtn = document.getElementById('futureBtnDropdown');

            if (!menu || !avatarButton) return;

            // Update theme toggle buttons
            if (classicBtn && futureBtn) {
                if (theme === 'classic') {
                    classicBtn.classList.add('active-classic');
                    futureBtn.classList.remove('active-future');
                } else {
                    futureBtn.classList.add('active-future');
                    classicBtn.classList.remove('active-classic');
                }
            }

            if (theme === 'classic') {
                menu.style.background = '#1a1a1a';
                menu.style.border = '1px solid #a9ddd3';
                avatarButton.style.borderColor = '#a9ddd3';
                avatarButton.style.boxShadow = 'none';

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
                avatarButton.style.boxShadow = '0 0 20px rgba(0, 245, 255, 0.6), 0 0 40px rgba(191, 0, 255, 0.4)';

                items.forEach(item => {
                    item.addEventListener('mouseenter', function() {
                        this.style.background = 'rgba(0, 245, 255, 0.1)';
                        this.style.boxShadow = '0 0 10px rgba(0, 245, 255, 0.3)';
                    });
                    item.addEventListener('mouseleave', function() {
                        this.style.background = 'transparent';
                        this.style.boxShadow = 'none';
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

        /**
         * Render connect button when wallet not connected
         */
        renderConnectButton() {
            const container = document.getElementById('avatarButton');
            if (!container) return;

            container.innerHTML = `
                <button
                    onclick="window.web3Modal?.open()"
                    class="btn-main"
                    style="
                        padding: 0.5rem 1rem;
                        font-size: 0.875rem;
                        white-space: nowrap;
                    "
                >
                    Connect Wallet
                </button>
            `;
        }
    }

    // Export singleton
    window.AvatarDropdown = new AvatarDropdown();

    console.log('📦 Avatar Dropdown module loaded');
})();
