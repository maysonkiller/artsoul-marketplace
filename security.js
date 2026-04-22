// Security utilities for ArtSoul Marketplace

// XSS Protection - Sanitize user input
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

// Validate file uploads
function validateFile(file, maxSize = 100 * 1024 * 1024) { // 100MB default
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg'
    ];

    // Check file size
    if (file.size > maxSize) {
        throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only images, videos, and audio files are allowed.');
    }

    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'webm', 'mp3', 'wav', 'ogg'];

    if (!validExtensions.includes(extension)) {
        throw new Error('Invalid file extension');
    }

    return true;
}

// Validate ETH address
function validateEthAddress(address) {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
}

// Validate bid amount
function validateBidAmount(amount, currentBid) {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Invalid bid amount');
    }

    if (numAmount <= currentBid) {
        throw new Error('Bid must be higher than current bid');
    }

    return true;
}

// Rate limiting for localStorage operations
const rateLimiter = {
    operations: {},

    check(key, maxOps = 10, timeWindow = 60000) { // 10 ops per minute default
        const now = Date.now();

        if (!this.operations[key]) {
            this.operations[key] = [];
        }

        // Remove old operations outside time window
        this.operations[key] = this.operations[key].filter(
            time => now - time < timeWindow
        );

        // Check if limit exceeded
        if (this.operations[key].length >= maxOps) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        // Add current operation
        this.operations[key].push(now);
        return true;
    }
};

// Secure localStorage wrapper
const secureStorage = {
    set(key, value) {
        try {
            rateLimiter.check('storage_write', 20, 60000);
            const sanitizedKey = sanitizeInput(key);
            const jsonValue = JSON.stringify(value);
            localStorage.setItem(sanitizedKey, jsonValue);
        } catch (error) {
            console.error('Storage error:', error);
            throw error;
        }
    },

    get(key) {
        try {
            const sanitizedKey = sanitizeInput(key);
            const item = localStorage.getItem(sanitizedKey);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Storage error:', error);
            return null;
        }
    },

    remove(key) {
        try {
            const sanitizedKey = sanitizeInput(key);
            localStorage.removeItem(sanitizedKey);
        } catch (error) {
            console.error('Storage error:', error);
        }
    }
};

// Content Security Policy headers (for server-side implementation)
const cspHeaders = {
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "img-src 'self' data: blob:",
        "media-src 'self' blob:",
        "connect-src 'self'",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
    ].join('; ')
};

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sanitizeInput,
        validateFile,
        validateEthAddress,
        validateBidAmount,
        rateLimiter,
        secureStorage,
        cspHeaders
    };
}
