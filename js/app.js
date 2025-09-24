// Config
const CONFIG = {
    metadataPath: 'data/nfts.json',
    imagesBasePath: 'assets/images/',
    fallbackImage: 'https://placehold.co/400x400/6a0dad/FFFFFF/png?text=CONSECTRA+NFT'
};

// State
let allNFTs = [];
let filteredNFTs = [];

// DOM Elements
const nftContainer = document.getElementById('nft-container');
const filtersContainer = document.getElementById('filters');
const modal = document.getElementById('nft-modal');
const modalContent = document.getElementById('modal-content');
const searchInput = document.getElementById('search-input');
const loadingElement = document.getElementById('loading');
const nftCountElement = document.getElementById('nft-count');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

async function initApp() {
    try {
        await loadNFTs();
        setupEventListeners();
        setupFilters();
    } catch (error) {
        showError('Failed to initialize application: ' + error.message);
    }
}

// Load NFTs from JSON
async function loadNFTs() {
    showLoading();
    
    try {
        const response = await fetch(CONFIG.metadataPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allNFTs = await response.json();
        
        // Yeni JSON yapısına göre NFT'leri işle
        allNFTs = allNFTs.map((nft, index) => {
            // Görsel yolunu düzelt - yeni dosya isimlerine göre
            const imageFilename = nft.image || `phoenix_${String(index + 1).padStart(3, '0')}_09_24_2025.webp`;
            
            return {
                ...nft,
                image: `${CONFIG.imagesBasePath}${imageFilename}`,
                rarity: getRarityFromAttributes(nft.attributes),
                tokenId: nft.tokenId || index + 1,
                // Yeni alanları ekle
                external_url: nft.external_url || 'https://metamibozi.github.io/nft-website/',
                description: nft.description || `Rise of CONSECTRA Collection - Unique Phoenix NFT #${index + 1}`
            };
        });
        
        filteredNFTs = [...allNFTs];
        
        renderNFTs();
        updateFilterCounts();
        updateNFTCount();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading NFTs:', error);
        showError('Failed to load NFT data. Please check the metadata file.');
        hideLoading();
    }
}

// Attributes'tan rarity bilgisini çek (yeni yapıya göre)
function getRarityFromAttributes(attributes) {
    if (!attributes || !Array.isArray(attributes)) return "Common";
    
    const rarityAttr = attributes.find(attr => 
        attr.trait_type && (
            attr.trait_type.toLowerCase().includes("rarity") ||
            attr.trait_type.toLowerCase().includes("level")
        )
    );
    
    return rarityAttr ? rarityAttr.value : "Common";
}

// Render NFTs
function renderNFTs() {
    if (filteredNFTs.length === 0) {
        nftContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-search"></i>
                <p>No NFTs found matching your criteria</p>
            </div>
        `;
        return;
    }

    const html = filteredNFTs.map(nft => createNFTCard(nft)).join('');
    nftContainer.innerHTML = html;
    
    // Add animations
    const cards = nftContainer.querySelectorAll('.nft-card');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
}

// Create NFT Card HTML
function createNFTCard(nft) {
    const rarityClass = `rarity-${nft.rarity?.toLowerCase() || 'common'}`;
    const imageUrl = nft.image || CONFIG.fallbackImage;
    
    return `
        <div class="nft-card" data-rarity="${nft.rarity?.toLowerCase() || 'common'}" data-id="${nft.tokenId}">
            <div class="nft-image-container">
                <img src="${imageUrl}" alt="${nft.name}" class="nft-image" 
                     onerror="this.onerror=null; this.src='${CONFIG.fallbackImage}';">
                <div class="nft-overlay">
                    <button class="btn btn-outline view-details" data-id="${nft.tokenId}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
            <div class="nft-info">
                <h3>${nft.name || `CONSECTRA #${nft.tokenId}`}</h3>
                <p class="nft-description">${nft.description ? nft.description.substring(0, 120) + '...' : 'No description available'}</p>
                <div class="nft-meta">
                    <span class="rarity ${rarityClass}">
                        <i class="fas fa-gem"></i> ${nft.rarity || 'Common'}
                    </span>
                    <span class="token-id">#${nft.tokenId}</span>
                </div>
            </div>
        </div>
    `;
}

// Setup Filters
function setupFilters() {
    const rarities = ['all', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
    
    const filtersHTML = rarities.map(rarity => `
        <button class="filter-btn" data-filter="${rarity}">
            ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            <span class="filter-count" data-rarity="${rarity}">0</span>
        </button>
    `).join('');
    
    filtersContainer.innerHTML = filtersHTML;
    
    // Add filter event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            filterNFTs(filter);
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
    
    // Set 'all' as active initially
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
}

// Filter NFTs
function filterNFTs(filter) {
    if (filter === 'all') {
        filteredNFTs = [...allNFTs];
    } else {
        filteredNFTs = allNFTs.filter(nft => 
            nft.rarity?.toLowerCase() === filter
        );
    }
    
    renderNFTs();
    updateNFTCount();
}

// Update filter counts
function updateFilterCounts() {
    const counts = {
        all: allNFTs.length,
        mythic: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'mythic').length,
        legendary: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'legendary').length,
        epic: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'epic').length,
        rare: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'rare').length,
        uncommon: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'uncommon').length,
        common: allNFTs.filter(nft => nft.rarity?.toLowerCase() === 'common').length
    };
    
    Object.entries(counts).forEach(([rarity, count]) => {
        const element = document.querySelector(`.filter-count[data-rarity="${rarity}"]`);
        if (element) {
            element.textContent = ` (${count})`;
        }
    });
}

// Update NFT count display
function updateNFTCount() {
    if (nftCountElement) {
        nftCountElement.textContent = `${filteredNFTs.length} of ${allNFTs.length} NFTs`;
    }
}

// Show NFT Details Modal
function showNFTDetails(nftId) {
    const nft = allNFTs.find(n => n.tokenId == nftId);
    if (!nft) return;
    
    const rarityClass = `rarity-${nft.rarity?.toLowerCase() || 'common'}`;
    const imageUrl = nft.image || CONFIG.fallbackImage;
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${nft.name || `CONSECTRA #${nft.tokenId}`}</h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="modal-image">
                <img src="${imageUrl}" alt="${nft.name}" 
                     onerror="this.src='${CONFIG.fallbackImage}'">
            </div>
            <div class="modal-info">
                <div class="info-section">
                    <h3>Details</h3>
                    <p><strong>Token ID:</strong> ${nft.tokenId}</p>
                    <p><strong>Rarity:</strong> <span class="rarity ${rarityClass}">${nft.rarity || 'Common'}</span></p>
                </div>
                
                <div class="info-section">
                    <h3>Description</h3>
                    <p>${nft.description || 'No description available.'}</p>
                </div>
                
                ${nft.attributes && nft.attributes.length > 0 ? `
                <div class="info-section">
                    <h3>Attributes</h3>
                    <div class="attributes-grid">
                        ${nft.attributes.map(attr => `
                            <div class="attribute">
                                <span class="attribute-name">${attr.trait_type || 'Attribute'}:</span>
                                <span class="attribute-value">${attr.value || 'N/A'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Setup Event Listeners
function setupEventListeners() {
    // View details
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details') || e.target.closest('.view-details')) {
            const button = e.target.classList.contains('view-details') ? e.target : e.target.closest('.view-details');
            const nftId = button.dataset.id;
            showNFTDetails(nftId);
        }
    });
    
    // Close modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal') || e.target === modal) {
            closeModal();
        }
    });
    
    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchNFTs(e.target.value);
        });
    }
    
    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Close Modal
function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Search NFTs
function searchNFTs(query) {
    if (!query.trim()) {
        filteredNFTs = [...allNFTs];
    } else {
        const searchTerm = query.toLowerCase();
        filteredNFTs = allNFTs.filter(nft =>
            (nft.name?.toLowerCase().includes(searchTerm)) ||
            (nft.description?.toLowerCase().includes(searchTerm)) ||
            (nft.tokenId?.toString().includes(searchTerm)) ||
            (nft.rarity?.toLowerCase().includes(searchTerm)) ||
            (nft.attributes?.some(attr => 
                attr.value?.toLowerCase().includes(searchTerm)
            ))
        );
    }
    
    renderNFTs();
    updateNFTCount();
}

// Utility Functions
function showLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    if (nftContainer) {
        nftContainer.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading NFTs...</p>
            </div>
        `;
    }
}

function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showError(message) {
    if (nftContainer) {
        nftContainer.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button class="btn" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }
}

// Export for global access
window.NFTApp = {
    loadNFTs,
    filterNFTs,
    searchNFTs,
    showNFTDetails,
    closeModal
};
