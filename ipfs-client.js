// IPFS Integration for ArtSoul
// Uploads artwork files and metadata to IPFS

class IPFSClient {
    constructor() {
        // Using Pinata as IPFS gateway (free tier)
        this.pinataApiKey = 'YOUR_PINATA_API_KEY'; // TODO: Get from env
        this.pinataSecretKey = 'YOUR_PINATA_SECRET_KEY'; // TODO: Get from env
        this.gateway = 'https://gateway.pinata.cloud/ipfs/';
    }

    /**
     * Upload file to IPFS via Pinata
     */
    async uploadFile(file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const metadata = JSON.stringify({
                name: file.name,
                keyvalues: {
                    platform: 'ArtSoul',
                    uploadedAt: new Date().toISOString()
                }
            });
            formData.append('pinataMetadata', metadata);

            const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('IPFS upload failed');
            }

            const result = await response.json();
            console.log('✅ File uploaded to IPFS:', result.IpfsHash);

            return {
                ipfsHash: result.IpfsHash,
                url: `${this.gateway}${result.IpfsHash}`,
                size: result.PinSize
            };
        } catch (error) {
            console.error('❌ IPFS upload failed:', error);
            throw error;
        }
    }

    /**
     * Upload JSON metadata to IPFS
     */
    async uploadMetadata(metadata) {
        try {
            const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: JSON.stringify({
                    pinataContent: metadata,
                    pinataMetadata: {
                        name: `${metadata.name}_metadata`,
                        keyvalues: {
                            platform: 'ArtSoul',
                            type: 'metadata'
                        }
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Metadata upload failed');
            }

            const result = await response.json();
            console.log('✅ Metadata uploaded to IPFS:', result.IpfsHash);

            return {
                ipfsHash: result.IpfsHash,
                url: `${this.gateway}${result.IpfsHash}`
            };
        } catch (error) {
            console.error('❌ Metadata upload failed:', error);
            throw error;
        }
    }

    /**
     * Create NFT metadata in standard format
     */
    createMetadata(artworkData) {
        return {
            name: artworkData.title,
            description: artworkData.description,
            image: `ipfs://${artworkData.ipfsHash}`,
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
                },
                {
                    trait_type: "Created At",
                    value: new Date(artworkData.createdAt * 1000).toISOString(),
                    display_type: "date"
                }
            ],
            properties: {
                category: artworkData.category || "Art",
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

// Temporary: Use public IPFS gateway for testing
// TODO: Set up Pinata account and add API keys
class PublicIPFSClient {
    constructor() {
        this.gateway = 'https://ipfs.io/ipfs/';
    }

    /**
     * For now, store files in Supabase Storage and return mock IPFS hash
     * TODO: Replace with real IPFS upload when Pinata keys are added
     */
    async uploadFile(file) {
        console.log('⚠️ Using Supabase Storage (IPFS integration pending)');

        // Upload to Supabase Storage
        const fileName = `temp_${Date.now()}_${file.name}`;
        const url = await window.ArtSoulDB.uploadFile(file, fileName);

        // Generate mock IPFS hash from URL
        const mockHash = 'Qm' + btoa(url).substring(0, 44);

        return {
            ipfsHash: mockHash,
            url: url,
            size: file.size
        };
    }

    async uploadMetadata(metadata) {
        console.log('⚠️ Storing metadata in Supabase (IPFS integration pending)');

        // For now, return mock hash
        const mockHash = 'Qm' + btoa(JSON.stringify(metadata)).substring(0, 44);

        return {
            ipfsHash: mockHash,
            url: `ipfs://${mockHash}`
        };
    }

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
            ]
        };
    }

    async generateFileHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    getUrl(ipfsHash) {
        return `${this.gateway}${ipfsHash}`;
    }
}

// Export public client for now
window.IPFSClient = new PublicIPFSClient();

console.log('📦 IPFS Client module loaded (using Supabase Storage temporarily)');
