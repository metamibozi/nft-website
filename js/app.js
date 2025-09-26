// Config
const CONFIG = {
  metadataPath: './data/nfts.json',
  imagesBasePath: './assets/documents/images/',
  fallbackImage: 'https://placehold.co/400x400/6a0dad/FFFFFF/png?text=CONSECTRA+NFT'
};

// State
let allNFTs = [];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Loading CONSECTRA NFTs...');
  loadNFTs();
  
  // View Details button event listeners
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('view-details') || e.target.closest('.view-details')) {
    const button = e.target.classList.contains('view-details') ? e.target : e.target.closest('.view-details');
    const tokenId = button.dataset.tokenId;
    showNFTDetails(tokenId);
  }
});

// NFT Modal kapat (dış tık kalır, X butonu delegation ile çalışır)
const nftModal = document.getElementById('nft-modal');
if (nftModal) {
  // Dış tık kapat (kalsın)
  nftModal.addEventListener('click', (e) => {
    if (e.target === nftModal) {
      nftModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

// X butonu için delegation (dinamik eklenen butonlar için)
document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('close-modal') && e.target.closest('#nft-modal')) {
    const nftModal = document.getElementById('nft-modal');
    if (nftModal) {
      nftModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  }
});

  // YENİ EKLE: Smooth scroll to top on logo click
  const siteLogo = document.getElementById('site-logo');
  if (siteLogo) {
    siteLogo.addEventListener('click', (e) => {
      e.preventDefault();  // Varsayılan davranışı engelle
      window.scrollTo({
        top: 0,
        behavior: 'smooth'  // Yumuşak kaydırma
      });
    });
    siteLogo.style.cursor = 'pointer';  // Tıklanabilir imleç
    siteLogo.title = 'Scroll to top';  // Tooltip (opsiyonel)
  }

  // PDF Modal Preview – SADECE kırmızı kutu için
const pdfModal = document.getElementById('pdf-modal');
const pdfIframe = document.getElementById('pdf-iframe');
const previewBtn = document.querySelector('.preview-btn');  // Kırmızı kutu class'ı

if (previewBtn) {
  previewBtn.addEventListener('click', (e) => {
    e.preventDefault();  // Download engelle
    pdfIframe.src = 'assets/documents/Digital Certificate of Authenticity - Rise of CONSECTRA.pdf';
    pdfModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  });
  previewBtn.title = 'Click to Preview';  // Hover tooltip
}

  // Modal kapat (X butonu)
  const closeModalBtn = document.querySelector('.close-modal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      pdfModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      pdfIframe.src = '';  // Iframe'i temizle
    });
  }

  // Modal dışına tıkla kapat
  if (pdfModal) {
    pdfModal.addEventListener('click', (e) => {
      if (e.target === pdfModal) {
        pdfModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        pdfIframe.src = '';
      }
    });
  }

  // Escape tuşu ile kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pdfModal && pdfModal.style.display === 'block') {
      pdfModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      pdfIframe.src = '';
    }
  });
});

// Load NFTs from JSON - FIXED VERSION
async function loadNFTs() {
  showLoading();
  
  try {
    const response = await fetch(CONFIG.metadataPath);
    const nftsData = await response.json();
    
    console.log('📦 Loaded NFT data:', nftsData.length, 'items');

    // JSON array ise direkt kullan
    allNFTs = Array.isArray(nftsData) ? nftsData : [nftsData];

    // Görsel ve rarity bilgilerini düzelt
    allNFTs = allNFTs.map((nft, index) => {
      // 1. GERÇEK DOSYA İSMİNİ BUL: "phoenix_001.png" → "phoenix_001_09_24_2025.webp"
      const fileName = nft.properties?.file_name || `phoenix_${String(index + 1).padStart(3, '0')}.png`;
      const webpFileName = fileName.replace('.png', '_09_24_2025.webp');
      const imageUrl = CONFIG.imagesBasePath + webpFileName;
      
      // 2. RARITY BİLGİSİNİ BUL: attributes içinden "Rarity Level"ı bul
      let rarity = 'common';
      if (nft.attributes && Array.isArray(nft.attributes)) {
        const rarityAttr = nft.attributes.find(attr => 
          attr.trait_type === 'Rarity Level' || attr.trait_type === 'Rarity'
        );
        if (rarityAttr) {
          rarity = rarityAttr.value.toLowerCase();
        }
      }
      
      // 3. TOKEN ID: properties.token_id veya index
      const tokenId = nft.properties?.token_id || index + 1;

      return {
        name: nft.name || `Phoenix #${index + 1}`,
        description: nft.description || 'Rise of CONSECTRA Phoenix NFT',
        image: imageUrl,
        rarity: rarity,
        tokenId: tokenId,
        attributes: nft.attributes || [],
        properties: nft.properties || {}
      };
    });

    console.log('✅ Processed NFTs:', allNFTs);
    renderNFTs();
    setupFilters();
    setupSearch();
    hideLoading();
    
  } catch (error) {
    console.error('❌ Error loading NFTs:', error);
    showError('Failed to load NFT collection. Please check the console for details.');
    hideLoading();
  }
}

