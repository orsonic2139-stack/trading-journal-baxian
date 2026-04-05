// script.js - 完整版

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
let radarChart;
let currentTransactionType = null;
let chartTradeDetails = [];
let dateGroups = {};

window.allTradesData = [];

// ============== 图片上传功能 ==============
const tradeImages = new Map();

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
const tradeSessions = new Map();

function loadSavedSessions() {
  const saved = localStorage.getItem('trade_sessions');
  if (saved) {
    const sessions = JSON.parse(saved);
    Object.entries(sessions).forEach(([id, session]) => {
      tradeSessions.set(id, session);
    });
  }
}

function saveTradeSession(tradeId, session) {
  tradeSessions.set(tradeId, session);
  const allSessions = JSON.parse(localStorage.getItem('trade_sessions') || '{}');
  allSessions[tradeId] = session;
  localStorage.setItem('trade_sessions', JSON.stringify(allSessions));
}

function getTradeSession(tradeOrId, tradeObject = null) {
  if (tradeObject && tradeObject.session) return tradeObject.session;
  if (typeof tradeOrId === 'string') return tradeSessions.get(tradeOrId) || 'Asia';
  if (tradeOrId && tradeOrId.session) return tradeOrId.session;
  return 'Asia';
}

async function updateTradeSession(tradeId, session) {
  saveTradeSession(tradeId, session);
  showNotification(`Session changed to ${session}`, 'success');
}

function loadAllSessionsToSelects() {
  document.querySelectorAll('.session-select').forEach(select => {
    const tradeId = select.dataset.tradeId;
    if (tradeId && tradeSessions.has(tradeId)) {
      select.value = tradeSessions.get(tradeId);
    }
  });
}

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
  } catch (error) {
    console.error('Error saving notes:', error);
  }
}

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
    case 'Asia': displayHour = utcHours + 8; if (displayHour >= 24) displayHour -= 24; break;
    case 'London': displayHour = utcHours; break;
    case 'NewYork': displayHour = utcHours - 5; if (displayHour < 0) displayHour += 24; break;
    default: displayHour = utcHours;
  }
  
  const hour24 = displayHour;
  const hour12 = hour24 % 12 || 12;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  
  return `${hour12.toString().padStart(2, ' ')}:${utcMinutes.toString().padStart(2, '0')} ${ampm}`;
}

function addTimeSessionSelector() { return; }
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
      if (direction === "Buy") calculatedExit = isProfit ? entry + pnl : entry - Math.abs(pnl);
      else if (direction === "Sell") calculatedExit = isProfit ? entry - pnl : entry + Math.abs(pnl);
      return calculateRRFromPrices(entry, calculatedExit, sl, direction, isProfit);
    }
    return "N/A";
  }
  
  return calculateRRFromPrices(entry, exit, sl, direction, isProfit);
}

function calculateRRFromPrices(entry, exit, sl, direction, isProfit) {
  let risk = 0;
  
  if (sl && sl !== 0) {
    if (direction === "Buy") risk = Math.abs(entry - sl);
    else if (direction === "Sell") risk = Math.abs(sl - entry);
  } else {
    if (!isProfit) {
      if (direction === "Buy") risk = Math.abs(exit - entry);
      else if (direction === "Sell") risk = Math.abs(entry - exit);
    } else {
      if (direction === "Buy") risk = Math.abs(exit - entry) * 0.5;
      else if (direction === "Sell") risk = Math.abs(entry - exit) * 0.5;
    }
  }
  
  let reward = 0;
  if (direction === "Buy") reward = Math.abs(exit - entry);
  else if (direction === "Sell") reward = Math.abs(entry - exit);
  
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
  } else if (risk === 0) return isProfit ? "∞" : "N/A";
  else if (reward === 0) return "0";
  
  return "N/A";
}

function getRRGradientColor(rrValue) {
  if (rrValue.includes('-') || rrValue.includes('R')) return 'linear-gradient(135deg, #ef4444, #dc2626)';
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
function initDateGroups() { dateGroups = {}; }

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
  
  if (winPercentage <= 30) { color = '#ef4444'; label = lang === 'zh' ? '差' : 'Poor'; }
  else if (winPercentage <= 50) { color = '#f97316'; label = lang === 'zh' ? '普通' : 'Average'; }
  else if (winPercentage <= 80) { color = '#eab308'; label = lang === 'zh' ? '良好' : 'Good'; }
  else { color = '#06b6d4'; label = lang === 'zh' ? '极佳' : 'Excellent'; }
  
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
}

