// ---------------- Hamburger Menu ----------------
const sidebar = document.getElementById("sidebar");
const pageContent = document.getElementById("pageContent");
const hamburgerBtn = document.getElementById("hamburgerBtn");

if (hamburgerBtn) {
  hamburgerBtn.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    pageContent.classList.toggle("shift");
  });
}

// ---------------- Supabase Setup ----------------
const SUPABASE_URL = "https://qwcfxuwerdpadntjxwvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2Z4dXdlcmRwYWRudGp4d3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDQyNjcsImV4cCI6MjA4MzcyMDI2N30.5kMmJwYQQ0vugPplzXhHjeG2C3QB5CQZ39p57WQv1ag";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------- DOM Elements ----------------
const form = document.getElementById("tradeForm");
const tradeList = document.getElementById("tradeList");
const toggleBtn = document.getElementById("toggleTrades");
const topBalanceEl = document.getElementById("topBalance");
const userEmailEl = document.getElementById("userEmail");
const accountEmailEl = document.getElementById("accountEmail");
const logoutBtn = document.getElementById("logoutBtn");

const stats = {
  total: document.getElementById("totalTrades"),
  win: document.getElementById("winningTrades"),
  rate: document.getElementById("winRate"),
  avg: document.getElementById("avgPnl"),
  max: document.getElementById("maxPnl"),
  min: document.getElementById("minPnl")
};

const initialBalanceEl = document.getElementById("initialBalance");
const currentPnlEl = document.getElementById("currentPnl");

const date = document.getElementById("date");
const symbol = document.getElementById("symbol");
const direction = document.getElementById("direction");
const lotSize = document.getElementById("lotSize");
const sl = document.getElementById("sl");
const entry = document.getElementById("entry");
const exit = document.getElementById("exit");
const pnlAmount = document.getElementById("pnlAmount");
const notes = document.getElementById("notes");

let showAll = true;
let chart;
let currentTransactionType = null;
let chartTradeDetails = [];
let dateGroups = {};

// 全局交易数据存储
window.allTradesData = [];

// ============== 图片上传功能 ==============

// 存储交易图片的 Map
const tradeImages = new Map();

// 打开图片上传弹窗
function openImageUploadModal(tradeId, existingNotes = '') {
  const modal = document.createElement('div');
  modal.className = 'image-upload-modal';
  modal.innerHTML = `
    <div class="image-upload-modal-content">
      <div class="image-upload-modal-header">
        <h3>📷 Upload Chart Image</h3>
        <button class="image-upload-close">&times;</button>
      </div>
      <div class="image-upload-modal-body">
        <div class="image-preview-container" id="imagePreviewContainer_${tradeId}">
          ${getExistingImagePreview(tradeId)}
        </div>
        <div class="upload-area" id="uploadArea_${tradeId}">
          <div class="upload-icon">📊</div>
          <p>Click or drag & drop chart image here</p>
          <p class="upload-hint">PNG, JPG, GIF up to 5MB</p>
          <input type="file" id="imageInput_${tradeId}" accept="image/*" style="display: none;">
          <button class="upload-select-btn">Select Image</button>
        </div>
        <div class="notes-input-container">
          <label class="notes-label">📝 Notes (optional)</label>
          <textarea id="notesInput_${tradeId}" class="notes-textarea" placeholder="Add your trading notes here...">${existingNotes}</textarea>
        </div>
      </div>
      <div class="image-upload-modal-footer">
        <button class="image-upload-cancel">Cancel</button>
        <button class="image-upload-save">Save Image & Notes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  addImageUploadStyles();
  
  const closeBtn = modal.querySelector('.image-upload-close');
  const cancelBtn = modal.querySelector('.image-upload-cancel');
  const saveBtn = modal.querySelector('.image-upload-save');
  const uploadArea = modal.querySelector(`#uploadArea_${tradeId}`);
  const fileInput = modal.querySelector(`#imageInput_${tradeId}`);
  const selectBtn = modal.querySelector('.upload-select-btn');
  const previewContainer = modal.querySelector(`#imagePreviewContainer_${tradeId}`);
  const notesInput = modal.querySelector(`#notesInput_${tradeId}`);
  
  let selectedFile = null;
  
  setTimeout(() => modal.classList.add('show'), 10);
  
  function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
  
  if (uploadArea) {
    uploadArea.addEventListener('click', (e) => {
      if (e.target !== selectBtn) {
        fileInput.click();
      }
    });
  }
  
  if (selectBtn) {
    selectBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }
        selectedFile = file;
        displayPreview(file, previewContainer);
      }
    });
  }
  
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          alert('Image size must be less than 5MB');
          return;
        }
        selectedFile = file;
        displayPreview(file, previewContainer);
      }
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const notes = notesInput ? notesInput.value : '';
      
      if (notes && notes !== existingNotes) {
        await saveTradeNotes(tradeId, notes);
      }
      
      if (selectedFile) {
        await saveTradeImage(tradeId, selectedFile);
        closeModal();
        showNotification('Chart image and notes saved successfully!', 'success');
      } else if (tradeImages.has(tradeId)) {
        closeModal();
        showNotification('Notes saved successfully!', 'success');
      } else {
        alert('Please select an image first');
      }
    });
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function getExistingImagePreview(tradeId) {
  const existingImage = tradeImages.get(tradeId);
  if (existingImage) {
    return `
      <div class="existing-image">
        <img src="${existingImage}" alt="Chart image">
        <button class="remove-image-btn" onclick="event.stopPropagation(); removeTradeImage('${tradeId}')">✕</button>
      </div>
    `;
  }
  return '<div class="no-image">No chart image uploaded</div>';
}

function displayPreview(file, container) {
  const reader = new FileReader();
  reader.onload = (e) => {
    container.innerHTML = `
      <div class="image-preview">
        <img src="${e.target.result}" alt="Preview">
        <button class="remove-preview-btn" onclick="event.stopPropagation(); this.parentElement.remove();">✕</button>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

async function saveTradeImage(tradeId, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      tradeImages.set(tradeId, imageData);
      
      const allImages = JSON.parse(localStorage.getItem('trade_images') || '{}');
      allImages[tradeId] = imageData;
      localStorage.setItem('trade_images', JSON.stringify(allImages));
      
      updateImageButtonStyle(tradeId, true);
      resolve();
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function removeTradeImage(tradeId) {
  if (confirm('Remove this chart image?')) {
    tradeImages.delete(tradeId);
    
    const allImages = JSON.parse(localStorage.getItem('trade_images') || '{}');
    delete allImages[tradeId];
    localStorage.setItem('trade_images', JSON.stringify(allImages));
    
    updateImageButtonStyle(tradeId, false);
    showNotification('Chart image removed', 'info');
    
    const modal = document.querySelector('.image-upload-modal');
    if (modal) {
      const previewContainer = modal.querySelector(`#imagePreviewContainer_${tradeId}`);
      if (previewContainer) {
        previewContainer.innerHTML = '<div class="no-image">No chart image uploaded</div>';
      }
    }
  }
}

