// ==================== CONFIG & IMAGES ====================
const images = [
   "https://i.postimg.cc/2y7j2Rvc/IMG20251105192834.jpg",
  "https://i.postimg.cc/NFWcWvdM/IMG20250708113409.jpg",
  "https://i.postimg.cc/vHhc6G3t/IMG20251123101519.jpg",
  "https://i.postimg.cc/L4zq2tP0/IMG20251123100144.jpg",
  "https://i.postimg.cc/rFMDmDGB/IMG20251123101209.jpg",
  "https://i.postimg.cc/zfbBMK8Z/IMG20251123102211.jpg",
  "https://i.postimg.cc/VNx6cvkP/IMG20251123102432.jpg",
  "https://i.postimg.cc/dt6LTJ4T/IMG20251123101235.jpg",
  "https://i.postimg.cc/XNwZ4f5T/IMG20251123101147.jpg",

];

let currentIndex = 0;
let size = 3;
let total = size * size;
const completed = new Set(); // ✅ ΠΡΟΣΘΗΚΗ
let tiles = [];
let blankPos = total - 1;
let history = [];
const MAX_UNDO = 2;
let fullImageEl = null;
let hasStarted = false;
let shuffleMoves = 55; // προεπιλογή

document.querySelectorAll('#difficulty button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const moves = parseInt(btn.dataset.moves, 10);
    const newSize = parseInt(btn.dataset.size, 10);

    if (!newSize || isNaN(newSize)) {
      console.error('Λείπει data-size από κουμπί δυσκολίας', btn);
      return;
    }

    shuffleMoves = moves;

    document.querySelectorAll('#difficulty button')
      .forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');

    setGrid(newSize);

    if (hasStarted) {
      initBoard(currentIndex);
      shuffleBoard(shuffleMoves);
    }
  });
});

// ==================== DOM ====================
const boardEl = document.getElementById('board');
const boardCover = document.getElementById('board-cover');
const leftThumbs = document.getElementById('thumbs-left');
const bottomThumbs = document.getElementById('thumbs-bottom');
const infoBtn = document.getElementById('info-btn');
const infoBox = document.getElementById('info-box');
const infoClose = document.getElementById('info-close');
const rightControls = document.getElementById('right-controls');
const undoBtn = document.getElementById('undo');
const hintBtn = document.getElementById('hint');
const solveBtn = document.getElementById('solve');
const overlay = document.getElementById('overlay');
const playAgainBtn = document.getElementById('play-again');

// ==================== UTIL ====================
function boardSizePx() { return boardEl.clientWidth || 360; }
function setGrid(newSize){
  size = newSize;
  total = size * size;

  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;
}


// ==================== RENDER THUMBNAILS ====================
function renderThumbs(){
  leftThumbs.innerHTML = '';
  bottomThumbs.innerHTML = '';
  images.forEach((src,i)=>{
    const img = document.createElement('img');
    img.src = src;
    img.alt = `thumb ${i+1}`;
    img.dataset.index = i;
    img.className = 'thumb';
    if(i<5) leftThumbs.appendChild(img);
    else bottomThumbs.appendChild(img);
  });
}
renderThumbs();

// ==================== RIGHT CONTROLS ====================
function setRightControlsEnabled(enabled){
  rightControls.setAttribute('aria-hidden', enabled ? 'false' : 'true');
  undoBtn.disabled = !enabled;
  hintBtn.disabled = !enabled;
  solveBtn.disabled = !enabled;
}

// ==================== INITIAL ====================
function initInitial(){
  setRightControlsEnabled(false);
}
initInitial();

// ==================== BOARD ====================
function initBoard(index){
  currentIndex = index;
  tiles = [];
  blankPos = total - 1;
  const bsz = boardSizePx();
  boardEl.innerHTML = '';

  for(let i=0;i<total;i++){
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.correct = i;
    tile.dataset.pos = i;

    if(i === blankPos){
      tile.classList.add('blank');
    } else {
      const r = Math.floor(i/size);
      const c = i%size;
      tile.style.backgroundImage = `url(${images[index]})`;
      tile.style.backgroundPosition = `-${c*(bsz/size)}px -${r*(bsz/size)}px`;
      tile.style.backgroundSize = `${bsz}px ${bsz}px`;

      const num = document.createElement('div');
      num.className = 'tile-number';
      num.textContent = i+1;
      tile.appendChild(num);
    }

    tile.addEventListener('click',()=>onTileClick(parseInt(tile.dataset.pos)));
    tiles.push(tile);
  }
  renderTiles();
  updateMovableHighlights();
  history = [];
  updateUndoUI();
}