function renderTable(groups) {
  if (!groups || groups.length === 0) {
    tradeList.innerHTML = `<tr class="empty-state-row"><td colspan="10" style="text-align: center; padding: 1.2rem; color: #64748b; font-size: 0.85rem;"><span style="opacity: 0.6;">📊</span> No trades found</td></tr>`;
    updateTableHeaders();
    return;
  }
  
  tradeList.innerHTML = '';
  const rows = showAll ? groups : groups.slice(0, 5);
  updateTableHeaders();
  
  rows.forEach(group => {
    const dateStr = group.date;
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');
    
    const buySellTrades = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
    const winCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0).length;
    const lossCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) < 0).length;
    const breakEvenCount = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) === 0).length;
    
    let statsBadgeHtml = '';
    if (buySellTrades.length > 0) {
      statsBadgeHtml = `<div class="trade-stats-badge"><span class="stats-total">${buySellTrades.length}</span><span class="stats-win">+${winCount}</span><span class="stats-loss">-${lossCount}</span>${breakEvenCount > 0 ? `<span class="stats-be">=${breakEvenCount}</span>` : ''}</div>`;
    } else if (group.hasBalanceTx) {
      statsBadgeHtml = `<div class="trade-stats-badge balance-only"><span class="stats-total">💰</span></div>`;
    }
    
    const sortedTrades = [...group.trades].sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());
    
    const headerRow = document.createElement('tr');
    headerRow.className = `date-group-header expanded`;
    headerRow.dataset.date = dateStr;
    
    const buySellTradesForQuest = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
    const dailyPnl = group.totalPnl;
    let questStatus = '', questStatusText = '';
    let startingBalance = group.startingBalance || 1000;
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
    
    headerRow.innerHTML = `<td colspan="10" style="padding: 0.3rem 0.5rem !important; background: rgba(15, 23, 42, 0.6); border-bottom: 1px solid rgba(59, 130, 246, 0.15);"><div class="date-header" style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; width: 100%;"><strong style="color: #3b82f6; font-size: 0.85rem; font-weight: 600;">${formattedDate}</strong>${statsBadgeHtml}<div class="quest-status-badge ${questStatus}"><span class="quest-label">DQ:</span><span class="quest-value">${questStatusText}</span></div></div></td>`;
    tradeList.appendChild(headerRow);
    
    sortedTrades.forEach((t) => {
      const isBalanceTransaction = t.direction === "Deposit" || t.direction === "Withdrawal";
      const isBuySell = t.direction === "Buy" || t.direction === "Sell";
      
      let directionClass = "";
      let directionDisplay = t.direction;
      
      if (isBalanceTransaction) {
        const lang = localStorage.getItem('language') || 'en';
        directionDisplay = t.direction === "Deposit" ? (lang === 'zh' ? "入金" : "Deposit") : (lang === 'zh' ? "出金" : "Withdrawal");
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
        if (rrValue === "N/A" || rrValue === "0") {
          riskRewardHtml = '<span class="rr-value rr-na">N/A</span>';
        } else if (rrValue === "∞") {
          riskRewardHtml = '<span class="rr-value" style="background: linear-gradient(135deg, #ec4899, #db2777) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;">∞</span>';
        } else {
          const gradientColor = getRRGradientColor(rrValue);
          if (rrValue.includes('-') || rrValue.includes('R')) {
            riskRewardHtml = `<span class="rr-value" style="background: ${gradientColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;">${rrValue}</span>`;
          } else {
            riskRewardHtml = `<span class="rr-value" style="background: ${gradientColor} !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;">1:${rrValue}</span>`;
          }
        }
      } else {
        riskRewardHtml = '<span class="rr-value rr-na">-</span>';
      }
      
      const detailRow = document.createElement('tr');
      detailRow.className = `trade-detail-row visible`;
      detailRow.dataset.date = dateStr;
      
      detailRow.innerHTML = `
        <td style="color: #94a3b8; font-size: 0.9rem;">${t.symbol || (isBalanceTransaction ? '' : '-')}</td>
        <td style="text-align: center;"><span class="session-text">${t.session || getTradeSession(t.id) || 'Asia'}</span></td>
        <td><span class="${directionClass}">${directionDisplay}</span></td>
        <td>${isBuySell ? Number(t.lot_size||0).toFixed(2) : ''}</td>
        <td>${isBuySell ? (t.sl ? Number(t.sl||0).toFixed(2) : '-') : ''}</td>
        <td>${isBuySell ? (t.entry ? Number(t.entry||0).toFixed(2) : '-') : ''}</td>
        <td>${isBuySell ? (t.exit ? Number(t.exit||0).toFixed(2) : '-') : ''}</td>
        <td style="text-align: center; min-width: 90px;">${riskRewardHtml}</td>
        <td class="${amountClass}" style="color: ${displayAmount >= 0 ? '#0ee7ff' : '#ef4444'} !important;">${amountSign}$${Math.abs(displayAmount).toFixed(2)}</td>
        <td class="action-buttons-cell">
          <button class="action-btn image-btn" onclick="window.viewTradeImage('${t.id}')" data-trade-id="${t.id}" title="Upload Chart Image">${tradeImages.has(t.id) ? '📷✓' : '📷'}</button>
          <button class="action-btn edit-btn-icon" onclick="window.showEditForm(${JSON.stringify(t).replace(/"/g, '&quot;')})" title="Edit Trade">✏️</button>
          <button class="action-btn delete-btn-icon" onclick="window.deleteTrade('${t.id}')" title="Delete Trade">✕</button>
        </td>
      `;
      tradeList.appendChild(detailRow);
    });
  });
  
  updateAllImageButtons();
  loadAllSessionsToSelects();
}

window.toggleDateGroup = function(date) {};

// ---------------- 检查登录状态 ----------------
async function checkAuth() {
  const { data: { session }, error } = await client.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  return session;
}