function updateImageButtonStyle(tradeId, hasImage) {
  const imageBtn = document.querySelector(`.image-btn[data-trade-id="${tradeId}"]`);
  if (imageBtn) {
    if (hasImage) {
      imageBtn.classList.add('has-image');
      imageBtn.innerHTML = '📷✓';
      imageBtn.title = 'View/Change Chart Image';
    } else {
      imageBtn.classList.remove('has-image');
      imageBtn.innerHTML = '📷';
      imageBtn.title = 'Upload Chart Image';
    }
  }
}

function updateAllImageButtons() {
  document.querySelectorAll('.image-btn').forEach(btn => {
    const tradeId = btn.dataset.tradeId;
    if (tradeId && tradeImages.has(tradeId)) {
      btn.classList.add('has-image');
      btn.innerHTML = '📷✓';
      btn.title = 'View/Change Chart Image';
    }
  });
}

async function viewTradeImage(tradeId) {
  const imageData = tradeImages.get(tradeId);
  const existingNotes = await getTradeNotes(tradeId);
  
  if (imageData) {
    const modal = document.createElement('div');
    modal.className = 'image-view-modal';
    modal.innerHTML = `
      <div class="image-view-modal-content">
        <div class="image-view-header">
          <h3>📷 Chart Image</h3>
          <button class="image-view-close">&times;</button>
        </div>
        <div class="image-view-body">
          <img src="${imageData}" alt="Trade chart">
          ${existingNotes ? `<div class="image-view-notes"><strong>📝 Notes:</strong><br>${existingNotes.replace(/\n/g, '<br>')}</div>` : ''}
        </div>
        <div class="image-view-footer">
          <button class="image-view-change">Change Image</button>
          <button class="image-view-delete">Delete Image</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    addImageViewStyles();
    
    setTimeout(() => modal.classList.add('show'), 10);
    
    const closeModal = () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.image-view-close').addEventListener('click', closeModal);
    modal.querySelector('.image-view-change').addEventListener('click', () => {
      closeModal();
      openImageUploadModal(tradeId, existingNotes);
    });
    modal.querySelector('.image-view-delete').addEventListener('click', () => {
      closeModal();
      removeTradeImage(tradeId);
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  } else {
    openImageUploadModal(tradeId, existingNotes);
  }
}

function loadSavedImages() {
  const saved = localStorage.getItem('trade_images');
  if (saved) {
    const images = JSON.parse(saved);
    Object.entries(images).forEach(([id, imageData]) => {
      tradeImages.set(id, imageData);
    });
  }
}

function addImageUploadStyles() {
  if (document.getElementById('image-upload-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'image-upload-styles';
  style.textContent = `
    .image-upload-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .image-upload-modal.show { opacity: 1; }
    
    .image-upload-modal-content {
      background: linear-gradient(145deg, #0f172a, #1e293b);
      border-radius: 20px;
      width: 90%;
      max-width: 500px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.3s ease;
    }
    
    .image-upload-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .image-upload-modal-header h3 { color: #3b82f6; margin: 0; }
    
    .image-upload-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.8rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    
    .image-upload-close:hover { color: #ef4444; }
    
    .image-upload-modal-body { padding: 1.5rem; }
    
    .image-preview-container { margin-bottom: 1.5rem; min-height: 150px; }
    
    .existing-image, .image-preview {
      position: relative;
      display: inline-block;
      width: 100%;
    }
    
    .existing-image img, .image-preview img {
      width: 100%;
      max-height: 200px;
      object-fit: contain;
      border-radius: 12px;
      background: #020617;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    
    .remove-image-btn, .remove-preview-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.9);
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    
    .remove-image-btn:hover, .remove-preview-btn:hover {
      background: #ef4444;
      transform: scale(1.1);
    }
    
    .no-image {
      text-align: center;
      padding: 2rem;
      color: #64748b;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      border: 1px dashed rgba(59, 130, 246, 0.3);
    }
    
    .upload-area {
      border: 2px dashed rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .upload-area.drag-over {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    
    .upload-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .upload-area p { color: #94a3b8; margin: 0.5rem 0; }
    .upload-hint { font-size: 0.8rem; color: #64748b; }
    
    .upload-select-btn {
      margin-top: 1rem;
      padding: 0.6rem 1.5rem;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .upload-select-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .image-upload-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .image-upload-cancel, .image-upload-save {
      padding: 0.7rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .image-upload-cancel {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #94a3b8;
    }
    
    .image-upload-cancel:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
    }
    
    .image-upload-save {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
    }
    
    .image-upload-save:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
    
    .notes-input-container {
      margin-top: 1.5rem;
    }
    
    .notes-label {
      display: block;
      color: #94a3b8;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    
    .notes-textarea {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 12px;
      color: #e2e8f0;
      font-size: 0.9rem;
      resize: vertical;
      min-height: 80px;
      font-family: 'Inter', sans-serif;
      transition: all 0.3s;
    }
    
    .notes-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      background: rgba(30, 41, 59, 1);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .notes-textarea::placeholder {
      color: #64748b;
    }
  `;
  document.head.appendChild(style);
}

function addImageViewStyles() {
  if (document.getElementById('image-view-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'image-view-styles';
  style.textContent = `
    .image-view-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .image-view-modal.show { opacity: 1; }
    
    .image-view-modal-content {
      background: linear-gradient(145deg, #0f172a, #1e293b);
      border-radius: 20px;
      width: 90%;
      max-width: 700px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }
    
    .image-view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .image-view-header h3 { color: #3b82f6; margin: 0; }
    
    .image-view-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.8rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    
    .image-view-close:hover { color: #ef4444; }
    
    .image-view-body { padding: 1.5rem; text-align: center; }
    
    .image-view-body img {
      max-width: 100%;
      max-height: 400px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }
    
    .image-view-notes {
      margin-top: 1rem;
      padding: 0.8rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      text-align: left;
      color: #94a3b8;
      font-size: 0.85rem;
      line-height: 1.5;
      border: 1px solid rgba(59, 130, 246, 0.15);
    }
    
    .image-view-notes strong {
      color: #3b82f6;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .image-view-footer {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .image-view-change, .image-view-delete {
      padding: 0.6rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .image-view-change {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      color: white;
    }
    
    .image-view-change:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
    
    .image-view-delete {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    
    .image-view-delete:hover { background: rgba(239, 68, 68, 0.3); }
  `;
  document.head.appendChild(style);
}

// ============== Session 存储功能 ==============

// 存储交易 Session 的 Map
const tradeSessions = new Map();

// 加载保存的 Session
function loadSavedSessions() {
  const saved = localStorage.getItem('trade_sessions');
  if (saved) {
    const sessions = JSON.parse(saved);
    Object.entries(sessions).forEach(([id, session]) => {
      tradeSessions.set(id, session);
    });
  }
}

// 保存 Session 到 localStorage
function saveTradeSession(tradeId, session) {
  tradeSessions.set(tradeId, session);
  const allSessions = JSON.parse(localStorage.getItem('trade_sessions') || '{}');
  allSessions[tradeId] = session;
  localStorage.setItem('trade_sessions', JSON.stringify(allSessions));
}

// 获取交易的 Session - 优先从 trade 对象读取
function getTradeSession(tradeOrId, tradeObject = null) {
  if (tradeObject && tradeObject.session) {
    return tradeObject.session;
  }
  if (typeof tradeOrId === 'string') {
    return tradeSessions.get(tradeOrId) || 'Asia';
  }
  if (tradeOrId && tradeOrId.session) {
    return tradeOrId.session;
  }
  return 'Asia';
}

// 更新交易的 Session
async function updateTradeSession(tradeId, session) {
  saveTradeSession(tradeId, session);
  showNotification(`Session changed to ${session}`, 'success');
}

// 批量加载 Session（渲染表格后调用）
function loadAllSessionsToSelects() {
  document.querySelectorAll('.session-select').forEach(select => {
    const tradeId = select.dataset.tradeId;
    if (tradeId && tradeSessions.has(tradeId)) {
      select.value = tradeSessions.get(tradeId);
    }
  });
}

// 保存交易备注到数据库
async function saveTradeNotes(tradeId, notes) {
  const session = await checkAuth();
  if (!session) return;
  
  try {
    const { error } = await client
      .from('trades')
      .update({ notes: notes })
      .eq('id', tradeId)
      .eq('user_id', session.user.id);
    
    if (error) throw error;
    console.log('Notes saved successfully');
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

// 获取交易备注
async function getTradeNotes(tradeId) {
  const session = await checkAuth();
  if (!session) return '';
  
  try {
    const { data, error } = await client
      .from('trades')
      .select('notes')
      .eq('id', tradeId)
      .single();
    
    if (error) throw error;
    return data?.notes || '';
  } catch (error) {
    console.error('Error fetching notes:', error);
    return '';
  }
}

// ============== 时间会话选择 ==============

let currentTimeSession = localStorage.getItem('timeSession') || 'Asia';

function setTimeSession(session) {
  currentTimeSession = session;
  localStorage.setItem('timeSession', session);
  if (window.fetchTrades) window.fetchTrades();
}

function getFormattedTimeWithSession(trade) {
  if (!trade.created_at) return '';
  
  const date = new Date(trade.created_at);
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  let displayHour = utcHours;
  
  switch(currentTimeSession) {
    case 'Asia':
      displayHour = utcHours + 8;
      if (displayHour >= 24) displayHour -= 24;
      break;
    case 'London':
      displayHour = utcHours;
      break;
    case 'NewYork':
      displayHour = utcHours - 5;
      if (displayHour < 0) displayHour += 24;
      break;
    default:
      displayHour = utcHours;
  }
  
  const hour24 = displayHour;
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  
  return `${hour12.toString().padStart(2, ' ')}:${utcMinutes.toString().padStart(2, '0')} ${ampm}`;
}

function addTimeSessionSelector() {
  return;
}

function addTimeSessionStyles() {
  if (document.getElementById('time-session-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'time-session-styles';
  style.textContent = `
    .time-session-selector {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(15, 23, 42, 0.6));
      padding: 0.4rem 1rem;
      border-radius: 30px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    
    .session-label {
      color: #94a3b8;
      font-size: 0.85rem;
      font-weight: 500;
    }
    
    .session-dropdown {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 20px;
      padding: 0.4rem 1rem;
      color: #e2e8f0;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .session-dropdown:hover {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.15);
    }
    
    .session-dropdown:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    
    .session-dropdown option {
      background: #0f172a;
      color: #e2e8f0;
    }
    
    @media (max-width: 768px) {
      .time-session-selector { margin-top: 0.8rem; }
    }
  `;
  document.head.appendChild(style);
}

// ============== 性能优化函数 ==============

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============== 风险回报比计算函数 ==============

function calculateRiskReward(trade) {
  const entry = parseFloat(trade.entry || 0);
  const exit = parseFloat(trade.exit || 0);
  const sl = parseFloat(trade.sl || 0);
  const pnl = parseFloat(trade.pnl_amount || 0);
  const direction = trade.direction;
  
  if (!entry || entry === 0) return "N/A";
  
  const isProfit = pnl > 0;
  
  if (!exit || exit === 0) {
    if (pnl !== 0) {
      let calculatedExit = entry;
      if (direction === "Buy") {
        calculatedExit = isProfit ? entry + pnl : entry - Math.abs(pnl);
      } else if (direction === "Sell") {
        calculatedExit = isProfit ? entry - pnl : entry + Math.abs(pnl);
      }
      return calculateRRFromPrices(entry, calculatedExit, sl, direction, isProfit);
    }
    return "N/A";
  }
  
  return calculateRRFromPrices(entry, exit, sl, direction, isProfit);
}

function calculateRRFromPrices(entry, exit, sl, direction, isProfit) {
  let risk = 0;
  
  if (sl && sl !== 0) {
    if (direction === "Buy") {
      risk = Math.abs(entry - sl);
    } else if (direction === "Sell") {
      risk = Math.abs(sl - entry);
    }
  } else {
    if (!isProfit) {
      if (direction === "Buy") {
        risk = Math.abs(exit - entry);
      } else if (direction === "Sell") {
        risk = Math.abs(entry - exit);
      }
    } else {
      if (direction === "Buy") {
        risk = Math.abs(exit - entry) * 0.5;
      } else if (direction === "Sell") {
        risk = Math.abs(entry - exit) * 0.5;
      }
    }
  }
  
  let reward = 0;
  if (direction === "Buy") {
    reward = Math.abs(exit - entry);
  } else if (direction === "Sell") {
    reward = Math.abs(entry - exit);
  }
  
  if (risk > 0) {
    const rrRatio = reward / risk;
    if (!isProfit) {
      if (Math.abs(rrRatio - 1) < 0.05) return "-1R";
      else if (rrRatio < 1) return `-${rrRatio.toFixed(1)}R`;
      else return `-${rrRatio.toFixed(1)}R`;
    }
    if (rrRatio >= 100) return rrRatio.toFixed(0);
    else if (rrRatio >= 10) return rrRatio.toFixed(1);
    else return rrRatio.toFixed(2);
  } else if (risk === 0) {
    return isProfit ? "∞" : "N/A";
  } else if (reward === 0) {
    return "0";
  }
  
  return "N/A";
}

function getRRGradientColor(rrValue) {
  if (rrValue.includes('-') || rrValue.includes('R')) {
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }
  
  const rrNum = parseFloat(rrValue);
  
  if (rrNum <= 0) return 'linear-gradient(135deg, #ef4444, #dc2626)';
  else if (rrNum < 0.5) return 'linear-gradient(135deg, #ef4444, #f97316)';
  else if (rrNum < 1) return 'linear-gradient(135deg, #f97316, #eab308)';
  else if (rrNum < 1.5) return 'linear-gradient(135deg, #eab308, #22c55e)';
  else if (rrNum < 2) return 'linear-gradient(135deg, #22c55e, #0ea5e9)';
  else if (rrNum < 3) return 'linear-gradient(135deg, #0ea5e9, #06b6d4)';
  else if (rrNum < 5) return 'linear-gradient(135deg, #06b6d4, #8b5cf6)';
  else return 'linear-gradient(135deg, #8b5cf6, #ec4899)';
}

window.calculateRiskReward = calculateRiskReward;

// ============== 日期分组功能 ==============

function initDateGroups() {
  dateGroups = {};
}

function groupTradesByDate(trades) {
  if (!trades || trades.length === 0) return [];
  
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB - dateA;
  });
  
  const groups = {};
  sortedTrades.forEach(trade => {
    const dateKey = trade.date || trade.created_at?.split('T')[0] || '未知日期';
    
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: dateKey,
        trades: [],
        totalPnl: 0,
        totalLots: 0,
        tradeCount: 0,
        winCount: 0,
        depositAmount: 0,
        withdrawalAmount: 0,
        hasBuySell: false,
        hasBalanceTx: false
      };
    }
    
    groups[dateKey].trades.push(trade);
    groups[dateKey].tradeCount++;
    
    if (trade.direction === "Buy" || trade.direction === "Sell") {
      const pnl = parseFloat(trade.pnl_amount || 0);
      groups[dateKey].totalPnl += pnl;
      groups[dateKey].totalLots += parseFloat(trade.lot_size || 0);
      if (pnl > 0) groups[dateKey].winCount++;
      groups[dateKey].hasBuySell = true;
      trade.riskReward = calculateRiskReward(trade);
    } else if (trade.direction === "Deposit") {
      groups[dateKey].depositAmount += parseFloat(trade.balance_change || 0);
      groups[dateKey].hasBalanceTx = true;
    } else if (trade.direction === "Withdrawal") {
      groups[dateKey].withdrawalAmount += parseFloat(trade.balance_change || 0);
      groups[dateKey].hasBalanceTx = true;
    }
  });
  
  const result = Object.values(groups).map(group => {
    group.isSingle = group.tradeCount === 1;
    group.hasOnlyBalanceTx = group.hasBalanceTx && !group.hasBuySell;
    group.isExpanded = true;
    return group;
  });
  
  return result;
}

function calculatePerformance(group) {
  const buySellTrades = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
  const totalBuySellTrades = buySellTrades.length;
  
  if (totalBuySellTrades === 0) {
    const lang = localStorage.getItem('language') || 'en';
    return {
      percentage: 0,
      progressBar: '<div class="solid-progress-bar" style="width: 0%;"></div>',
      label: group.hasBalanceTx ? (lang === 'zh' ? '仅资金操作' : 'Balance Only') : (lang === 'zh' ? '无交易' : 'No Trades'),
      winningTrades: 0,
      totalTrades: 0
    };
  }
  
  const winningTrades = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0).length;
  const winPercentage = (winningTrades / totalBuySellTrades) * 100;
  
  let color, label;
  const lang = localStorage.getItem('language') || 'en';
  
  if (winPercentage <= 30) {
    color = '#ef4444';
    label = lang === 'zh' ? '差' : 'Poor';
  } else if (winPercentage <= 50) {
    color = '#f97316';
    label = lang === 'zh' ? '普通' : 'Average';
  } else if (winPercentage <= 80) {
    color = '#eab308';
    label = lang === 'zh' ? '良好' : 'Good';
  } else {
    color = '#06b6d4';
    label = lang === 'zh' ? '极佳' : 'Excellent';
  }
  
  const progressBarHTML = createSolidProgressBar(winPercentage, color);
  
  return {
    percentage: winPercentage,
    progressBar: progressBarHTML,
    label: label,
    color: color,
    winningTrades: winningTrades,
    totalTrades: totalBuySellTrades
  };
}

function createSolidProgressBar(percentage, color) {
  const percentageText = `${percentage.toFixed(0)}%`;
  
  let gradientColor;
  if (percentage <= 30) gradientColor = 'linear-gradient(90deg, #ef4444, #dc2626)';
  else if (percentage <= 50) gradientColor = 'linear-gradient(90deg, #f97316, #ea580c)';
  else if (percentage <= 80) gradientColor = 'linear-gradient(90deg, #eab308, #ca8a04)';
  else gradientColor = 'linear-gradient(90deg, #06b6d4, #0891b2)';
  
  return `
    <div class="solid-progress-container" style="width: 100%; height: 20px; background: #374151; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); position: relative;">
      <div class="solid-progress-bar" style="width: ${percentage}%; background: ${gradientColor}; border-radius: 10px; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; position: relative; transition: width 0.5s ease; min-width: 20px;">
        <span class="progress-text" style="color: white; font-size: 0.7rem; font-weight: 600; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); position: relative;">${percentageText}</span>
      </div>
    </div>
  `;
}

function updateTableHeaders() {
  const collapsedHeader = document.getElementById('collapsedHeader');
  const expandedHeader = document.getElementById('expandedHeader');
  
  if (!collapsedHeader || !expandedHeader) return;
  
  collapsedHeader.style.display = 'none';
  expandedHeader.style.display = 'table-row';
  
  if (window.initLanguage) {
    setTimeout(() => window.initLanguage(), 10);
  }
}

function renderTable(groups) {
  console.log('渲染分组表格（全部展开），组数:', groups?.length);
  
  if (!groups || groups.length === 0) {
    tradeList.innerHTML = `
      <tr class="empty-state-row">
        <td colspan="10" style="text-align: center; padding: 1.2rem; color: #64748b; font-size: 0.85rem;">
          <span style="opacity: 0.6;">📊</span> No trades found
        </td>
      </tr>
    `;
    updateTableHeaders();
    return;
  }
  
  tradeList.innerHTML = '';
  
  const rows = showAll ? groups : groups.slice(0, 5);
  
  updateTableHeaders();
  
  rows.forEach(group => {
    const dateStr = group.date;
    
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    const totalTrades = group.tradeCount;
    
    const buySellTrades = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
    const winCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0).length;
    const lossCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) < 0).length;
    const breakEvenCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) === 0).length;
    
    let statsBadgeHtml = '';
    if (buySellTrades.length > 0) {
      statsBadgeHtml = `
        <div class="trade-stats-badge">
          <span class="stats-total">${buySellTrades.length}</span>
          <span class="stats-win">+${winCount}</span>
          <span class="stats-loss">-${lossCount}</span>
          ${breakEvenCount > 0 ? `<span class="stats-be">=${breakEvenCount}</span>` : ''}
        </div>
      `;
    } else if (group.hasBalanceTx) {
      statsBadgeHtml = `
        <div class="trade-stats-badge balance-only">
          <span class="stats-total">💰</span>
        </div>
      `;
    }
    
    const sortedTrades = [...group.trades].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeB - timeA;
    });
    
    const headerRow = document.createElement('tr');
    headerRow.className = `date-group-header expanded`;
    headerRow.dataset.date = dateStr;
    
    const buySellTradesForQuest = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
    const dailyPnl = group.totalPnl;
    
    let questStatus = '';
    let questStatusText = '';
    
    let startingBalance = 1000;
    
    if (group.startingBalance) {
      startingBalance = group.startingBalance;
    } else {
      startingBalance = 1000;
    }
    
    const profitTarget = startingBalance * 0.1;
    const lossLimit = startingBalance * 0.25;
    
    if (buySellTradesForQuest.length === 0) {
      questStatus = 'no-trades';
      questStatusText = 'No Trades';
    } else if (dailyPnl >= profitTarget) {
      questStatus = 'passed';
      questStatusText = 'Passed';
    } else if (dailyPnl <= -lossLimit) {
      questStatus = 'failed';
      questStatusText = 'Failed';
    } else {
      questStatus = 'patience';
      questStatusText = 'Patience';
    }
    
    headerRow.innerHTML = `
      <td colspan="10" style="padding: 0.3rem 0.5rem !important; background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid rgba(59, 130, 246, 0.15);">
        <div class="date-header" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;">
          <strong style="color: #3b82f6; font-size: 0.85rem; font-weight: 600;">${formattedDate}</strong>
          ${statsBadgeHtml}
          <div class="quest-status-badge ${questStatus}">
            <span class="quest-label">DQ:</span>
            <span class="quest-value">${questStatusText}</span>
          </div>
        </div>
      </td>
    `;
    
    tradeList.appendChild(headerRow);
    
    sortedTrades.forEach((t, index) => {
      const isBalanceTransaction = t.direction === "Deposit" || t.direction === "Withdrawal";
      const isBuySell = t.direction === "Buy" || t.direction === "Sell";
      
      let directionClass = "";
      let directionDisplay = t.direction;
      
      if (isBalanceTransaction) {
        const lang = localStorage.getItem('language') || 'en';
        if (lang === 'zh') {
          directionDisplay = t.direction === "Deposit" ? "入金" : "出金";
        }
        directionClass = t.direction === "Deposit" ? "balance-transaction deposit" : "balance-transaction withdrawal";
      } else if (isBuySell) {
        directionClass = t.direction === "Buy" ? "buy" : "sell";
      }
      
      let displayAmount = 0;
      let amountClass = "";
      let amountSign = "";
      
      if (isBalanceTransaction) {
        displayAmount = Math.abs(t.balance_change || 0);
        amountClass = t.direction === "Deposit" ? "pnl-positive" : "pnl-negative";
        amountSign = t.direction === "Deposit" ? "+" : "-";
      } else {
        displayAmount = t.pnl_amount || 0;
        amountClass = displayAmount >= 0 ? "pnl-positive" : "pnl-negative";
        amountSign = displayAmount >= 0 ? "+" : "";
      }
      
      let riskRewardHtml = "";
      if (isBuySell) {
        const rrValue = calculateRiskReward(t);
        
        if (rrValue === "N/A") {
          riskRewardHtml = '<span class="rr-value rr-na" style="display: inline-block !important; min-width: 70px !important;">N/A</span>';
        } else if (rrValue === "0") {
          riskRewardHtml = '<span class="rr-value rr-na" style="display: inline-block !important; min-width: 70px !important;">0</span>';
        } else if (rrValue === "∞") {
          riskRewardHtml = '<span class="rr-value" style="display: inline-block !important; min-width: 70px !important; background: linear-gradient(135deg, #ec4899, #db2777) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;">∞</span>';
        } else {
          const gradientColor = getRRGradientColor(rrValue);
          if (rrValue.includes('-') || rrValue.includes('R')) {
            riskRewardHtml = `<span class="rr-value" style="display: inline-block !important; min-width: 70px !important; background: ${gradientColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;">${rrValue}</span>`;
          } else {
            const displayValue = `1:${rrValue}`;
            riskRewardHtml = `<span class="rr-value" style="display: inline-block !important; min-width: 70px !important; background: ${gradientColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;">${displayValue}</span>`;
          }
        }
      } else {
        riskRewardHtml = '<span class="rr-value rr-na" style="display: inline-block !important; min-width: 70px !important;">-</span>';
      }
      
      const detailRow = document.createElement('tr');
      detailRow.className = `trade-detail-row visible`;
      detailRow.dataset.date = dateStr;
      
      detailRow.innerHTML = `
        <td style="color: #94a3b8; font-size: 0.9rem;">
          ${t.symbol || (isBalanceTransaction ? '' : '-')}
        </td>
        <td style="text-align: center;">
          <span class="session-text">${t.session || getTradeSession(t.id) || 'Asia'}</span>
        </td>
        <td><span class="${directionClass}">${directionDisplay}</span></td>
        <td>${isBuySell ? Number(t.lot_size||0).toFixed(2) : ''}</td>
        <td>${isBuySell ? (t.sl ? Number(t.sl||0).toFixed(2) : '-') : ''}</td>
        <td>${isBuySell ? (t.entry ? Number(t.entry||0).toFixed(2) : '-') : ''}</td>
        <td>${isBuySell ? (t.exit ? Number(t.exit||0).toFixed(2) : '-') : ''}</td>
        <td style="text-align: center; min-width: 90px;">${riskRewardHtml}</td>
        <td class="${amountClass}" style="color: ${displayAmount >= 0 ? '#0ee7ff' : '#ef4444'} !important;">${amountSign}$${Math.abs(displayAmount).toFixed(2)}</td>
        <td class="action-buttons-cell">
          <button class="action-btn image-btn" onclick="window.viewTradeImage('${t.id}')" data-trade-id="${t.id}" title="Upload Chart Image">
            ${tradeImages.has(t.id) ? '📷✓' : '📷'}
          </button>
          <button class="action-btn edit-btn-icon" onclick="window.showEditForm(${JSON.stringify(t).replace(/"/g, '&quot;')})" title="Edit Trade">
            ✏️
          </button>
          <button class="action-btn delete-btn-icon" onclick="window.deleteTrade('${t.id}')" title="Delete Trade">
            ✕
          </button>
        </td>
      `;
      
      tradeList.appendChild(detailRow);
    });
  });
  
  updateAllImageButtons();
  loadAllSessionsToSelects();
}

window.toggleDateGroup = function(date) {
  console.log('展开/收缩功能已禁用，所有交易保持展开状态');
};

// ---------------- 检查登录状态 ----------------
async function checkAuth() {
  const { data: { session }, error } = await client.auth.getSession();
  
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  
  return session;
}

// ---------------- 显示用户信息 ----------------
function displayUserInfo(session) {
  if (session && session.user) {
    userEmailEl.textContent = session.user.email;
    accountEmailEl.textContent = session.user.email;
  }
}

// ---------------- 登出功能 ----------------
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      alert('Logout failed: ' + error.message);
    } else {
      window.location.href = 'login.html';
    }
  });
}

// ---------------- Animate Stats ----------------
function animateStat(el, target, decimals = 2) {
  if (!el) return;
  
  let start = 0;
  const duration = 500;
  const startTime = performance.now();
  
  function update(time) {
    const progress = Math.min((time - startTime) / duration, 1);
    const value = start + (target - start) * progress;
    el.textContent = decimals === 0 ? Math.floor(value) : value.toFixed(decimals);
    if(progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ---------------- Initialize Chart ----------------
function initChart() {
  const ctx = document.getElementById("plChart").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, "rgba(62,180,137,0.5)");
  gradient.addColorStop(1, "rgba(0,0,0,0.1)");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Balance",
        data: [],
        borderColor: "#3eb489",
        backgroundColor: gradient,
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: [],
        pointBorderColor: "#000",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#3b82f6",
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeOutQuart" },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          displayColors: false,
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12, family: "'Inter', sans-serif" },
          callbacks: {
            title: function(tooltipItems) {
              return tooltipItems[0].label;
            },
            label: function(context) {
              const index = context.dataIndex;
              const balance = context.dataset.data[index];
              const tradeDetail = chartTradeDetails[index];
              
              if (!tradeDetail) {
                return [`Balance: $${balance.toFixed(2)}`, 'Pair: N/A', 'P&L: N/A'];
              }
              
              const { direction, symbol, pnl_amount, balance_change } = tradeDetail;
              const balanceLine = `Balance: $${balance.toFixed(2)}`;
              let pairLine = 'Pair: ';
              if (direction === 'Buy' || direction === 'Sell') pairLine += symbol || 'N/A';
              else if (direction === 'Deposit') pairLine += 'Deposit';
              else if (direction === 'Withdrawal') pairLine += 'Withdrawal';
              else pairLine += 'N/A';
              
              let pnlChange = 0;
              if (direction === 'Deposit' || direction === 'Withdrawal') pnlChange = balance_change || 0;
              else pnlChange = pnl_amount || 0;
              
              const pnlSign = pnlChange >= 0 ? '+' : '-';
              const pnlValue = Math.abs(pnlChange).toFixed(2);
              const pnlLine = `P&L: ${pnlSign}$${pnlValue}`;
              
              return [balanceLine, pairLine, pnlLine];
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#6ee7b7" }, title: { display: true, text: "Date", color: "#aaa" } },
        y: { grid: { display: false }, ticks: { color: "#6ee7b7", callback: v => `$${v}` }, title: { display: true, text: "Account Balance", color: "#aaa" } }
      }
    }
  });
}

// ============== Session 统计图表更新函数 ==============

// 更新右侧 Session 统计图表
function updateSessionStats() {
  if (!window.allTradesData || window.allTradesData.length === 0) {
    console.log('暂无交易数据');
    return;
  }
  
  const stats = {
    Asia: { wins: 0, losses: 0, total: 0 },
    London: { wins: 0, losses: 0, total: 0 },
    NewYork: { wins: 0, losses: 0, total: 0 }
  };
  
  window.allTradesData.forEach(trade => {
    if (trade.direction !== 'Buy' && trade.direction !== 'Sell') return;
    
    const session = trade.session || 'Asia';
    const pnl = parseFloat(trade.pnl_amount || 0);
    
    if (stats[session]) {
      stats[session].total++;
      if (pnl > 0) {
        stats[session].wins++;
      } else if (pnl < 0) {
        stats[session].losses++;
      }
    }
  });
  
  updateSessionCard('asia', stats.Asia);
  updateSessionCard('london', stats.London);
  updateSessionCard('ny', stats.NewYork);
}

function updateSessionCard(prefix, data) {
  const total = data.total;
  const wins = data.wins;
  const losses = data.losses;
  
  const totalEl = document.getElementById(`${prefix}TotalTrades`);
  if (totalEl) totalEl.textContent = `${total} trade${total !== 1 ? 's' : ''}`;
  
  const winCountEl = document.getElementById(`${prefix}WinCount`);
  const lossCountEl = document.getElementById(`${prefix}LossCount`);
  if (winCountEl) winCountEl.textContent = wins;
  if (lossCountEl) lossCountEl.textContent = losses;
  
  const maxCount = Math.max(wins, losses, 1);
  const winPercent = (wins / maxCount) * 100;
  const lossPercent = (losses / maxCount) * 100;
  
  const winBar = document.getElementById(`${prefix}WinBar`);
  const lossBar = document.getElementById(`${prefix}LossBar`);
  if (winBar) winBar.style.width = `${winPercent}%`;
  if (lossBar) lossBar.style.width = `${lossPercent}%`;
  
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 0;
  const winRateEl = document.getElementById(`${prefix}WinRate`);
  if (winRateEl) {
    winRateEl.textContent = `Win Rate: ${winRate}%`;
    if (winRate >= 60) {
      winRateEl.style.color = '#34d399';
    } else if (winRate >= 40) {
      winRateEl.style.color = '#fbbf24';
    } else if (winRate > 0) {
      winRateEl.style.color = '#f87171';
    } else {
      winRateEl.style.color = '#64748b';
    }
  }
}

// ---------------- Fetch Trades ----------------
async function fetchTrades() {
  const session = await checkAuth();
  if (!session) return;
  
  displayUserInfo(session);
  
  try {
    const { data, error } = await client
      .from("trades")
      .select("*")
      .eq("user_id", session.user.id)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching trades:", error);
      return;
    }
    
    console.log('获取到交易数据:', data?.length || 0, '条');
    
    window.allTradesData = data || [];
    
    const groupedData = groupTradesByDate(data);
    
    renderTable(groupedData);
    updateStats(groupedData.flatMap(g => g.trades));
    updateChart(data);
    updateTopBalance(data);
    
    addTimeSessionSelector();
    
    updateSessionStats();
    
  } catch (error) {
    console.error("获取交易数据异常:", error);
  }
}

// ---------------- 删除交易 ----------------
async function deleteTrade(tradeId) {
  const session = await checkAuth();
  if (!session) return;
  
  const lang = localStorage.getItem('language') || 'en';
  const confirmMsg = lang === 'zh' ? '确定要删除这笔交易吗？' : 'Are you sure you want to delete this trade?';
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const { error } = await client
      .from("trades")
      .delete()
      .eq("id", tradeId)
      .eq("user_id", session.user.id);
    
    if (error) throw error;
    
    const successMsg = lang === 'zh' ? '交易删除成功' : 'Trade deleted successfully';
    showNotification(successMsg, 'success');
    
    fetchTrades();
  } catch (error) {
    console.error('删除失败:', error);
    alert('删除失败: ' + error.message);
  }
}

// ---------------- Update Stats ----------------
function updateStats(data) {
  const tradesOnly = Array.isArray(data) ? data.filter(t => t.direction === "Buy" || t.direction === "Sell") : [];
  let total = tradesOnly.length, wins = 0, sum = 0, max = null, min = null;
  
  tradesOnly.forEach(t => {
    const pnl = Number(t.pnl_amount || 0);
    sum += pnl;
    if(pnl > 0) wins++;
    if (max === null || pnl > max) max = pnl;
    if (pnl < 0 && (min === null || pnl < min)) min = pnl;
  });
  
  animateStat(stats.total, total, 0);
  animateStat(stats.win, wins, 0);
  stats.rate.textContent = total ? ((wins/total)*100).toFixed(2)+'%' : "0%";
  animateStat(stats.avg, total ? sum/total : 0);
  animateStat(stats.max, max !== null ? max : 0);
  animateStat(stats.min, min !== null ? min : 0);
}

// ---------------- Update Chart ----------------
const updateChart = debounce(function(data) {
  if(!chart) initChart();
  
  const chartData = [...data].sort((a, b) => {
    const timeA = new Date(a.created_at || a.date || 0).getTime();
    const timeB = new Date(b.created_at || b.date || 0).getTime();
    return timeA - timeB;
  });
  
  let balance = 0;
  let labels = [];
  let values = [];
  let colors = [];
  chartTradeDetails = [];
  
  chartData.forEach((t, index) => {
    const change = t.balance_change !== undefined && t.balance_change !== 0 ? 
                   Number(t.balance_change) : Number(t.pnl_amount || 0);
    balance += change;

    let displayLabel = '';
    if (t.created_at) {
      const date = new Date(t.created_at);
      displayLabel = `${date.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else if (t.date) {
      displayLabel = t.date.replace(/-/g,'/');
    }
    
    labels.push(displayLabel);
    values.push(balance);
    
    chartTradeDetails.push({
      direction: t.direction,
      symbol: t.symbol,
      pnl_amount: t.pnl_amount,
      balance_change: t.balance_change,
      notes: t.notes,
      created_at: t.created_at,
      date: t.date
    });

    if(t.direction === "Withdrawal") colors.push("#ff4d4d");
    else if(t.direction === "Deposit") colors.push("#3eb489");
    else colors.push(change >= 0 ? "#3eb489" : "#ff4d4d");
  });

  chart.data.labels = labels;
  chart.data.datasets[0].data = values;
  chart.data.datasets[0].pointBackgroundColor = colors;
  chart.update();

  const initialBalance = values.length > 0 ? values[0] : 0;
  const currentPnl = values.length > 0 ? values[values.length - 1] - initialBalance : 0;
  initialBalanceEl.textContent = `$${initialBalance.toFixed(2)}`;
  currentPnlEl.textContent = `${currentPnl>=0?'+':''}$${currentPnl.toFixed(2)}`;
  currentPnlEl.className = currentPnl>=0 ? "pnl-positive" : "pnl-negative";
}, 300);

// ---------------- Update Top Balance ----------------
function updateTopBalance(data) {
  let balance = 0;
  data.forEach(t => {
    const change = t.balance_change !== undefined && t.balance_change !== 0 ? 
                   Number(t.balance_change) : Number(t.pnl_amount || 0);
    balance += change;
  });
  topBalanceEl.textContent = `$${balance.toFixed(2)}`;
}

// ---------------- Submit Trade ----------------
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    
    const session = await checkAuth();
    if (!session) return;
    
    if (!date.value) {
      alert('Please select a date');
      return;
    }
    
    if (!pnlAmount.value) {
      alert('Please enter P/L amount');
      return;
    }
    
    const sessionSelect = document.getElementById('sessionSelect');
    const selectedSession = sessionSelect ? sessionSelect.value : 'Asia';
    
    const payload = {
      date: date.value,
      symbol: symbol.value,
      direction: direction.value,
      session: selectedSession,
      lot_size: parseFloat(lotSize.value) || 0,
      sl: parseFloat(sl.value) || 0,
      entry: parseFloat(entry.value) || 0,
      exit: parseFloat(exit.value) || 0,
      pnl_amount: parseFloat(pnlAmount.value) || 0,
      balance_change: 0,
      notes: notes ? notes.value : '',
      user_id: session.user.id
    };
    
    const { error } = await client.from("trades").insert([payload]);
    if(error) {
      console.error("Error adding trade:", error);
      alert("Failed to add trade: " + error.message);
    } else { 
      form.reset(); 
      date.value = new Date().toISOString().split('T')[0];
      if (symbol) symbol.focus(); 
      showNotification('Trade added successfully!', 'success');
      fetchTrades(); 
    }
  });
}

// ============== 存款/取款模态框功能 ==============

function initBalanceModal() {
  const modal = document.getElementById('balanceModal');
  if (!modal) return;
  
  const closeBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelModal');
  const confirmBtn = document.getElementById('confirmModal');
  
  function closeModal() {
    modal.style.display = 'none';
    const modalDate = document.getElementById('modalDate');
    const modalAmount = document.getElementById('modalAmount');
    const modalNotes = document.getElementById('modalNotes');
    
    if (modalDate) modalDate.value = '';
    if (modalAmount) modalAmount.value = '';
    if (modalNotes) modalNotes.value = '';
    currentTransactionType = null;
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      await handleBalanceTransaction();
    });
  }
  
  const modalAmountInput = document.getElementById('modalAmount');
  if (modalAmountInput) {
    modalAmountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleBalanceTransaction();
    });
  }
}

function showBalanceModal(type) {
  const modal = document.getElementById('balanceModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  
  if (!modal || !modalTitle) return;
  
  currentTransactionType = type;
  
  const lang = localStorage.getItem('language') || 'en';
  if (lang === 'zh') {
    modalTitle.textContent = type === 'Deposit' ? '入金' : '出金';
  } else {
    modalTitle.textContent = type;
  }
  
  if (modalDate) modalDate.value = new Date().toISOString().split('T')[0];
  
  modal.className = 'modal-overlay ' + type.toLowerCase() + '-modal';
  modal.style.display = 'flex';
  
  setTimeout(() => {
    const amountInput = document.getElementById('modalAmount');
    if (amountInput) amountInput.focus();
  }, 100);
}

async function handleBalanceTransaction() {
  if (!currentTransactionType) return;
  
  const session = await checkAuth();
  if (!session) return;
  
  const modalDate = document.getElementById('modalDate');
  const modalAmount = document.getElementById('modalAmount');
  const modalNotes = document.getElementById('modalNotes');
  
  if (!modalDate || !modalAmount) return;
  
  const date = modalDate.value;
  const amount = parseFloat(modalAmount.value);
  const notes = modalNotes ? modalNotes.value : '';
  
  if (!date) {
    alert('Please select a date');
    return;
  }
  
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount');
    return;
  }
  
  const payload = {
    date: date,
    symbol: currentTransactionType,
    direction: currentTransactionType,
    lot_size: 0,
    entry: 0,
    exit: 0,
    pnl_amount: 0,
    balance_change: currentTransactionType === "Deposit" ? amount : -amount,
    notes: notes || '',
    user_id: session.user.id
  };
  
  try {
    const { error } = await client.from("trades").insert([payload]);
    
    if (error) throw error;
    
    document.getElementById('balanceModal').style.display = 'none';
    modalDate.value = '';
    modalAmount.value = '';
    if (modalNotes) modalNotes.value = '';
    
    const lang = localStorage.getItem('language') || 'en';
    const successMsg = lang === 'zh' 
      ? `${currentTransactionType === 'Deposit' ? '入金' : '出金'}成功！`
      : `${currentTransactionType} successful!`;
    showNotification(successMsg, 'success');
    
    fetchTrades();
    currentTransactionType = null;
    
  } catch (error) {
    console.error("Error adding transaction:", error);
    alert("Failed to add transaction: " + error.message);
  }
}

function updateBalanceButtons() {
  document.querySelectorAll(".balance-btn[data-type]").forEach(btn => {
    if (btn.dataset.type === 'Deposit' || btn.dataset.type === 'Withdrawal') {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showBalanceModal(newBtn.dataset.type);
      });
    }
  });
}

// ============== 编辑/删除功能 ==============

function showEditForm(trade) {
  if (!trade || !trade.id) return;
  
  const editId = document.getElementById('editId');
  const editDate = document.getElementById('editDate');
  const editSymbol = document.getElementById('editSymbol');
  const editDirection = document.getElementById('editDirection');
  const editSession = document.getElementById('editSession');
  const editLotSize = document.getElementById('editLotSize');
  const editEntry = document.getElementById('editEntry');
  const editExit = document.getElementById('editExit');
  const editPnlAmount = document.getElementById('editPnlAmount');
  const editNotes = document.getElementById('editNotes');
  
  if (!editId || !editDate) return;
  
  editId.value = trade.id;
  editDate.value = trade.date || '';
  if (editSymbol) editSymbol.value = trade.symbol || '';
  if (editDirection) editDirection.value = trade.direction || 'Buy';
  if (editSession) editSession.value = trade.session || getTradeSession(trade.id) || 'Asia';
  if (editLotSize) editLotSize.value = trade.lot_size || '';
  if (editEntry) editEntry.value = trade.entry || '';
  if (editExit) editExit.value = trade.exit || '';
  if (editPnlAmount) editPnlAmount.value = trade.pnl_amount || '';
  if (editNotes) editNotes.value = trade.notes || '';
  
  const editFormSection = document.getElementById('editFormSection');
  const formSection = document.getElementById('formSection');
  const tradeSection = document.getElementById('tradeSection');
  const chartSection = document.getElementById('chartSection');
  
  if (editFormSection) editFormSection.style.display = 'block';
  if (formSection) formSection.style.display = 'none';
  if (tradeSection) tradeSection.style.display = 'none';
  if (chartSection) chartSection.style.display = 'none';
}

function hideEditForm() {
  const editFormSection = document.getElementById('editFormSection');
  const formSection = document.getElementById('formSection');
  const tradeSection = document.getElementById('tradeSection');
  const chartSection = document.getElementById('chartSection');
  
  if (editFormSection) editFormSection.style.display = 'none';
  if (formSection) formSection.style.display = 'block';
  if (tradeSection) tradeSection.style.display = 'block';
  if (chartSection) chartSection.style.display = 'block';
}

const editTradeForm = document.getElementById('editTradeForm');
if (editTradeForm) {
  editTradeForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const session = await checkAuth();
    if (!session) return;
    
    const editId = document.getElementById('editId');
    const editDate = document.getElementById('editDate');
    const editSymbol = document.getElementById('editSymbol');
    const editDirection = document.getElementById('editDirection');
    const editSession = document.getElementById('editSession');
    const editLotSize = document.getElementById('editLotSize');
    const editEntry = document.getElementById('editEntry');
    const editExit = document.getElementById('editExit');
    const editPnlAmount = document.getElementById('editPnlAmount');
    const editNotes = document.getElementById('editNotes');
    
    if (!editId || !editDate) return;
    
    const payload = {
      date: editDate.value,
      symbol: editSymbol ? editSymbol.value : '',
      direction: editDirection ? editDirection.value : 'Buy',
      session: editSession ? editSession.value : 'Asia',
      lot_size: editLotSize ? parseFloat(editLotSize.value) || 0 : 0,
      entry: editEntry ? parseFloat(editEntry.value) || 0 : 0,
      exit: editExit ? parseFloat(editExit.value) || 0 : 0,
      pnl_amount: editPnlAmount ? parseFloat(editPnlAmount.value) || 0 : 0,
      notes: editNotes ? editNotes.value : '',
      user_id: session.user.id
    };
    
    const tradeId = editId.value;
    
    try {
      const { error } = await client
        .from('trades')
        .update(payload)
        .eq('id', tradeId)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      const lang = localStorage.getItem('language') || 'en';
      const successMsg = lang === 'zh' ? '交易更新成功' : 'Trade updated successfully';
      showNotification(successMsg, 'success');
      
      hideEditForm();
      fetchTrades();
    } catch (error) {
      console.error('更新失败:', error);
      alert('更新失败: ' + error.message);
    }
  });
}

