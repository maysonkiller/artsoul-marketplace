# ArtSoul Marketplace - Security Guide

## Implemented Security Measures

### 1. Input Sanitization
- All user inputs are sanitized to prevent XSS attacks
- HTML special characters are escaped
- Use `sanitizeInput()` function for all user-provided data

### 2. File Upload Validation
- Maximum file size: 100MB
- Allowed file types:
  - Images: JPEG, PNG, GIF, WebP
  - Videos: MP4, WebM
  - Audio: MP3, WAV, OGG
- File extension validation
- MIME type checking

### 3. Rate Limiting
- localStorage operations limited to 20 per minute
- Prevents abuse and DoS attacks
- Automatic cleanup of old operation records

### 4. Secure Storage
- Wrapper around localStorage with sanitization
- Error handling for storage operations
- JSON validation

### 5. Validation Functions
- ETH address validation (0x + 40 hex characters)
- Bid amount validation (must be positive and higher than current bid)
- Input type checking

## Usage Examples

### Sanitize User Input
```javascript
const userInput = sanitizeInput(document.getElementById('input').value);
```

### Validate File Upload
```javascript
try {
    validateFile(file);
    // Proceed with upload
} catch (error) {
    alert(error.message);
}
```

### Use Secure Storage
```javascript
// Save data
secureStorage.set('userProfile', profileData);

// Get data
const profile = secureStorage.get('userProfile');

// Remove data
secureStorage.remove('userProfile');
```

### Validate ETH Address
```javascript
if (validateEthAddress(walletAddress)) {
    // Valid address
} else {
    alert('Invalid Ethereum address');
}
```

## Best Practices

1. **Always sanitize user input** before displaying or storing
2. **Validate files** before upload
3. **Use secure storage** instead of direct localStorage access
4. **Implement rate limiting** for sensitive operations
5. **Never trust client-side validation alone** - implement server-side validation when backend is added

## Future Improvements

When adding a backend:
1. Implement CSRF tokens
2. Add server-side validation
3. Use HTTPS only
4. Implement proper authentication (JWT, OAuth)
5. Add Content Security Policy headers
6. Implement SQL injection prevention
7. Add request rate limiting at server level
8. Use secure session management
9. Implement proper CORS policies
10. Add logging and monitoring

## Content Security Policy

Recommended CSP headers (for server implementation):
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

## Reporting Security Issues

If you discover a security vulnerability, please email: security@artsoul.io

## License

MIT License - See LICENSE file for details
