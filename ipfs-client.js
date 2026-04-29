// IPFS Integration for ArtSoul
// Currently using Supabase Storage as file storage
// IPFS integration can be added later when needed

/**
 * IPFS Client using Supabase Storage
 * Files are stored in Supabase Storage bucket 'artworks'
 * Mock IPFS hashes are generated for blockchain compatibility
 */
class IPFSClient {
    constructor() {
        this.gateway = 'https://ipfs.io/ipfs/';
    }

    /**
     * Upload file to Supabase Storage
     * Returns mock IPFS hash for blockchain compatibility
     */
    async uploadFile(file) {
        console.log('📤 Uploading to Supabase Storage...');

        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const url = await window.ArtSoulDB.uploadFile(file, fileName);

        // Generate mock IPFS hash from URL for blockchain compatibility
        const mockHash = 'Qm' + btoa(url).substring(0, 44);

        return {
            ipfsHash: mockHash,
            url: url,
            size: file.size
        };
    }

    /**
     * Upload metadata (stored as mock IPFS hash)
     */
    async uploadMetadata(metadata) {
        console.log('📝 Creating metadata...');

        // Generate mock hash for metadata
        const mockHash = 'Qm' + btoa(JSON.stringify(metadata)).substring(0, 44);

        return {
            ipfsHash: mockHash,
            url: `ipfs://${mockHash}`
        };
    }

    /**
     * Create NFT metadata in standard format
     */
    createMetadata(artworkData) {
        return {
            name: artworkData.title,
            description: artworkData.description,
            image: artworkData.imageUrl,
            external_url: `https://maysonkiller.github.io/artsoul-marketplace/artwork.html?id=${artworkData.id}`,
            attributes: [
                {
                    trait_type: "Creator",
                    value: artworkData.creator
                },
                {
                    trait_type: "Creator Value",
                    value: artworkData.creatorValue,
                    display_type: "number"
                }
            ],
            properties: {
                category: "Art",
                creator: artworkData.creator
            }
        };
    }

    /**
     * Generate file hash for duplicate detection
     */
    async generateFileHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Get IPFS URL from hash
     */
    getUrl(ipfsHash) {
        return `${this.gateway}${ipfsHash}`;
    }
}

// Export singleton instance
window.IPFSClient = new IPFSClient();

console.log('📦 IPFS Client module loaded (using Supabase Storage)');