const deleteTradeBtn = document.getElementById('deleteTradeBtn');
if (deleteTradeBtn) {
  deleteTradeBtn.addEventListener('click', async function() {
    const editId = document.getElementById('editId');
    if (!editId) return;
    
    const tradeId = editId.value;
    const lang = localStorage.getItem('language') || 'en';
    const confirmMsg = lang === 'zh' ? '确定要删除这笔交易吗？' : 'Are you sure you want to delete this trade?';
    
    if (!confirm(confirmMsg)) return;
    
    const session = await checkAuth();
    if (!session) return;
    
    try {
      const { error } = await client
        .from('trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      const successMsg = lang === 'zh' ? '交易删除成功' : 'Trade deleted successfully';
      showNotification(successMsg, 'success');
      
      hideEditForm();
      fetchTrades();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败: ' + error.message);
    }
  });
}

const cancelEditBtn = document.getElementById('cancelEditBtn');
if (cancelEditBtn) {
  cancelEditBtn.addEventListener('click', hideEditForm);
}

// ---------------- Toggle last 3 trades ----------------
if (toggleBtn) {
  toggleBtn.onclick = () => {
    showAll = !showAll;
    
    const lang = localStorage.getItem('language') || 'en';
    toggleBtn.textContent = showAll ? 
      (lang === 'zh' ? '隐藏' : 'Hide') : 
      (lang === 'zh' ? '显示全部' : 'Show All');
      
    fetchTrades();
  };
}

// ---------------- Set default date to today ----------------
if (date) {
  date.value = new Date().toISOString().split('T')[0];
}

// ============== 通知功能 ==============

function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification-toast');
  if (existingNotification) existingNotification.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">&times;</button>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
  
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    });
  }
}