function displayUserInfo(session) {
  if (session && session.user) {
    userEmailEl.textContent = session.user.email;
    accountEmailEl.textContent = session.user.email;
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    const { error } = await client.auth.signOut();
    if (error) { console.error('Logout error:', error); alert('Logout failed: ' + error.message); }
    else { window.location.href = 'login.html'; }
  });
}

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
    data: { labels: [], datasets: [{ label: "Balance", data: [], borderColor: "#3eb489", backgroundColor: gradient, fill: true, tension: 0.35, pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: [], pointBorderColor: "#000", pointHoverBackgroundColor: "#fff", pointHoverBorderColor: "#3b82f6", pointHoverBorderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1000, easing: "easeOutQuart" },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true, mode: 'nearest', intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#e2e8f0', bodyColor: '#94a3b8',
          borderColor: 'rgba(59, 130, 246, 0.3)', borderWidth: 1, cornerRadius: 8, padding: 12, displayColors: false,
          titleFont: { size: 13, weight: '600' }, bodyFont: { size: 12, family: "'Inter', sans-serif" },
          callbacks: {
            title: (tooltipItems) => tooltipItems[0].label,
            label: (context) => {
              const index = context.dataIndex;
              const balance = context.dataset.data[index];
              const tradeDetail = chartTradeDetails[index];
              if (!tradeDetail) return [`Balance: $${balance.toFixed(2)}`, 'Pair: N/A', 'P&L: N/A'];
              const { direction, symbol, pnl_amount, balance_change } = tradeDetail;
              let pairLine = 'Pair: ';
              if (direction === 'Buy' || direction === 'Sell') pairLine += symbol || 'N/A';
              else if (direction === 'Deposit') pairLine += 'Deposit';
              else if (direction === 'Withdrawal') pairLine += 'Withdrawal';
              else pairLine += 'N/A';
              let pnlChange = (direction === 'Deposit' || direction === 'Withdrawal') ? (balance_change || 0) : (pnl_amount || 0);
              const pnlSign = pnlChange >= 0 ? '+' : '-';
              const pnlValue = Math.abs(pnlChange).toFixed(2);
              return [`Balance: $${balance.toFixed(2)}`, pairLine, `P&L: ${pnlSign}$${pnlValue}`];
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
function updateSessionStats() {
  if (!window.allTradesData || window.allTradesData.length === 0) return;
  
  const stats = { Asia: { wins: 0, losses: 0, total: 0 }, London: { wins: 0, losses: 0, total: 0 }, NewYork: { wins: 0, losses: 0, total: 0 } };
  
  window.allTradesData.forEach(trade => {
    if (trade.direction !== 'Buy' && trade.direction !== 'Sell') return;
    const session = trade.session || 'Asia';
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (stats[session]) {
      stats[session].total++;
      if (pnl > 0) stats[session].wins++;
      else if (pnl < 0) stats[session].losses++;
    }
  });
  
  updateSessionCard('asia', stats.Asia);
  updateSessionCard('london', stats.London);
  updateSessionCard('ny', stats.NewYork);
}

function updateSessionCard(prefix, data) {
  const total = data.total, wins = data.wins, losses = data.losses;
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
    if (winRate >= 60) winRateEl.style.color = '#34d399';
    else if (winRate >= 40) winRateEl.style.color = '#fbbf24';
    else if (winRate > 0) winRateEl.style.color = '#f87171';
    else winRateEl.style.color = '#64748b';
  }
}

// ============== 综合评分计算函数 ==============
function calculateOverallScore(statsData) {
  let score = 0;
  
  let winRateScore = (statsData.winRate / 100) * 35;
  score += winRateScore;
  
  let avgPnlScore = Math.min(20, (Math.abs(statsData.avgPnl) / 200) * 20);
  if (statsData.avgPnl < 0) avgPnlScore = avgPnlScore * 0.3;
  score += avgPnlScore;
  
  let maxPnlScore = Math.min(15, (statsData.maxPnl / 500) * 15);
  score += maxPnlScore;
  
  let minPnlScore = 0;
  if (statsData.minPnl < 0) {
    minPnlScore = Math.max(0, 15 - (Math.abs(statsData.minPnl) / 100) * 15);
  } else {
    minPnlScore = 15;
  }
  score += minPnlScore;
  
  let totalTradesScore = Math.min(10, (statsData.total / 20) * 10);
  score += totalTradesScore;
  
  let winCountScore = (statsData.winCount / Math.max(1, statsData.total)) * 5;
  score += winCountScore;
  
  return Math.min(100, Math.max(0, Math.floor(score)));
}

// ============== 等级判定函数 ==============
function getRankByScore(score) {
  if (score <= 20) return { name: 'Apprentice', icon: '🌱', nextNeeded: 21 - score };
  if (score <= 40) return { name: 'Learner', icon: '📘', nextNeeded: 41 - score };
  if (score <= 60) return { name: 'Trader', icon: '📈', nextNeeded: 61 - score };
  if (score <= 75) return { name: 'Sniper', icon: '🎯', nextNeeded: 76 - score };
  if (score <= 88) return { name: 'Elite Trader', icon: '💎', nextNeeded: 89 - score };
  return { name: 'Market Wizard', icon: '👑', nextNeeded: 0 };
}

// ============== 连胜天数计算函数 ==============
function calculateWinningStreak(trades) {
  if (!trades || trades.length === 0) return 0;
  
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  if (buySellTrades.length === 0) return 0;
  
  const dailyPnL = {};
  buySellTrades.forEach(trade => {
    const date = trade.date;
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (!dailyPnL[date]) dailyPnL[date] = 0;
    dailyPnL[date] += pnl;
  });
  
  const datesWithTrades = Object.keys(dailyPnL).sort().reverse();
  if (datesWithTrades.length === 0) return 0;
  
  let streak = 0;
  for (const date of datesWithTrades) {
    if (dailyPnL[date] > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// ============== 更新Ranking System UI ==============
function updateRankingSystem(statsData, allTrades) {
  const overallScore = calculateOverallScore(statsData);
  const scorePercent = (overallScore / 100) * 100;
  
  const overallScoreEl = document.getElementById('overallScore');
  const scoreProgressEl = document.getElementById('scoreProgress');
  const scoreStatusEl = document.getElementById('scoreStatus');
  
  if (overallScoreEl) overallScoreEl.textContent = overallScore;
  if (scoreProgressEl) scoreProgressEl.style.width = `${scorePercent}%`;
  
  if (scoreStatusEl) {
    if (overallScore >= 85) scoreStatusEl.textContent = '🏆 Excellent';
    else if (overallScore >= 70) scoreStatusEl.textContent = '✨ Great';
    else if (overallScore >= 55) scoreStatusEl.textContent = '📈 Good';
    else if (overallScore >= 40) scoreStatusEl.textContent = '🌱 Improving';
    else scoreStatusEl.textContent = '💪 Keep Going';
  }
  
  const rank = getRankByScore(overallScore);
const levelIcon3d = document.getElementById('levelIcon3d');
const currentLevelEl = document.getElementById('currentLevel');
const nextLevelNeededEl = document.getElementById('nextLevelNeeded');
const rankSvg = document.getElementById('rankSvg');

// 更新等级名称
if (currentLevelEl) currentLevelEl.textContent = rank.name;

// 更新下一级所需分数
if (nextLevelNeededEl) {
  if (rank.nextNeeded > 0) {
    nextLevelNeededEl.textContent = `${rank.nextNeeded} pts`;
  } else {
    nextLevelNeededEl.textContent = 'Max Level';
  }
}

// 更新3D徽章样式和SVG
if (levelIcon3d) {
  // 获取等级对应的data-rank值
  let rankKey = 'apprentice';
  if (rank.name === 'Apprentice') rankKey = 'apprentice';
  else if (rank.name === 'Learner') rankKey = 'learner';
  else if (rank.name === 'Trader') rankKey = 'trader';
  else if (rank.name === 'Sniper') rankKey = 'sniper';
  else if (rank.name === 'Elite Trader') rankKey = 'elite';
  else if (rank.name === 'Market Wizard') rankKey = 'wizard';
  
  levelIcon3d.setAttribute('data-rank', rankKey);
  
  // 根据等级更新SVG图标
  if (rankSvg) {
    updateRankSvg(rankSvg, rankKey);
  }
}
  
  const winningStreak = calculateWinningStreak(allTrades);
  const streakValueEl = document.getElementById('winningStreak');
  if (streakValueEl) streakValueEl.textContent = winningStreak;
}

// ============== 纪律评分计算函数 ==============
function calculateDisciplineScore(trades) {
  // 只统计真实交易（Buy/Sell）
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  
  if (buySellTrades.length === 0) {
    return { score: 0, details: { stopLossUsage: 0, consistency: 0, riskManagement: 0, tradeFrequency: 0 } };
  }
  
  // 1. 止损使用率 (40分) - 是否设置了止损
  let stopLossUsage = 0;
  let tradesWithSL = 0;
  buySellTrades.forEach(trade => {
    const sl = parseFloat(trade.sl || 0);
    if (sl && sl !== 0) {
      tradesWithSL++;
    }
  });
  stopLossUsage = (tradesWithSL / buySellTrades.length) * 40;
  
  // 2. 交易一致性 (25分) - 每日交易次数是否稳定，避免过度交易
  let consistencyScore = 25;
  const dailyTradeCount = {};
  buySellTrades.forEach(trade => {
    const date = trade.date;
    if (!dailyTradeCount[date]) dailyTradeCount[date] = 0;
    dailyTradeCount[date]++;
  });
  
  const dailyCounts = Object.values(dailyTradeCount);
  if (dailyCounts.length > 1) {
    const avgTrades = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
    const variance = dailyCounts.reduce((acc, val) => acc + Math.pow(val - avgTrades, 2), 0) / dailyCounts.length;
    const stdDev = Math.sqrt(variance);
    // 标准差越小，一致性越高
    const consistencyFactor = Math.max(0, Math.min(1, 1 - (stdDev / avgTrades)));
    consistencyScore = 15 + (consistencyFactor * 10); // 15-25分
  }
  
  // 3. 风险管理 (20分) - 单笔亏损是否控制在合理范围
  let riskScore = 20;
  let totalLosses = 0;
  let lossCount = 0;
  let largeLosses = 0; // 亏损超过平均亏损2倍的交易
  
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl < 0) {
      totalLosses += Math.abs(pnl);
      lossCount++;
    }
  });
  
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl < 0 && avgLoss > 0) {
      if (Math.abs(pnl) > avgLoss * 2) {
        largeLosses++;
      }
    }
  });
  
  if (largeLosses > 0) {
    riskScore = Math.max(5, 20 - (largeLosses * 5));
  }
  
  // 4. 交易频率 (15分) - 每日交易不超过5笔为佳
  let frequencyScore = 15;
  const tradingDays = Object.keys(dailyTradeCount).length;
  if (tradingDays > 0) {
    const avgTradesPerDay = buySellTrades.length / tradingDays;
    if (avgTradesPerDay > 10) {
      frequencyScore = 5;
    } else if (avgTradesPerDay > 7) {
      frequencyScore = 8;
    } else if (avgTradesPerDay > 5) {
      frequencyScore = 11;
    } else if (avgTradesPerDay <= 3) {
      frequencyScore = 15;
    }
  }
  
  const totalScore = Math.min(100, Math.max(0, Math.floor(stopLossUsage + consistencyScore + riskScore + frequencyScore)));
  
  // 生成纪律详情文本
  let detailsText = '';
  if (stopLossUsage >= 35) {
    detailsText = '✅ 止损纪律优秀';
  } else if (stopLossUsage >= 20) {
    detailsText = '⚠️ 止损使用率偏低';
  } else {
    detailsText = '❌ 请设置止损保护';
  }
  
  if (largeLosses > 0) {
    detailsText += ` | 有${largeLosses}笔大额亏损`;
  }
  
  return {
    score: totalScore,
    details: {
      stopLossUsage: Math.round(stopLossUsage),
      consistency: Math.round(consistencyScore),
      riskManagement: Math.round(riskScore),
      tradeFrequency: Math.round(frequencyScore),
      detailsText: detailsText
    }
  };
}