// Render NFTs
function renderNFTs() {
  const container = document.getElementById('nft-container');
  if (!container) {
    console.error('❌ NFT container not found!');
    return;
  }

  if (allNFTs.length === 0) {
    container.innerHTML = '<div class="error">No NFTs found in collection</div>';
    return;
  }

  const html = allNFTs.map(nft => `
  <div class="nft-card" data-rarity="${nft.rarity}">
    <div class="nft-image-container">
      <img src="${nft.image}" alt="${nft.name}" class="nft-image" 
           onerror="this.src='${CONFIG.fallbackImage}'; console.log('Image failed:', '${nft.image}')">
      <div class="nft-overlay">
        <button class="btn btn-outline view-details" data-token-id="${nft.tokenId}">View Details</button>
      </div>
    </div>
    <div class="nft-info">
      <h3>${nft.name}</h3>
      <p>${nft.description.substring(0, 150)}...</p>
      <div class="nft-meta">
        <span class="rarity rarity-${nft.rarity}">${nft.rarity}</span>
        <span class="token-id">#${nft.tokenId}</span>
      </div>
    </div>
  </div>
`).join('');

  container.innerHTML = html;
  console.log('🎨 Rendered', allNFTs.length, 'NFTs');
}

// Setup Filters
function setupFilters() {
  const container = document.getElementById('filters');
  if (!container) return;

  const rarities = ['all', 'ultra rare', 'mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  
  const filtersHTML = rarities.map(rarity => {
    const count = rarity === 'all' ? allNFTs.length : allNFTs.filter(n => n.rarity === rarity).length;
    const displayName = rarity === 'all' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1);
    
    return `
      <button class="filter-btn" data-filter="${rarity}">
        ${displayName} (${count})
      </button>
    `;
  }).join('');

  container.innerHTML = filtersHTML;

  // Filter event listeners
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      let filteredNFTs = [];
      
      if (filter === 'all') {
        filteredNFTs = allNFTs;
      } else {
        filteredNFTs = allNFTs.filter(nft => nft.rarity === filter);
      }
      
      renderFilteredNFTs(filteredNFTs);
    });
  });
}

// Render filtered NFTs
function renderFilteredNFTs(filteredNFTs) {
  const container = document.getElementById('nft-container');
  if (!container) return;

  const html = filteredNFTs.map(nft => `
  <div class="nft-card" data-rarity="${nft.rarity}">
    <div class="nft-image-container">
      <img src="${nft.image}" alt="${nft.name}" class="nft-image" 
           onerror="this.src='${CONFIG.fallbackImage}'">
      <div class="nft-overlay">
        <button class="btn btn-outline view-details" data-token-id="${nft.tokenId}">View Details</button>
      </div>
    </div>
    <div class="nft-info">
      <h3>${nft.name}</h3>
      <p>${nft.description.substring(0, 150)}...</p>
      <div class="nft-meta">
        <span class="rarity rarity-${nft.rarity}">${nft.rarity}</span>
        <span class="token-id">#${nft.tokenId}</span>
      </div>
    </div>
  </div>
`).join('');

  container.innerHTML = html;
}

// Setup Search
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (!query) {
      renderNFTs();
      return;
    }

    const filtered = allNFTs.filter(nft =>
      nft.name.toLowerCase().includes(query) ||
      nft.description.toLowerCase().includes(query) ||
      nft.rarity.toLowerCase().includes(query) ||
      nft.tokenId.toString().includes(query)
    );

    renderFilteredNFTs(filtered);
  });
}

// Utility Functions
function showLoading() {
  const loading = document.getElementById('loading');
  const container = document.getElementById('nft-container');
  if (loading) loading.style.display = 'block';
  if (container) container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading amazing phoenix NFTs...</p></div>';
}

function hideLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
}

function showError(message) {
  const container = document.getElementById('nft-container');
  if (container) {
    container.innerHTML = `
      <div class="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
        <button class="btn" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }
}

// Show NFT Details in Modal
function showNFTDetails(tokenId) {
  const nft = allNFTs.find(n => n.tokenId.toString() === tokenId.toString());
  if (!nft) return;

  const modalContent = document.getElementById('modal-content');
  if (!modalContent) return;

  const rarityClass = `rarity-${nft.rarity}`;
  const imageUrl = nft.image || CONFIG.fallbackImage;

  modalContent.innerHTML = `
    <div class="modal-header">
      <h2>${nft.name}</h2>
      <button class="close-modal">&times;</button>
    </div>
    <div class="modal-body">
      <div class="modal-image">
        <img src="${imageUrl}" alt="${nft.name}" onerror="this.src='${CONFIG.fallbackImage}'">
      </div>
      <div class="modal-info">
        <div class="info-section">
          <h3>Details</h3>
          <p><strong>Token ID:</strong> ${nft.tokenId}</p>
          <p><strong>Rarity:</strong> <span class="rarity ${rarityClass}">${nft.rarity}</span></p>
          <p><strong>Description:</strong> ${nft.description}</p>
        </div>
        ${nft.attributes && nft.attributes.length > 0 ? `
          <div class="info-section">
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
        ` : ''}
        ${nft.properties && Object.keys(nft.properties).length > 0 ? `
          <div class="info-section">
            <h3>Properties</h3>
            <div class="properties-grid">
              ${Object.entries(nft.properties).map(([key, value]) => `
                <div class="property">
                  <span class="property-name">${key}:</span>
                  <span class="property-value">${value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const nftModal = document.getElementById('nft-modal');
  if (nftModal) {
    nftModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}
