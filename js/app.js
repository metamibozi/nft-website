const $ = (s) => document.querySelector(s);
const grid = $('#grid');
const overlay = $('#overlay');
const modalBody = $('#modal-body');
const closeBtn = $('#close');

let nfts = [];

async function load() {
  try {
    const res = await fetch('data/nfts.json', {cache:'no-store'});
    nfts = await res.json();
    render();
  } catch (e) {
    grid.innerHTML = `<p style="color:#f77">Could not load data/nfts.json</p>`;
  }
}

function render() {
  const q = $('#q').value.trim().toLowerCase();
  const rarity = $('#rarity').value;
  const sort = $('#sort').value;

  let list = [...nfts];

  if (rarity) list = list.filter(x => (x.rarity||'').toLowerCase() === rarity.toLowerCase());
  if (q) list = list.filter(x =>
    (x.name||'').toLowerCase().includes(q) ||
    (x.description||'').toLowerCase().includes(q) ||
    (x.traits||[]).some(t => (t.value||'').toLowerCase().includes(q))
  );

  if (sort === 'name') list.sort((a,b)=> (a.name||'').localeCompare(b.name||''));
  else list.sort((a,b)=> (b.id||'').localeCompare(a.id||'')); // newest by id

  grid.innerHTML = list.map(cardHTML).join('');
  attachEvents();
}

function cardHTML(x){
  const badge = x.rarity ? `<span class="badge">${x.rarity}</span>` : '';
  const img = `<img class="thumb" src="${x.image}" alt="${x.name||'NFT'}" loading="lazy">`;
  return `
    <article class="card" data-id="${x.id}">
      <div style="position:relative">${badge}${img}</div>
      <div class="pad">
        <div class="title">${x.name||'Untitled'}</div>
        <div class="desc">${x.description||''}</div>
        <div class="row">
          ${x.openseaUrl ? `<a class="btn primary" target="_blank" href="${x.openseaUrl}">OpenSea</a>` : ''}
          ${x.tokenUri ? `<a class="btn" target="_blank" href="${x.tokenUri}">Token URI</a>` : ''}
          <button class="btn view">View</button>
        </div>
      </div>
    </article>
  `;
}

function attachEvents(){
  document.querySelectorAll('.view').forEach(btn=>{
    btn.addEventListener('click',(e)=>{
      const card = e.target.closest('.card');
      const id = card.dataset.id;
      const x = nfts.find(n=>n.id===id);
      showModal(x);
    });
  });
}

function showModal(x){
  const traits = (x.traits||[]).map(t=>`<span class="trait"><b>${t.trait_type}:</b> ${t.value}</span>`).join('');
  modalBody.innerHTML = `
    <div class="modal-grid">
      <div><img src="${x.image}" alt="${x.name||'NFT'}"></div>
      <div>
        <h2 class="title" style="font-size:22px">${x.name||'Untitled'}</h2>
        <p class="desc" style="min-height:auto">${x.description||''}</p>
        <div class="traits">${traits}</div>
        <div class="row">
          ${x.openseaUrl ? `<a class="btn primary" target="_blank" href="${x.openseaUrl}">OpenSea</a>` : ''}
          ${x.tokenUri ? `<a class="btn" target="_blank" href="${x.tokenUri}">Token URI</a>` : ''}
        </div>
      </div>
    </div>`;
  overlay.classList.remove('hidden');
}
closeBtn.addEventListener('click', ()=> overlay.classList.add('hidden'));
overlay.addEventListener('click', (e)=> { if(e.target===overlay) overlay.classList.add('hidden'); });

['#q','#rarity','#sort'].forEach(s=> $(s).addEventListener('input', render));

load();