// ============== 情绪状态计算函数 ==============
function calculateEmotionalState(trades, winningStreak = null) {
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  
  if (buySellTrades.length === 0) {
    return {
      state: 'Calm',
      stateClass: 'calm',
      level: 30,
      winStreakEffect: 0,
      lossStreakEffect: 0,
      riskAdherence: 100,
      message: '📊 开始交易以追踪情绪状态',
      color: '#34d399'
    };
  }
  
  // 计算当前连胜/连败
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  let lastResult = null;
  
  // 按日期排序，从最近开始
  const sortedTrades = [...buySellTrades].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB - dateA;
  });
  
  for (const trade of sortedTrades) {
    const pnl = parseFloat(trade.pnl_amount || 0);
    const isWin = pnl > 0;
    
    if (lastResult === null) {
      if (isWin) currentWinStreak = 1;
      else currentLossStreak = 1;
      lastResult = isWin;
    } else if (lastResult === isWin) {
      if (isWin) currentWinStreak++;
      else currentLossStreak++;
    } else {
      break;
    }
  }
  
  // 计算连胜/连败影响系数
  let winStreakEffect = 0;
  let lossStreakEffect = 0;
  
  if (currentWinStreak >= 5) {
    winStreakEffect = 25;
  } else if (currentWinStreak >= 3) {
    winStreakEffect = 15;
  } else if (currentWinStreak >= 2) {
    winStreakEffect = 8;
  } else if (currentWinStreak === 1) {
    winStreakEffect = 3;
  }
  
  if (currentLossStreak >= 5) {
    lossStreakEffect = -30;
  } else if (currentLossStreak >= 3) {
    lossStreakEffect = -20;
  } else if (currentLossStreak >= 2) {
    lossStreakEffect = -10;
  } else if (currentLossStreak === 1) {
    lossStreakEffect = -5;
  }
  
  // 计算风险遵守度（基于止损设置）
  let tradesWithSL = 0;
  buySellTrades.forEach(trade => {
    const sl = parseFloat(trade.sl || 0);
    if (sl && sl !== 0) tradesWithSL++;
  });
  const riskAdherence = buySellTrades.length > 0 ? (tradesWithSL / buySellTrades.length) * 100 : 100;
  
  // 计算整体盈利表现对情绪的影响
  let totalPnl = 0;
  buySellTrades.forEach(trade => {
    totalPnl += parseFloat(trade.pnl_amount || 0);
  });
  
  let performanceEffect = 0;
  if (totalPnl > 500) performanceEffect = 15;
  else if (totalPnl > 200) performanceEffect = 8;
  else if (totalPnl > 50) performanceEffect = 3;
  else if (totalPnl < -500) performanceEffect = -20;
  else if (totalPnl < -200) performanceEffect = -12;
  else if (totalPnl < -50) performanceEffect = -5;
  
  // 计算最终情绪水平 (0-100)
  let emotionalLevel = 50 + winStreakEffect + lossStreakEffect + performanceEffect;
  
  // 根据风险遵守度调整
  if (riskAdherence < 30) emotionalLevel -= 15;
  else if (riskAdherence < 60) emotionalLevel -= 5;
  else if (riskAdherence >= 80) emotionalLevel += 5;
  
  emotionalLevel = Math.min(95, Math.max(5, emotionalLevel));
  
  // 判断情绪状态
  let state = 'Calm';
  let stateClass = 'calm';
  let message = '';
  let color = '#34d399';
  
  if (emotionalLevel >= 75 && winStreakEffect > 10) {
    state = 'Excited';
    stateClass = 'excited';
    message = '⚡ 状态火热！保持专注，避免过度自信';
    color = '#f472b6';
  } else if (emotionalLevel >= 65) {
    state = 'Focused';
    stateClass = 'focused';
    message = '🎯 状态良好，保持当前节奏';
    color = '#fbbf24';
  } else if (emotionalLevel <= 25) {
    state = 'Stressed';
    stateClass = 'stressed';
    message = '😰 情绪压力较大，建议暂停交易休息';
    color = '#f87171';
  } else if (emotionalLevel <= 40) {
    state = 'Anxious';
    stateClass = 'stressed';
    message = '😟 情绪波动较大，控制仓位大小';
    color = '#f97316';
  } else if (emotionalLevel <= 55) {
    state = 'Calm';
    stateClass = 'calm';
    message = '🧘 情绪平稳，坚持交易计划';
    color = '#34d399';
  } else {
    state = 'Confident';
    stateClass = 'focused';
    message = '💪 信心充足，继续保持纪律';
    color = '#a78bfa';
  }
  
  // 添加连败警告
  if (currentLossStreak >= 3) {
    message = `⚠️ 连续${currentLossStreak}笔亏损，建议暂停复盘`;
  } else if (currentWinStreak >= 3) {
    message = `🔥 连续${currentWinStreak}笔盈利，保持谨慎`;
  }
  
  return {
    state: state,
    stateClass: stateClass,
    level: Math.round(emotionalLevel),
    winStreakEffect: winStreakEffect,
    lossStreakEffect: lossStreakEffect,
    riskAdherence: Math.round(riskAdherence),
    message: message,
    color: color,
    currentWinStreak: currentWinStreak,
    currentLossStreak: currentLossStreak
  };
}

