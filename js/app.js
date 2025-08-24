// Config
const CONFIG = {
    metadataPath: 'data/nfts.json',
    imagesBasePath: 'https://metamibozi.github.io/nft-website/images/',
    fallbackImage: 'assets/images/placeholder.webp'
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
        
        // Görsel URL'lerini düzelt
        allNFTs = allNFTs.map(nft => {
            // PNG dosyalarını WebP'ye çevir ve GitHub URLsini kullan
            const webpFilename = nft.properties.file_name.replace('.png', '_08_24_2025.webp');
            return {
                ...nft,
                image: `${CONFIG.imagesBasePath}${webpFilename}`,
                rarity: getRarityFromAttributes(nft.attributes),
                tokenId: nft.properties.token_id
            };
        });
        
        filteredNFTs = [...allNFTs];
        
        renderNFTs();
        updateFilterCounts();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading NFTs:', error);
        showError('Failed to load NFT data. Please check the metadata file.');
        hideLoading();
    }
}

// Attributes'tan rarity bilgisini çek
function getRarityFromAttributes(attributes) {
    const rarityAttr = attributes.find(attr => attr.trait_type === "Rarity Level");
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
            <img src="${imageUrl}" alt="${nft.name}" class="nft-image" 
                 onerror="this.onerror=null; this.src='${CONFIG.fallbackImage}';">
            <div class="nft-info">
                <h3>${nft.name || 'Unnamed NFT'}</h3>
                <p>${nft.description ? nft.description.substring(0, 100) + '...' : 'No description available'}</p>
                <div class="nft-meta">
                    <span class="rarity ${rarityClass}">${nft.rarity || 'Common'}</span>
                    <span>${nft.tokenId || 'Unknown ID'}</span>
                </div>
                <button class="btn btn-outline view-details" data-id="${nft.tokenId}">
                    View Details
                </button>
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

// Show NFT Details Modal
function showNFTDetails(nftId) {
    const nft = allNFTs.find(n => n.tokenId === nftId);
    if (!nft) return;
    
    const rarityClass = `rarity-${nft.rarity?.toLowerCase() || 'common'}`;
    
    modalContent.innerHTML = `
        <button class="close-modal">&times;</button>
        <h2>${nft.name}</h2>
        <div class="modal-image">
            <img src="${nft.image || CONFIG.fallbackImage}" alt="${nft.name}" 
                 onerror="this.src='${CONFIG.fallbackImage}'">
        </div>
        <div class="modal-info">
            <p><strong>Token ID:</strong> ${nft.tokenId}</p>
            <p><strong>Rarity:</strong> <span class="rarity ${rarityClass}">${nft.rarity}</span></p>
            <p><strong>Description:</strong> ${nft.description}</p>
            
            <div class="attributes">
                <h3>Attributes</h3>
                <div class="attributes-grid">
                    ${nft.attributes.map(attr => `
                        <div class="attribute">
                            <span class="attribute-name">${attr.trait_type}:</span>
                            <span class="attribute-value">${attr.value}</span>
                        </div>
                    `).join('')}
                </div>
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
        if (e.target.classList.contains('view-details')) {
            const nftId = e.target.dataset.id;
            showNFTDetails(nftId);
        }
    });
    
    // Close modal
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-modal') || e.target === modal) {
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
            nft.name?.toLowerCase().includes(searchTerm) ||
            nft.description?.toLowerCase().includes(searchTerm) ||
            nft.tokenId?.toLowerCase().includes(searchTerm) ||
            nft.rarity?.toLowerCase().includes(searchTerm)
        );
    }
    
    renderNFTs();
}

// Utility Functions
function showLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    nftContainer.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading NFTs...</p>
        </div>
    `;
}

function hideLoading() {
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

function showError(message) {
    nftContainer.innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Try Again</button>
        </div>
    `;
}

// Export for global access
window.NFTApp = {
    loadNFTs,
    filterNFTs,
    searchNFTs,
    showNFTDetails,
    closeModal
};