// ============== 粒子背景效果 ==============

function createParticles() {
  const container = document.getElementById('floating-particles');
  if (!container) return;
  
  container.innerHTML = '';
  
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * 10}s`;
    particle.style.animationDuration = `${10 + Math.random() * 15}s`;
    container.appendChild(particle);
  }
}

function addCardGlowEffect() {
  const statCards = document.querySelectorAll('.stat-card');
  
  statCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    });
  });
}

// ============== 全局函数暴露 ==============

window.showEditForm = showEditForm;
window.hideEditForm = hideEditForm;
window.deleteTrade = deleteTrade;
window.fetchTrades = fetchTrades;
window.showBalanceModal = showBalanceModal;
window.viewTradeImage = viewTradeImage;
window.removeTradeImage = removeTradeImage;
window.updateTradeSession = updateTradeSession;
window.getTradeSession = getTradeSession;
window.saveTradeNotes = saveTradeNotes;
window.getTradeNotes = getTradeNotes;

// ---------------- Initial Load ----------------
async function initApp() {
  const session = await checkAuth();
  if (session) {
    displayUserInfo(session);
    initChart();
    initDateGroups();
    loadSavedImages();
    loadSavedSessions();
    fetchTrades();
    
    setTimeout(() => {
      createParticles();
      addCardGlowEffect();
    }, 1000);
    
    initBalanceModal();
    updateBalanceButtons();
    
    if (window.initLanguage) window.initLanguage();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}