// ============== 六维雷达图绘制函数 ==============
function initRadarChart(statsData, allTradesData) {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  
  if (radarChart) {
    try { radarChart.destroy(); } catch(e) {}
  }
  
  // 获取交易数据
  const buySellTrades = allTradesData.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  const totalTrades = buySellTrades.length;
  
  // 1. Win Rate (胜率) - 0-100
  let winRateScore = statsData.winRate;
  
  // 2. Profit Factor (盈利因子) - 盈利总额 / 亏损总额，映射到 0-100
  let profitFactorScore = 0;
  let totalWinning = 0;
  let totalLosing = 0;
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl > 0) totalWinning += pnl;
    else if (pnl < 0) totalLosing += Math.abs(pnl);
  });
  const profitFactor = totalLosing > 0 ? totalWinning / totalLosing : (totalWinning > 0 ? 10 : 0);
  // 盈利因子 1.0 = 50分, 2.0 = 80分, 3.0+ = 100分
  profitFactorScore = Math.min(100, Math.max(0, (profitFactor - 0.5) / 3.5 * 100));
  if (profitFactor >= 3) profitFactorScore = 100;
  if (profitFactor <= 0.5) profitFactorScore = 0;
  
  // 3. Consistency (一致性) - 基于每日盈亏的稳定性
  let consistencyScore = 50;
  if (buySellTrades.length > 0) {
    const dailyPnL = {};
    buySellTrades.forEach(trade => {
      const date = trade.date;
      const pnl = parseFloat(trade.pnl_amount || 0);
      if (!dailyPnL[date]) dailyPnL[date] = 0;
      dailyPnL[date] += pnl;
    });
    const dailyValues = Object.values(dailyPnL);
    if (dailyValues.length > 0) {
      const mean = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
      const variance = dailyValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / dailyValues.length;
      const stdDev = Math.sqrt(variance);
      const maxPossibleStdDev = 300;
      consistencyScore = Math.max(0, Math.min(100, 100 - (stdDev / maxPossibleStdDev) * 100));
    }
  }
  
  // 4. Max Drawdown (最大回撤) - 计算权益曲线最大回撤，映射到 0-100 (回撤越小分数越高)
  let maxDrawdownScore = 100;
  let balance = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const sortedTrades = [...buySellTrades].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateA - dateB;
  });
  sortedTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    balance += pnl;
    if (balance > peak) peak = balance;
    const drawdown = peak > 0 ? (peak - balance) / peak * 100 : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });
  // 最大回撤 0% = 100分, 20% = 60分, 40% = 20分, 50%+ = 0分
  maxDrawdownScore = Math.max(0, Math.min(100, 100 - maxDrawdown * 2));
  
  // 5. Recovery Factor (恢复因子) - 总盈利 / 最大回撤金额，映射到 0-100
  let recoveryFactorScore = 50;
  const maxDrawdownAmount = maxDrawdown / 100 * peak;
  const recoveryFactor = maxDrawdownAmount > 0 ? totalWinning / maxDrawdownAmount : (totalWinning > 0 ? 10 : 0);
  // 恢复因子 1.0 = 50分, 2.0 = 75分, 3.0+ = 100分
  recoveryFactorScore = Math.min(100, Math.max(0, (recoveryFactor / 3) * 100));
  if (recoveryFactor >= 3) recoveryFactorScore = 100;
  
  // 6. Avg Win/Loss (平均盈亏比) - 平均盈利 / 平均亏损的绝对值
  let avgWinLossScore = 50;
  const avgWin = totalTrades > 0 ? totalWinning / buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0).length : 0;
  const avgLoss = totalTrades > 0 ? totalLosing / buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) < 0).length : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 5 : 0);
  // 盈亏比 1.0 = 50分, 1.5 = 70分, 2.0 = 85分, 3.0+ = 100分
  avgWinLossScore = Math.min(100, Math.max(0, (winLossRatio / 3) * 100));
  if (winLossRatio >= 3) avgWinLossScore = 100;
  
  const radarData = {
    labels: ['Win Rate', 'Profit Factor', 'Consistency', 'Max Drawdown', 'Recovery Factor', 'Avg Win/Loss'],
    datasets: [{
      label: 'Ability Score',
      data: [winRateScore, profitFactorScore, consistencyScore, maxDrawdownScore, recoveryFactorScore, avgWinLossScore],
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 0.8)',
      borderWidth: 2,
      pointBackgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#3b82f6',
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };
  
  const radarConfig = {
    type: 'radar',
    data: radarData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 20, color: '#64748b', backdropColor: 'transparent' },
          grid: { color: 'rgba(100, 116, 139, 0.25)', circular: true },
          angleLines: { color: 'rgba(100, 116, 139, 0.15)' },
          pointLabels: { color: '#94a3b8', font: { size: 10, weight: '500' } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          borderWidth: 1,
          callbacks: {
            label: function(ctx) {
              let value = ctx.raw;
              let label = ctx.label;
              let scoreText = value >= 80 ? 'Excellent' : (value >= 60 ? 'Good' : (value >= 40 ? 'Average' : 'Needs Improvement'));
              return `${label}: ${value.toFixed(1)} pts (${scoreText})`;
            }
          }
        }
      }
    }
  };
  
  try {
    radarChart = new Chart(canvas, radarConfig);
  } catch(e) {
    console.error('创建雷达图失败:', e);
  }
}

// ============== 更新雷达图 ==============
function updateRadarChart() {
  const totalTradesEl = document.getElementById('totalTrades');
  const winningTradesEl = document.getElementById('winningTrades');
  const winRateEl = document.getElementById('winRate');
  const avgPnlEl = document.getElementById('avgPnl');
  const maxPnlEl = document.getElementById('maxPnl');
  const minPnlEl = document.getElementById('minPnl');
  
  if (!totalTradesEl) return;
  
  const statsData = {
    total: parseInt(totalTradesEl.textContent) || 0,
    winCount: parseInt(winningTradesEl.textContent) || 0,
    winRate: parseFloat(winRateEl.textContent) || 0,
    avgPnl: parseFloat(avgPnlEl.textContent) || 0,
    maxPnl: parseFloat(maxPnlEl.textContent) || 0,
    minPnl: parseFloat(minPnlEl.textContent) || 0
  };
  
  initRadarChart(statsData, window.allTradesData);
}

// ---------------- Fetch Trades ----------------
async function fetchTrades() {
  const session = await checkAuth();
  if (!session) return;
  displayUserInfo(session);
  
  try {
    const { data, error } = await client.from("trades").select("*").eq("user_id", session.user.id).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (error) { console.error("Error fetching trades:", error); return; }
    
    window.allTradesData = data || [];
    const groupedData = groupTradesByDate(data);
    renderTable(groupedData);
    updateStats(data);
    updateChart(data);
    updateTopBalance(data);
    addTimeSessionSelector();
    updateSessionStats();
    updateDisciplineScore(data);
           updateEmotionalState(data);
  } catch (error) { console.error("获取交易数据异常:", error); }
}

// ---------------- 删除交易 ----------------
async function deleteTrade(tradeId) {
  const session = await checkAuth();
  if (!session) return;
  const confirmMsg = '确定要删除这笔交易吗？';
  if (!confirm(confirmMsg)) return;
  
  try {
    const { error } = await client.from("trades").delete().eq("id", tradeId).eq("user_id", session.user.id);
    if (error) throw error;
    showNotification('交易删除成功', 'success');
    fetchTrades();
  } catch (error) { console.error('删除失败:', error); alert('删除失败: ' + error.message); }
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
  
  if (stats.total) stats.total.textContent = total;
  if (stats.win) stats.win.textContent = wins;
  if (stats.rate) stats.rate.textContent = total ? ((wins/total)*100).toFixed(2)+'%' : "0%";
  if (stats.avg) stats.avg.textContent = total ? (sum/total).toFixed(2) : "0.00";
  if (stats.max) stats.max.textContent = (max !== null ? max.toFixed(2) : "0.00");
  if (stats.min) stats.min.textContent = (min !== null ? min.toFixed(2) : "0.00");
  
  const statsDataForRanking = {
    total: total,
    winCount: wins,
    winRate: total ? (wins/total)*100 : 0,
    avgPnl: total ? sum/total : 0,
    maxPnl: max !== null ? max : 0,
    minPnl: min !== null ? min : 0
  };
  
  setTimeout(() => {
    updateRadarChart();
    updateRankingSystem(statsDataForRanking, data);
  }, 200);
}