function renderTiles(){
  boardEl.innerHTML = '';
  tiles.forEach((t,i)=>{t.dataset.pos=i; boardEl.appendChild(t);});
}

function isAdjacent(a,b){
  const ax=a%size, ay=Math.floor(a/size);
  const bx=b%size, by=Math.floor(b/size);
  return Math.abs(ax-bx)+Math.abs(ay-by)===1;
}

function moveTile(a,b,record=true){
  if(record){
    history.push({from:a,to:b});
    if(history.length>MAX_UNDO) history.shift();
    updateUndoUI();
  }
  [tiles[a],tiles[b]]=[tiles[b],tiles[a]];
  blankPos=a;
  renderTiles();
  updateMovableHighlights();
}

function onTileClick(pos){
  if(isAdjacent(pos,blankPos)){
    moveTile(pos,blankPos,true);
    if(checkSolved()) handleSolved();
  }
}

function updateMovableHighlights(){
  tiles.forEach((t,i)=>{
    t.classList.toggle('movable', isAdjacent(i,blankPos) && !t.classList.contains('blank'));
  });
}
// ==================== CHECK IF SOLVED ====================
function checkSolved() {
  // ελέγχουμε αν κάθε tile είναι στη σωστή θέση
  for(let i=0; i<tiles.length; i++){
    if(parseInt(tiles[i].dataset.pos) !== parseInt(tiles[i].dataset.correct)){
      return false;
    }
  }
  return true;
}

function shuffleBoard(moves=36){
  let last=-1;
  for(let i=0;i<moves;i++){
    const neighbors=[];
    for(let p=0;p<total;p++) if(isAdjacent(p,blankPos)) neighbors.push(p);
    let choice=neighbors[Math.floor(Math.random()*neighbors.length)];
    if(neighbors.length>1 && choice===last) choice = neighbors.find(n=>n!==last)||choice;
    moveTile(choice,blankPos,false);
    last=choice;
  }
  history=[];
  updateUndoUI();
}

// ==================== THUMB CLICK ====================
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t.classList && t.classList.contains('thumb')) {
    const idx = parseInt(t.dataset.index);
    if(infoBox.getAttribute('aria-hidden')==='false') return;
    
    setRightControlsEnabled(false);

    if(fullImageEl){
      // fade out old full image
      fullImageEl.style.transition = 'opacity 0.4s ease';
      fullImageEl.style.opacity = 0;

      setTimeout(() => {
        removeFullImage();
        flipToImage(idx, 36); // ή initBoard(idx)
      }, 400);
    } else {
      flipToImage(idx, 36);
    }
  }
});

// Όταν ο παίκτης πατήσει σε οποιαδήποτε μικρογραφία, κρύψε το overlay
document.querySelectorAll('.thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
        overlay.classList.remove('show');
    });
});

// ==================== FLIP ANIMATION ====================
function flipToImage(newIndex,shuffleMoves=36){
  const bsz=boardSizePx();
  const tileW=bsz/3, tileH=bsz/3;
  const container=document.createElement('div');
  container.style.position='absolute';
  container.style.left='0'; container.style.top='0';
  container.style.width=bsz+'px'; container.style.height=bsz+'px';
  container.style.zIndex=60;
  boardEl.appendChild(container);

  const pieces=[];
  for(let r=0;r<3;r++){
    for(let c=0;c<3;c++){
      const wrap=document.createElement('div');
      wrap.className='cover-tile';
      wrap.style.left=c*tileW+'px'; wrap.style.top=r*tileH+'px';
      wrap.style.width=tileW+'px'; wrap.style.height=tileH+'px';
      wrap.style.transition='transform .6s ease';
      wrap.style.transformStyle='preserve-3d';

      const front=document.createElement('div');
      front.className='face front'; front.style.width='100%'; front.style.height='100%';
      front.style.backgroundSize=`${bsz}px ${bsz}px`;
      let frontSrc=images[currentIndex];
      if(!hasStarted && boardCover) frontSrc=boardCover.querySelector('img').src;
      front.style.backgroundImage=`url(${frontSrc})`;
      front.style.backgroundPosition=`-${c*tileW}px -${r*tileH}px`;

      const back=document.createElement('div');
      back.className='face back'; back.style.width='100%'; back.style.height='100%';
      back.style.backgroundSize=`${bsz}px ${bsz}px`;
      back.style.backgroundImage=`url(${images[newIndex]})`;
      back.style.backgroundPosition=`-${c*tileW}px -${r*tileH}px`;

      wrap.appendChild(front); wrap.appendChild(back);
      container.appendChild(wrap);
      pieces.push(wrap);
    }
  }

  pieces.forEach((p,i)=>{ setTimeout(()=>{p.classList.add('flip'); p.style.transform='rotateY(180deg)';}, 90*i); });
  const totalDelay=90*pieces.length+320;

  setTimeout(()=>{
    container.remove();
    if(!hasStarted && boardCover && boardCover.parentElement) boardCover.remove();
    hasStarted=true;
    initBoard(newIndex);
    shuffleBoard(shuffleMoves);
    setRightControlsEnabled(true);
  }, totalDelay+80);
}

