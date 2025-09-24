// Config
const CONFIG = {
  metadataPath: './data/nfts.json',
  imagesBasePath: './images/',
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

    const nftsData = await response.json();
    
    // JSON yapısını kontrol et
    if (Array.isArray(nftsData)) {
      allNFTs = nftsData;
    } else {
      allNFTs = [];
    }

    console.log('Loaded NFTs:', allNFTs.length);

    // ✅ OTOMATİK GÖRSEL İSİM DÖNÜŞTÜRME
    allNFTs = allNFTs.map((nft, index) => {
        let imageFilename = nft.image || '';
        
        // PNG → WEBP dönüştür
        if (imageFilename.includes('.png')) {
            imageFilename = imageFilename.replace('.png', '.webp');
        }
        
        // "phoenix_001.webp" → "phoenix_001_09_24_2025.webp" formatına çevir
        if (imageFilename.includes('phoenix_')) {
            const numberMatch = imageFilename.match(/phoenix_(\d+)\.webp/);
            if (numberMatch) {
                const number = numberMatch[1].padStart(3, '0'); // 1 → 001
                imageFilename = `phoenix_${number}_09_24_2025.webp`;
            }
        }

        const imagePath = imageFilename ? `${CONFIG.imagesBasePath}${imageFilename}` : CONFIG.fallbackImage;

        return {
            ...nft,
            image: imagePath,
            rarity: nft.rarity || 'common',
            tokenId: nft.tokenId || index + 1,
            name: nft.name || `CONSECTRA Phoenix #${index + 1}`,
            description: nft.description || `Unique Phoenix NFT from Rise of CONSECTRA collection.`
        };
    });

    filteredNFTs = [...allNFTs];
    renderNFTs();
    updateFilterCounts();
    updateTotalCount();
    hideLoading();
    
  } catch (error) {
    console.error('Error loading NFTs:', error);
    showError('Failed to load NFT data: ' + error.message);
    hideLoading();
  }
}

// Attributes'tan rarity bilgisini çek
function getRarityFromAttributes(attributes) {
  if (!attributes || !Array.isArray(attributes)) return "common";

  const rarityAttr = attributes.find(attr =>
    attr.trait_type && (
      attr.trait_type.toLowerCase().includes("rarity") ||
      attr.trait_type.toLowerCase().includes("level")
    )
  );

  return rarityAttr ? rarityAttr.value.toLowerCase() : "common";
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
  const rarityClass = `rarity-${nft.rarity || 'common'}`;
  const imageUrl = nft.image || CONFIG.fallbackImage;

  return `
    <div class="nft-card" data-rarity="${nft.rarity}" data-id="${nft.tokenId}">
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
            <i class="fas fa-gem"></i> ${nft.rarity || 'common'}
          </span>
          <span class="token-id">#${nft.tokenId}</span>
        </div>
      </div>
    </div>
  `;
}

// Setup Filters
function setupFilters() {
  const rarities = ['all', 'ultra rare', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const filtersHTML = rarities.map(rarity => {
    const displayName = rarity === 'all' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1);
    return `
      <button class="filter-btn" data-filter="${rarity}">
        ${displayName}
        <span class="filter-count" data-rarity="${rarity}">(0)</span>
      </button>
    `;
  }).join('');

  filtersContainer.innerHTML = filtersHTML;

  // Filtre event listener'larını ekle
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.currentTarget.dataset.filter;
      filterNFTs(filter);

      // Aktif state'i güncelle
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  // Başlangıçta 'all' aktif olsun
  document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
}

// Filter NFTs
function filterNFTs(filter) {
  if (filter === 'all') {
    filteredNFTs = [...allNFTs];
  } else {
    filteredNFTs = allNFTs.filter(nft => nft.rarity === filter);
  }

  renderNFTs();
  updateNFTCount();
}

// Update filter counts
function updateFilterCounts() {
  const rarities = ['all', 'ultra rare', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  
  rarities.forEach(rarity => {
    let count;
    if (rarity === 'all') {
      count = allNFTs.length;
    } else {
      count = allNFTs.filter(nft => nft.rarity && nft.rarity.toLowerCase() === rarity).length;
    }
    
    const filterBtn = document.querySelector(`.filter-btn[data-filter="${rarity}"]`);
    
    if (filterBtn) {
      // Mevcut count span'ını bul veya oluştur
      let countSpan = filterBtn.querySelector('.filter-count');
      if (!countSpan) {
        countSpan = document.createElement('span');
        countSpan.className = 'filter-count';
        countSpan.setAttribute('data-rarity', rarity);
        filterBtn.appendChild(countSpan);
      }
      countSpan.textContent = ` (${count})`;
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

  const rarityClass = `rarity-${nft.rarity || 'common'}`;
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
          <p><strong>Rarity:</strong> <span class="rarity ${rarityClass}">${nft.rarity || 'common'}</span></p>
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