// ---------------- Update Chart ----------------
const updateChart = debounce(function(data) {
  if(!chart) initChart();
  
  const chartData = [...data].sort((a, b) => new Date(a.created_at || a.date || 0).getTime() - new Date(b.created_at || b.date || 0).getTime());
  
  let balance = 0;
  let labels = [];
  let values = [];
  let colors = [];
  chartTradeDetails = [];
  
  chartData.forEach((t) => {
    const change = t.balance_change !== undefined && t.balance_change !== 0 ? Number(t.balance_change) : Number(t.pnl_amount || 0);
    balance += change;
    let displayLabel = '';
    if (t.created_at) {
      const date = new Date(t.created_at);
      displayLabel = `${date.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit'})} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    } else if (t.date) displayLabel = t.date.replace(/-/g,'/');
    
    labels.push(displayLabel);
    values.push(balance);
    chartTradeDetails.push({ direction: t.direction, symbol: t.symbol, pnl_amount: t.pnl_amount, balance_change: t.balance_change, notes: t.notes, created_at: t.created_at, date: t.date });
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
  data.forEach(t => { const change = t.balance_change !== undefined && t.balance_change !== 0 ? Number(t.balance_change) : Number(t.pnl_amount || 0); balance += change; });
  topBalanceEl.textContent = `$${balance.toFixed(2)}`;
}

// ---------------- Submit Trade ----------------
if (form) {
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const session = await checkAuth();
    if (!session) return;
    if (!date.value) { alert('Please select a date'); return; }
    if (!pnlAmount.value) { alert('Please enter P/L amount'); return; }
    
    const sessionSelect = document.getElementById('sessionSelect');
    const selectedSession = sessionSelect ? sessionSelect.value : 'Asia';
    
    const payload = {
      date: date.value, symbol: symbol.value, direction: direction.value, session: selectedSession,
      lot_size: parseFloat(lotSize.value) || 0, sl: parseFloat(sl.value) || 0, entry: parseFloat(entry.value) || 0,
      exit: parseFloat(exit.value) || 0, pnl_amount: parseFloat(pnlAmount.value) || 0, balance_change: 0,
      notes: notes ? notes.value : '', user_id: session.user.id
    };
    
    const { error } = await client.from("trades").insert([payload]);
    if(error) { console.error("Error adding trade:", error); alert("Failed to add trade: " + error.message); }
    else { form.reset(); date.value = new Date().toISOString().split('T')[0]; if (symbol) symbol.focus(); showNotification('Trade added successfully!', 'success'); fetchTrades(); }
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
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  if (confirmBtn) confirmBtn.addEventListener('click', async () => { await handleBalanceTransaction(); });
  const modalAmountInput = document.getElementById('modalAmount');
  if (modalAmountInput) modalAmountInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleBalanceTransaction(); });
}

function showBalanceModal(type) {
  const modal = document.getElementById('balanceModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  if (!modal || !modalTitle) return;
  currentTransactionType = type;
  modalTitle.textContent = type === 'Deposit' ? 'Deposit' : 'Withdrawal';
  if (modalDate) modalDate.value = new Date().toISOString().split('T')[0];
  modal.className = 'modal-overlay ' + type.toLowerCase() + '-modal';
  modal.style.display = 'flex';
  setTimeout(() => { const amountInput = document.getElementById('modalAmount'); if (amountInput) amountInput.focus(); }, 100);
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
  if (!date) { alert('Please select a date'); return; }
  if (isNaN(amount) || amount <= 0) { alert('Please enter a valid amount'); return; }
  
  const payload = {
    date: date, symbol: currentTransactionType, direction: currentTransactionType, lot_size: 0, entry: 0, exit: 0,
    pnl_amount: 0, balance_change: currentTransactionType === "Deposit" ? amount : -amount, notes: notes || '', user_id: session.user.id
  };
  
  try {
    const { error } = await client.from("trades").insert([payload]);
    if (error) throw error;
    document.getElementById('balanceModal').style.display = 'none';
    modalDate.value = '';
    modalAmount.value = '';
    if (modalNotes) modalNotes.value = '';
    showNotification(`${currentTransactionType} successful!`, 'success');
    fetchTrades();
    currentTransactionType = null;
  } catch (error) { console.error("Error adding transaction:", error); alert("Failed to add transaction: " + error.message); }
}

function updateBalanceButtons() {
  document.querySelectorAll(".balance-btn[data-type]").forEach(btn => {
    if (btn.dataset.type === 'Deposit' || btn.dataset.type === 'Withdrawal') {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', (e) => { e.preventDefault(); showBalanceModal(newBtn.dataset.type); });
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
      date: editDate.value, symbol: editSymbol ? editSymbol.value : '', direction: editDirection ? editDirection.value : 'Buy',
      session: editSession ? editSession.value : 'Asia', lot_size: editLotSize ? parseFloat(editLotSize.value) || 0 : 0,
      entry: editEntry ? parseFloat(editEntry.value) || 0 : 0, exit: editExit ? parseFloat(editExit.value) || 0 : 0,
      pnl_amount: editPnlAmount ? parseFloat(editPnlAmount.value) || 0 : 0, notes: editNotes ? editNotes.value : '', user_id: session.user.id
    };
    const tradeId = editId.value;
    
    try {
      const { error } = await client.from('trades').update(payload).eq('id', tradeId).eq('user_id', session.user.id);
      if (error) throw error;
      showNotification('交易更新成功', 'success');
      hideEditForm();
      fetchTrades();
    } catch (error) { console.error('更新失败:', error); alert('更新失败: ' + error.message); }
  });
}

const deleteTradeBtn = document.getElementById('deleteTradeBtn');
if (deleteTradeBtn) {
  deleteTradeBtn.addEventListener('click', async function() {
    const editId = document.getElementById('editId');
    if (!editId) return;
    const tradeId = editId.value;
    const confirmMsg = '确定要删除这笔交易吗？';
    if (!confirm(confirmMsg)) return;
    const session = await checkAuth();
    if (!session) return;
    
    try {
      const { error } = await client.from('trades').delete().eq('id', tradeId).eq('user_id', session.user.id);
      if (error) throw error;
      showNotification('交易删除成功', 'success');
      hideEditForm();
      fetchTrades();
    } catch (error) { console.error('删除失败:', error); alert('删除失败: ' + error.message); }
  });
}

const cancelEditBtn = document.getElementById('cancelEditBtn');
if (cancelEditBtn) cancelEditBtn.addEventListener('click', hideEditForm);

// ---------------- Toggle last 3 trades ----------------
if (toggleBtn) {
  toggleBtn.onclick = () => {
    showAll = !showAll;
    toggleBtn.textContent = showAll ? 'Hide' : 'Show All';
    fetchTrades();
  };
}

// ---------------- Set default date to today ----------------
if (date) date.value = new Date().toISOString().split('T')[0];

function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification-toast');
  if (existingNotification) existingNotification.remove();
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  notification.innerHTML = `<div class="notification-content"><span>${message}</span></div><button class="notification-close">&times;</button>`;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); }, 3000);
  const closeBtn = notification.querySelector('.notification-close');
  if (closeBtn) closeBtn.addEventListener('click', () => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); });
}

// ============== 漂浮粒子效果 ==============
(function() {
  let container = document.getElementById('global-particles');
  if (!container) {
    container = document.createElement('div');
    container.id = 'global-particles';
    document.body.insertBefore(container, document.body.firstChild);
  }
  container.innerHTML = '';
  
  const colors = ['#3b82f6', '#60a5fa', '#06b6d4', '#22d3ee', '#14b8a6'];
  
  for (let i = 0; i < 60; i++) {
    const particle = document.createElement('div');
    const size = 2 + Math.random() * 6;
    const left = Math.random() * 100;
    const duration = 6 + Math.random() * 9;
    const delay = Math.random() * 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    particle.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      left: ${left}%;
      bottom: -10px;
      opacity: 0.7;
      box-shadow: 0 0 ${size * 2}px ${color};
      animation: floatUp ${duration}s linear infinite;
      animation-delay: ${delay}s;
      pointer-events: none;
      z-index: 0;
    `;
    container.appendChild(particle);
  }
  
  if (!document.querySelector('#particle-keyframes')) {
    const style = document.createElement('style');
    style.id = 'particle-keyframes';
    style.textContent = `
      @keyframes floatUp {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
})();

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

// ============== 纪律评分计算函数 ==============
function updateDisciplineScore(trades) {
  const disciplineScoreEl = document.getElementById('disciplineScore');
  const disciplineProgressEl = document.getElementById('disciplineProgress');
  const disciplineDetailsEl = document.getElementById('disciplineDetails');
  
  if (!disciplineScoreEl) return;
  
  // 只统计真实交易
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  
  if (buySellTrades.length === 0) {
    if (disciplineScoreEl) disciplineScoreEl.textContent = '0';
    if (disciplineProgressEl) disciplineProgressEl.style.width = '0%';
    if (disciplineDetailsEl) disciplineDetailsEl.innerHTML = '<span>📊 暂无交易数据</span>';
    return;
  }
  
  // 1. 止损使用率 (50分)
  let tradesWithSL = 0;
  buySellTrades.forEach(trade => {
    const sl = parseFloat(trade.sl || 0);
    if (sl && sl !== 0) tradesWithSL++;
  });
  const stopLossScore = (tradesWithSL / buySellTrades.length) * 50;
  
  // 2. 交易频率 (30分) - 每日不超过5笔为佳
  const dailyCount = {};
  buySellTrades.forEach(trade => {
    const date = trade.date;
    if (!dailyCount[date]) dailyCount[date] = 0;
    dailyCount[date]++;
  });
  
  let frequencyScore = 20;
  const avgTradesPerDay = buySellTrades.length / Object.keys(dailyCount).length;
  if (avgTradesPerDay <= 3) frequencyScore = 30;
  else if (avgTradesPerDay <= 5) frequencyScore = 25;
  else if (avgTradesPerDay <= 7) frequencyScore = 18;
  else if (avgTradesPerDay <= 10) frequencyScore = 12;
  else frequencyScore = 5;
  
  // 3. 大额亏损控制 (20分)
  let largeLossCount = 0;
  let totalLoss = 0;
  let lossCount = 0;
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl < 0) {
      totalLoss += Math.abs(pnl);
      lossCount++;
    }
  });
  const avgLoss = lossCount > 0 ? totalLoss / lossCount : 0;
  
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl < 0 && avgLoss > 0 && Math.abs(pnl) > avgLoss * 2) {
      largeLossCount++;
    }
  });
  
  let riskScore = 20;
  if (largeLossCount > 0) {
    riskScore = Math.max(5, 20 - (largeLossCount * 4));
  }
  
  // 计算总分
  let totalScore = Math.floor(stopLossScore + frequencyScore + riskScore);
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  // 更新UI
  disciplineScoreEl.textContent = totalScore;
  if (disciplineProgressEl) disciplineProgressEl.style.width = `${totalScore}%`;
  
    // 更新详情文字
  let detailsHtml = '';
  if (tradesWithSL === 0) {
    detailsHtml = '⚠️ No stop loss set, high risk';
  } else if (tradesWithSL / buySellTrades.length < 0.5) {
    detailsHtml = '⚠️ Low stop loss usage, consider using SL on every trade';
  } else if (largeLossCount > 0) {
    detailsHtml = `⚠️ ${largeLossCount} large loss(es), watch your position size`;
  } else if (totalScore >= 80) {
    detailsHtml = '✅ Excellent discipline! Keep it up!';
  } else if (totalScore >= 60) {
    detailsHtml = '📈 Good discipline, can improve stop loss habits';
  } else {
    detailsHtml = '📊 Need to improve risk management and stop loss discipline';
  }
  
  if (disciplineDetailsEl) {
    disciplineDetailsEl.innerHTML = `<span>📊 ${detailsHtml}</span>`;
  }
}

// ============== 情绪状态计算函数 ==============
function updateEmotionalState(trades) {
  const emotionStatusEl = document.getElementById('emotionStatus');
  const emotionIndicatorEl = document.getElementById('emotionIndicator');
  const winStreakEffectEl = document.getElementById('winStreakEffect');
  const lossStreakEffectEl = document.getElementById('lossStreakEffect');
  const riskAdherenceEl = document.getElementById('riskAdherence');
  const emotionMessageEl = document.getElementById('emotionMessage');
  
  if (!emotionStatusEl) return;
  
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  
  if (buySellTrades.length === 0) {
    emotionStatusEl.textContent = 'Calm';
    emotionStatusEl.className = 'emotion-status calm';
    if (emotionIndicatorEl) {
      const levelDiv = emotionIndicatorEl.querySelector('.emotion-level');
      if (levelDiv) levelDiv.style.width = '30%';
    }
    if (winStreakEffectEl) winStreakEffectEl.textContent = '+0%';
    if (lossStreakEffectEl) lossStreakEffectEl.textContent = '-0%';
    if (riskAdherenceEl) riskAdherenceEl.textContent = '0%';
    if (emotionMessageEl) emotionMessageEl.innerHTML = '📊 开始交易以追踪情绪状态';
    return;
  }
  
  // 计算连胜/连败
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
  // 按时间倒序排列
  const sorted = [...buySellTrades].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB - dateA;
  });
  
  let lastWasWin = null;
  for (const trade of sorted) {
    const pnl = parseFloat(trade.pnl_amount || 0);
    const isWin = pnl > 0;
    
    if (lastWasWin === null) {
      if (isWin) currentWinStreak = 1;
      else currentLossStreak = 1;
      lastWasWin = isWin;
    } else if (lastWasWin === isWin) {
      if (isWin) currentWinStreak++;
      else currentLossStreak++;
    } else {
      break;
    }
  }
  
  // 计算影响系数
  let winEffect = 0;
  if (currentWinStreak >= 5) winEffect = 25;
  else if (currentWinStreak >= 3) winEffect = 15;
  else if (currentWinStreak >= 2) winEffect = 8;
  else if (currentWinStreak === 1) winEffect = 3;
  
  let lossEffect = 0;
  if (currentLossStreak >= 5) lossEffect = -30;
  else if (currentLossStreak >= 3) lossEffect = -20;
  else if (currentLossStreak >= 2) lossEffect = -10;
  else if (currentLossStreak === 1) lossEffect = -5;
  
  // 计算止损遵守度
  let tradesWithSL = 0;
  buySellTrades.forEach(t => {
    const sl = parseFloat(t.sl || 0);
    if (sl && sl !== 0) tradesWithSL++;
  });
  const riskAdherence = Math.round((tradesWithSL / buySellTrades.length) * 100);
  
  // 计算总盈亏影响
  let totalPnl = 0;
  buySellTrades.forEach(t => {
    totalPnl += parseFloat(t.pnl_amount || 0);
  });
  
  let performanceEffect = 0;
  if (totalPnl > 500) performanceEffect = 15;
  else if (totalPnl > 200) performanceEffect = 8;
  else if (totalPnl > 50) performanceEffect = 3;
  else if (totalPnl < -500) performanceEffect = -20;
  else if (totalPnl < -200) performanceEffect = -12;
  else if (totalPnl < -50) performanceEffect = -5;
  
  // 计算情绪水平
  let emotionLevel = 50 + winEffect + lossEffect + performanceEffect;
  if (riskAdherence < 30) emotionLevel -= 15;
  else if (riskAdherence < 60) emotionLevel -= 5;
  else if (riskAdherence >= 80) emotionLevel += 5;
  emotionLevel = Math.min(95, Math.max(5, emotionLevel));
  
    // 判断情绪状态
  let state = 'Calm';
  let stateClass = 'calm';
  let message = '';
  
  if (emotionLevel >= 75 && winEffect > 10) {
    state = 'Excited';
    stateClass = 'excited';
    message = '⚡ On fire! Stay focused, avoid overconfidence';
  } else if (emotionLevel >= 65) {
    state = 'Focused';
    stateClass = 'focused';
    message = '🎯 In good shape, keep the pace';
  } else if (emotionLevel <= 25) {
    state = 'Stressed';
    stateClass = 'stressed';
    message = '😰 High emotional stress, consider taking a break';
  } else if (emotionLevel <= 40) {
    state = 'Anxious';
    stateClass = 'stressed';
    message = '😟 Emotional volatility, control your position size';
  } else {
    state = 'Calm';
    stateClass = 'calm';
    message = '🧘 Stay calm, stick to your trading plan';
  }
  
  // 添加连胜/连败提示
  if (currentLossStreak >= 3) {
    message = `⚠️ ${currentLossStreak} consecutive loss(es), consider pausing to review`;
  } else if (currentWinStreak >= 3) {
    message = `🔥 ${currentWinStreak} consecutive win(s), stay cautious`;
  }
  
  // 更新UI
  emotionStatusEl.textContent = state;
  emotionStatusEl.className = `emotion-status ${stateClass}`;
  
  if (emotionIndicatorEl) {
    const levelDiv = emotionIndicatorEl.querySelector('.emotion-level');
    if (levelDiv) {
      levelDiv.style.width = `${emotionLevel}%`;
      let color = '#34d399';
      if (state === 'Excited') color = '#f472b6';
      else if (state === 'Focused') color = '#fbbf24';
      else if (state === 'Stressed') color = '#f87171';
      else if (state === 'Anxious') color = '#f97316';
      levelDiv.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
    }
  }
  
  if (winStreakEffectEl) {
    winStreakEffectEl.textContent = `${winEffect >= 0 ? '+' : ''}${winEffect}%`;
    winStreakEffectEl.className = `factor-value ${winEffect >= 0 ? 'positive' : 'negative'}`;
  }
  
  if (lossStreakEffectEl) {
    lossStreakEffectEl.textContent = `${lossEffect >= 0 ? '+' : ''}${lossEffect}%`;
    lossStreakEffectEl.className = `factor-value ${lossEffect >= 0 ? 'positive' : 'negative'}`;
  }
  
  if (riskAdherenceEl) {
    riskAdherenceEl.textContent = `${riskAdherence}%`;
    riskAdherenceEl.className = `factor-value ${riskAdherence >= 70 ? 'positive' : riskAdherence <= 40 ? 'negative' : ''}`;
  }
  
  if (emotionMessageEl) {
    emotionMessageEl.innerHTML = message;
  }
}

// ============== 3D等级徽章 SVG 更新辅助函数 ==============
function updateRankSvg(svgElement, rankKey) {
  const svgs = {
    apprentice: `<path d="M32 12L18 22V42L32 52L46 42V22L32 12Z" fill="currentColor" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                 <circle cx="32" cy="32" r="6" fill="none" stroke="#ffd700" stroke-width="2"/>
                 <path d="M32 26L35 32L32 38L29 32Z" fill="#ffd700" opacity="0.8"/>`,
    
    learner: `<path d="M32 12L18 22V42L32 52L46 42V22L32 12Z" fill="currentColor" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
              <rect x="26" y="28" width="12" height="8" rx="1" fill="#ffd700" opacity="0.6"/>
              <path d="M26 32L30 36L34 32" stroke="#ffd700" stroke-width="1.5" fill="none"/>`,
    
    trader: `<path d="M32 10L16 22V44L32 54L48 44V22L32 10Z" fill="currentColor" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
             <path d="M16 22L6 18M48 22L58 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M32 28L36 34L32 40L28 34Z" fill="none" stroke="#fff" stroke-width="2"/>`,
    
    sniper: `<path d="M32 8L14 22V46L32 56L50 46V22L32 8Z" fill="currentColor" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
             <path d="M14 22L2 16M50 22L62 16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
             <path d="M14 26L4 24M50 26L60 24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
             <circle cx="32" cy="34" r="8" fill="none" stroke="#fff" stroke-width="2.5"/>
             <circle cx="32" cy="34" r="3" fill="#fff"/>`,
    
    elite: `<path d="M32 6L12 22V48L32 58L52 48V22L32 6Z" fill="currentColor" stroke="rgba(255,255,255,0.5)" stroke-width="1.5"/>
            <path d="M12 22L-2 14M52 22L66 14" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M12 28L0 24M52 28L64 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M14 34L4 32M50 34L60 32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M26 20L32 12L38 20L44 16L40 26L24 26L20 16L26 20Z" fill="none" stroke="#ffd700" stroke-width="2"/>`,
    
    wizard: `<defs><linearGradient id="wizardGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="50%" stop-color="#ff9ff3"/><stop offset="100%" stop-color="#feca57"/></linearGradient></defs>
             <path d="M32 4L10 22V50L32 60L54 50V22L32 4Z" fill="currentColor" stroke="url(#wizardGrad)" stroke-width="2"/>
             <path d="M10 22L-8 10M54 22L72 10" stroke="url(#wizardGrad)" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
             <path d="M10 28L-6 20M54 28L70 20" stroke="url(#wizardGrad)" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
             <path d="M12 34L-4 28M52 34L68 28" stroke="url(#wizardGrad)" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
             <circle cx="32" cy="34" r="10" fill="none" stroke="#ffeaa7" stroke-width="1.5" stroke-dasharray="4 4"/>
             <circle cx="32" cy="34" r="5" fill="none" stroke="#ffeaa7" stroke-width="1.5"/>
             <path d="M32 24L32 44M22 34L42 34" stroke="#ffeaa7" stroke-width="1" opacity="0.6"/>
             <path d="M32 30L34 34L32 38L30 34Z" fill="#fff"/>`
  };
  
  const svgContent = svgs[rankKey] || svgs.apprentice;
  svgElement.innerHTML = svgContent;
}

window.updateRankSvg = updateRankSvg;

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
    initBalanceModal();
    updateBalanceButtons();
    if (window.initLanguage) window.initLanguage();
    setTimeout(() => { updateRadarChart(); }, 500);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();