// ==================== UNDαζO / HINT / SOLVE ====================
undoBtn.addEventListener('click',undo);
function undo(){
  if(history.length===0) return;
  const last=history.pop();
  [tiles[last.from],tiles[last.to]]=[tiles[last.to],tiles[last.from]];
  blankPos=last.to;
  renderTiles(); updateMovableHighlights(); updateUndoUI();
}
function updateUndoUI(){ undoBtn.disabled=history.length===0; }

let hintShown=false;
hintBtn.addEventListener('click',()=>{
  hintShown=!hintShown;
  tiles.forEach(t=>t.classList.toggle('show-numbers',hintShown));
});

solveBtn.addEventListener('click',()=>{
  initBoard(currentIndex); renderTiles(); handleSolved();
});

// ==================== HANDLE SOLVED (ΝΕΟ) ====================
function handleSolved(){
  showFullImage();
  createSparklesAtCenter(14, 1800);

  // 🟢 δείξε την ερώτηση
  setTimeout(() => {
    askContinue();
  }, 1200);
}

function askContinue() {
  const modal = document.createElement("div");
  modal.id = "continue-modal";

  modal.innerHTML = `
    <div class="continue-box">
      <p><b>Θες να συνεχίσεις με τοε;</b></p>
      <button class="btn-yes">Ναι</button>
      <button class="btn-no">Όχι</button>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".btn-yes").onclick = () => {
    modal.remove();
    markImageCompleted();
  };

  modal.querySelector(".btn-no").onclick = () => {
    modal.remove();
    resetToInitial();
  };
}
function markImageCompleted() {
  completed.add(currentIndex);

  const thumb = document.querySelector(
    `.thumb[data-index="${currentIndex}"]`
  );

  if (!thumb) {
    console.warn("Δεν βρέθηκε thumb για index", currentIndex);
    return;
  }

  thumb.classList.add("completed");


}

function resetToInitial() {
  // αφαιρούμε πλήρη εικόνα αν υπάρχει
  removeFullImage();

  // καθαρίζουμε board
  boardEl.innerHTML = "";

  // ξαναβάζουμε το cover
  if (!document.getElementById("board-cover")) {
    boardEl.appendChild(boardCover);
  }

  // reset flags
  hasStarted = false;
  tiles = [];
  history = [];

  // κρύβουμε controls
  setRightControlsEnabled(false);

  // αφαιρούμε glow από thumbnails
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('glow'));
}

function showFullImage(){
  removeFullImage();
  const bsz=boardSizePx();
  const img=document.createElement('img');
  img.src=images[currentIndex];
  img.style.position='absolute'; img.style.left='0'; img.style.top='0';
  img.style.width=bsz+'px'; img.style.height=bsz+'px'; img.style.zIndex=70;
  img.style.borderRadius=getComputedStyle(boardEl).borderRadius;
  img.style.transition='opacity .36s ease, transform .36s ease';
  img.style.opacity=0;
  boardEl.appendChild(img);
  requestAnimationFrame(()=> img.style.opacity=1);
  tiles.forEach(t=>t.style.display='none');
  fullImageEl=img;
}

function removeFullImage(){
  if(fullImageEl && fullImageEl.parentElement) fullImageEl.remove();
  fullImageEl=null;
  tiles.forEach(t=>t.style.display='');
}

// ==================== SPARKLES (ΝΕΑ) ====================
/**
 * createSparklesAtCenter(count, durationMs)
 * - count: πόσα sparkles να εμφανιστούν (θα εμφανιστούν με μικρή τυχαιότητα γύρω από το κέντρο)
 * - durationMs: πόσο θα κρατήσουν συνολικά (ms)
 */
function createSparklesAtCenter(count = 8, durationMs = 1600) {
  // Δημιουργούμε προσωρινό container (absolute) στο κέντρο του board
  const container = document.createElement('div');
  container.className = 'center-sparkles';
  // size/positioning μέσα στο board (όχι σε body) για να ευθυγραμμιστεί σωστά
  const rect = boardEl.getBoundingClientRect();

  // Τοποθετούμε container ως child του body αλλά μετατοπισμένο στο κέντρο της οθόνης
  // (χρησιμοποιούμε fixed positioning κάθε sparkle, οπότε δεν χρειάζεται container αλλά κρατάμε για δομή)
  document.body.appendChild(container);

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  for(let i = 0; i < count; i++){
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.textContent = '✨';

    // μικρή τυχαιότητα γύρω από κέντρο (±40px)
    const rx = cx + (Math.random() - 0.5) * 80;
    const ry = cy + (Math.random() - 0.5) * 80;

    s.style.left = rx + 'px';
    s.style.top  = ry + 'px';

    // μικρή τυχαία χρονική καθυστέρηση ώστε να μην εμφανιστούν όλα μαζί
    s.style.animationDelay = (Math.random() * 550) + 'ms';

    document.body.appendChild(s);

    // αφαιρούμε κάθε sparkle μετά το animation (duration περίπου 1400-2000ms)
    setTimeout(()=> {
      if(s && s.parentElement) s.parentElement.removeChild(s);
    }, Math.min(durationMs + 400, 2600));
  }

  // Remove container (δεν περιέχει τα sparkles απ'ευθείας, αλλά το καθαρίζουμε)
  setTimeout(()=> { if(container && container.parentElement) container.parentElement.removeChild(container); }, durationMs + 500);
}

// ==================== INFO PANEL ====================
infoBtn.addEventListener('click',()=>{
  infoBox.setAttribute('aria-hidden','false');
  setRightControlsEnabled(false);
  overlay.classList.remove('show');
});
infoClose.addEventListener('click',()=>{
  infoBox.setAttribute('aria-hidden','true');
  if(hasStarted) setRightControlsEnabled(true);
});

// ==================== WINDOW RESIZE ====================
window.addEventListener('resize',()=>{
  if(!hasStarted) return;
  const bsz=boardSizePx();
  tiles.forEach(tile=>{
    if(tile.classList.contains('blank')) return;
    const correct=parseInt(tile.dataset.correct);
    const r=Math.floor(correct/size);
    const c=correct%size;
    tile.style.backgroundSize=`${bsz}px ${bsz}px`;
    tile.style.backgroundPosition=`-${c*(bsz/size)}px -${r*(bsz/size)}px`;
  });
  if(fullImageEl){ fullImageEl.style.width=bsz+'px'; fullImageEl.style.height=bsz+'px'; }
});

// ==================== PREVENT DRAG ====================
document.addEventListener('mousedown',e=>e.preventDefault());
document.addEventListener('touchmove',()=>{}, {passive:true});
// ==================== SNOW EFFECT ====================
// ==================== SNOW WITH WIND EFFECT ====================

let windStrength = 80; // πόσο δυνατός ο άνεμος (px)

function createSnowflake() {
  const snow = document.createElement("div");
  snow.className = "snowflake";

  // τυχαία νιφάδα
  snow.textContent = Math.random() > 0.6 ? "❄" : "❅";

  const size = Math.random() * 12 + 10;
  snow.style.fontSize = size + "px";

  const startX = Math.random() * window.innerWidth;
  snow.style.left = startX + "px";

  const duration = Math.random() * 6 + 6;
  snow.style.animationDuration = duration + "s";

  // WIND OFFSET (δεξιά ή αριστερά)
  const windOffset =
    (Math.random() > 0.5 ? 1 : -1) *
    (Math.random() * windStrength + 20);

  snow.style.setProperty("--wind-x", windOffset + "px");

  document.body.appendChild(snow);

  setTimeout(() => snow.remove(), duration * 1000);
}

// χιόνι κάθε 250ms
const snowInterval = setInterval(createSnowflake, 250);

// ==================== DYNAMIC WIND ====================
// ο άνεμος αλλάζει ένταση φυσικά
setInterval(() => {
  windStrength = Math.random() * 160 + 40;
}, 4000);

