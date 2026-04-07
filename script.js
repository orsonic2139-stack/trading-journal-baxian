// script.js - 完整版（粒子围绕整个徽章 + Ranking Score 徽章进度条布局）

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

// ============== 图片查看模态框（支持放大 + notes编辑） ==============
async function viewTradeImage(tradeId) {
  const imageData = tradeImages.get(tradeId);
  const existingNotes = await getTradeNotes(tradeId);
  
  const modal = document.createElement('div');
  modal.className = 'image-view-modal';
  modal.innerHTML = `
    <div class="image-view-modal-content">
      <div class="image-view-header">
        <h3>📷 Chart Image & Notes</h3>
        <button class="image-view-close">&times;</button>
      </div>
      <div class="image-view-body">
        <div class="image-container-wrapper">
          <div class="image-main-container" id="imageMainContainer">
            ${imageData ? `<img src="${imageData}" alt="Trade chart" id="viewableImage" class="viewable-image">` : '<div class="no-image-placeholder">📊 No chart image uploaded<br><span>Click "Change Image" to upload</span></div>'}
          </div>
          ${imageData ? `<button class="zoom-btn" id="zoomInBtn" title="Zoom In">🔍+</button>
          <button class="zoom-btn zoom-out" id="zoomOutBtn" title="Zoom Out">🔍-</button>
          <button class="zoom-btn reset-zoom" id="resetZoomBtn" title="Reset">⟳</button>` : ''}
        </div>
        <div class="image-view-notes-section">
          <div class="notes-section-header">
            <strong>📝 Trading Notes</strong>
            <button class="edit-notes-btn" id="editNotesBtn">✏️ Edit</button>
          </div>
          <div class="notes-display" id="notesDisplay">${existingNotes ? existingNotes.replace(/\n/g, '<br>') : '<em>No notes yet. Click Edit to add notes...</em>'}</div>
          <div class="notes-editor" id="notesEditor" style="display: none;">
            <textarea id="notesTextarea" class="notes-edit-textarea" placeholder="Write your trading notes here...">${existingNotes || ''}</textarea>
            <div class="notes-editor-buttons">
              <button class="notes-save-btn" id="saveNotesBtn">💾 Save Notes</button>
              <button class="notes-cancel-btn" id="cancelNotesBtn">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      <div class="image-view-footer">
        <button class="image-view-change">📷 Change Image</button>
        ${imageData ? `<button class="image-view-delete">🗑️ Delete Image</button>` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  addImageViewStyles();
  
  setTimeout(() => modal.classList.add('show'), 10);
  
  let currentZoom = 1;
  const zoomStep = 0.2;
  const maxZoom = 3;
  const minZoom = 0.5;
  
  function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
  
  if (imageData) {
    const img = document.getElementById('viewableImage');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
          currentZoom += zoomStep;
          img.style.transform = `scale(${currentZoom})`;
          img.style.cursor = 'zoom-out';
        }
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > minZoom) {
          currentZoom -= zoomStep;
          img.style.transform = `scale(${currentZoom})`;
          img.style.cursor = currentZoom > 1 ? 'zoom-out' : 'zoom-in';
        }
      });
    }
    
    if (resetZoomBtn) {
      resetZoomBtn.addEventListener('click', () => {
        currentZoom = 1;
        img.style.transform = 'scale(1)';
        img.style.cursor = 'zoom-in';
      });
    }
    
    img.addEventListener('dblclick', () => {
      if (currentZoom === 1) {
        currentZoom = 2;
        img.style.transform = 'scale(2)';
      } else {
        currentZoom = 1;
        img.style.transform = 'scale(1)';
      }
    });
    
    img.addEventListener('click', () => {
      if (currentZoom < maxZoom) {
        currentZoom += zoomStep;
        img.style.transform = `scale(${currentZoom})`;
      } else {
        currentZoom = 1;
        img.style.transform = 'scale(1)';
      }
    });
  }
  
  const notesDisplay = document.getElementById('notesDisplay');
  const notesEditor = document.getElementById('notesEditor');
  const editNotesBtn = document.getElementById('editNotesBtn');
  const saveNotesBtn = document.getElementById('saveNotesBtn');
  const cancelNotesBtn = document.getElementById('cancelNotesBtn');
  const notesTextarea = document.getElementById('notesTextarea');
  
  if (editNotesBtn) {
    editNotesBtn.addEventListener('click', () => {
      notesDisplay.style.display = 'none';
      notesEditor.style.display = 'block';
      if (notesTextarea) notesTextarea.focus();
    });
  }
  
  if (cancelNotesBtn) {
    cancelNotesBtn.addEventListener('click', () => {
      notesEditor.style.display = 'none';
      notesDisplay.style.display = 'block';
      if (notesTextarea) notesTextarea.value = existingNotes || '';
    });
  }
  
  if (saveNotesBtn) {
    saveNotesBtn.addEventListener('click', async () => {
      const newNotes = notesTextarea ? notesTextarea.value : '';
      await saveTradeNotes(tradeId, newNotes);
      
      notesDisplay.innerHTML = newNotes ? newNotes.replace(/\n/g, '<br>') : '<em>No notes yet. Click Edit to add notes...</em>';
      notesEditor.style.display = 'none';
      notesDisplay.style.display = 'block';
      
      showNotification('Notes saved successfully!', 'success');
    });
  }
  
  const closeBtn = modal.querySelector('.image-view-close');
  const changeBtn = modal.querySelector('.image-view-change');
  const deleteBtn = modal.querySelector('.image-view-delete');
  
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      closeModal();
      openImageUploadModal(tradeId, existingNotes);
    });
  }
  
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      closeModal();
      removeTradeImage(tradeId);
    });
  }
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
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
      max-width: 800px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(59, 130, 246, 0.3);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }
    .image-view-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
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
    .image-view-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }
    .image-container-wrapper {
      position: relative;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      min-height: 300px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }
    .image-main-container {
      max-width: 100%;
      max-height: 350px;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
    .viewable-image {
      max-width: 100%;
      max-height: 350px;
      object-fit: contain;
      border-radius: 12px;
      transition: transform 0.2s ease;
      cursor: zoom-in;
    }
    .no-image-placeholder {
      text-align: center;
      padding: 3rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    .no-image-placeholder span {
      font-size: 0.75rem;
      display: block;
      margin-top: 0.5rem;
    }
    .zoom-btn {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      font-size: 1rem;
      cursor: pointer;
      backdrop-filter: blur(4px);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .zoom-btn.zoom-out { bottom: 5rem; }
    .zoom-btn.reset-zoom { bottom: 9rem; }
    .zoom-btn:hover {
      background: rgba(59, 130, 246, 0.3);
      transform: scale(1.05);
    }
    .image-view-notes-section {
      background: rgba(0, 0, 0, 0.25);
      border-radius: 14px;
      padding: 1rem;
      border: 1px solid rgba(59, 130, 246, 0.15);
    }
    .notes-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    }
    .notes-section-header strong {
      color: #3b82f6;
      font-size: 0.85rem;
    }
    .edit-notes-btn {
      background: rgba(62, 180, 137, 0.2);
      border: 1px solid rgba(62, 180, 137, 0.3);
      color: #3eb489;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .edit-notes-btn:hover {
      background: rgba(62, 180, 137, 0.4);
      transform: scale(1.02);
    }
    .notes-display {
      color: #cbd5e1;
      font-size: 0.85rem;
      line-height: 1.5;
      padding: 0.5rem;
      max-height: 150px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .notes-display em { color: #64748b; }
    .notes-editor { padding: 0.5rem 0; }
    .notes-edit-textarea {
      width: 100%;
      min-height: 100px;
      padding: 0.8rem;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 12px;
      color: #e2e8f0;
      font-size: 0.85rem;
      font-family: 'Inter', sans-serif;
      resize: vertical;
    }
    .notes-edit-textarea:focus {
      outline: none;
      border-color: #3b82f6;
    }
    .notes-editor-buttons {
      display: flex;
      gap: 0.8rem;
      margin-top: 0.8rem;
      justify-content: flex-end;
    }
    .notes-save-btn, .notes-cancel-btn {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .notes-save-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      color: white;
    }
    .notes-save-btn:hover { transform: translateY(-2px); }
    .notes-cancel-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #94a3b8;
    }
    .notes-cancel-btn:hover { background: rgba(255, 255, 255, 0.15); }
    .image-view-footer {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
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
    .image-view-body::-webkit-scrollbar {
      width: 6px;
    }
    .image-view-body::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    .image-view-body::-webkit-scrollbar-thumb {
      background: linear-gradient(135deg, #3eb489, #3b82f6);
      border-radius: 3px;
    }
  `;
  document.head.appendChild(style);
}

// ============== 鼠标悬停预览样式 ==============
function addHoverPreviewStyles() {
  if (document.getElementById('hover-preview-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'hover-preview-styles';
  style.textContent = `
    .image-hover-container {
      position: relative;
      display: inline-block;
    }
    
    .image-hover-preview {
      position: fixed;
      z-index: 10050;
      background: linear-gradient(145deg, #0f172a, #1e293b);
      border-radius: 16px;
      padding: 12px;
      border: 1px solid rgba(59, 130, 246, 0.4);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      min-width: 280px;
      max-width: 350px;
      pointer-events: none;
      animation: fadeInScale 0.2s ease;
    }
    
    @keyframes fadeInScale {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .hover-preview-content {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .hover-image-container {
      text-align: center;
      max-height: 180px;
      overflow: hidden;
      border-radius: 12px;
      background: rgba(0, 0, 0, 0.3);
    }
    
    .hover-image {
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .hover-no-image {
      padding: 30px;
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
    }
    
    .hover-notes-container {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      padding: 8px 12px;
      border-left: 3px solid #3b82f6;
    }
    
    .hover-notes-container strong {
      color: #3b82f6;
      font-size: 0.7rem;
      display: block;
      margin-bottom: 6px;
    }
    
    .hover-notes-text {
      color: #cbd5e1;
      font-size: 0.8rem;
      line-height: 1.4;
      max-height: 100px;
      overflow-y: auto;
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .image-hover-preview::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 20px;
      width: 16px;
      height: 16px;
      background: linear-gradient(145deg, #1e293b, #0f172a);
      transform: rotate(45deg);
      border-left: 1px solid rgba(59, 130, 246, 0.3);
      border-top: 1px solid rgba(59, 130, 246, 0.3);
    }
  `;
  document.head.appendChild(style);
}

// ============== 鼠标悬停预览事件 ==============
function initHoverPreviews() {
  document.addEventListener('mouseover', function(e) {
    const imageBtn = e.target.closest('.image-btn');
    if (!imageBtn) return;
    
    const tradeId = imageBtn.dataset.tradeId;
    if (!tradeId) return;
    
    const hoverPreview = document.getElementById(`hoverPreview_${tradeId}`);
    if (!hoverPreview) return;
    
    if (window.hoverTimeout) clearTimeout(window.hoverTimeout);
    
    window.hoverTimeout = setTimeout(() => {
      const rect = imageBtn.getBoundingClientRect();
      
      hoverPreview.style.display = 'block';
      
      let left = rect.right + 10;
      let top = rect.top - 10;
      
      if (left + 350 > window.innerWidth) {
        left = rect.left - 360;
      }
      
      if (top + 300 > window.innerHeight) {
        top = window.innerHeight - 310;
      }
      
      if (top < 10) top = 10;
      
      hoverPreview.style.left = left + 'px';
      hoverPreview.style.top = top + 'px';
    }, 400);
  });
  
  document.addEventListener('mouseout', function(e) {
    const imageBtn = e.target.closest('.image-btn');
    if (!imageBtn) return;
    
    const tradeId = imageBtn.dataset.tradeId;
    if (!tradeId) return;
    
    const hoverPreview = document.getElementById(`hoverPreview_${tradeId}`);
    if (!hoverPreview) return;
    
    if (window.hoverTimeout) clearTimeout(window.hoverTimeout);
    
    hoverPreview.style.display = 'none';
  });
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

function groupTradesByDate(trades, globalInitialBalance = null) {
  if (!trades || trades.length === 0) return [];
  
  // 优先使用传入的 globalInitialBalance，否则从 DOM 读取
  let initialBalance = globalInitialBalance;
  
  if (initialBalance === null || initialBalance === undefined) {
    const initialBalanceEl = document.getElementById("initialBalance");
    if (initialBalanceEl) {
      const balanceText = initialBalanceEl.textContent;
      const match = balanceText.match(/\$?([0-9.]+)/);
      if (match) {
        initialBalance = parseFloat(match[1]);
      }
    }
  }
  
  // 调试日志
  console.log("Daily Quest - 使用的起始资金:", initialBalance);
  
  // 如果仍然没有，默认使用 1000（但会显示警告）
  if (initialBalance === null || initialBalance === undefined || isNaN(initialBalance)) {
    console.warn("无法获取 Initial Balance，使用默认值 1000");
    initialBalance = 1000;
  }
  
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
        hasBalanceTx: false,
        startingBalance: initialBalance  // 直接使用主页的 Initial Balance
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
    
    // 在 renderTable 函数中，找到计算 questStatus 的代码块
const buySellTradesForQuest = group.trades.filter(t => t.direction === "Buy" || t.direction === "Sell");
const dailyPnl = group.totalPnl;
let questStatus = '', questStatusText = '';

// 使用 group 中存储的起始资金（来自主页 Initial Balance）
let startingBalance = group.startingBalance;

// 如果 group 中没有，从 DOM 重新读取
if (startingBalance === null || startingBalance === undefined || isNaN(startingBalance)) {
  const initialBalanceEl = document.getElementById("initialBalance");
  if (initialBalanceEl) {
    const balanceText = initialBalanceEl.textContent;
    const match = balanceText.match(/\$?([0-9.]+)/);
    if (match) {
      startingBalance = parseFloat(match[1]);
    }
  }
}

// 最终 fallback
if (startingBalance === null || startingBalance === undefined || isNaN(startingBalance)) {
  startingBalance = 1000;
}

// 添加调试日志（可以在控制台查看）
console.log(`日期 ${group.date} - 起始资金: $${startingBalance}, 当日盈亏: $${dailyPnl}`);

const profitTarget = startingBalance * 0.1;      // 盈利目标 = 起始资金 × 10%
const lossLimit = startingBalance * 0.25;        // 亏损限制 = 起始资金 × 25%

const profitTargetFormatted = profitTarget.toFixed(2);
const lossLimitFormatted = lossLimit.toFixed(2);

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
          <div class="image-hover-container" style="position: relative; display: inline-block;">
            <button class="action-btn image-btn" data-trade-id="${t.id}" title="View Chart Image" onclick="window.viewTradeImage('${t.id}')">${tradeImages.has(t.id) ? '📷✓' : '📷'}</button>
            <div class="image-hover-preview" id="hoverPreview_${t.id}" style="display: none;">
              <div class="hover-preview-content">
                <div class="hover-image-container">
                  ${tradeImages.has(t.id) ? `<img src="${tradeImages.get(t.id)}" class="hover-image">` : '<div class="hover-no-image">📷 No Image</div>'}
                </div>
                <div class="hover-notes-container">
                  <strong>📝 Notes:</strong>
                  <div class="hover-notes-text">${(t.notes || 'No notes').replace(/\n/g, '<br>')}</div>
                </div>
              </div>
            </div>
          </div>
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

// ============== 综合评分计算函数（每笔交易最多100-200分） ==============
function calculateOverallScore(statsData) {
  // 如果没有交易数据，直接返回 0
  if (!statsData.total || statsData.total === 0) {
    return 0;
  }
  
  let score = 0;
  
  // 1. 胜率评分：最高 2000 分
  let winRateScore = (statsData.winRate / 100) * 2000;
  score += winRateScore;
  
  // 2. 净盈利评分：最高 3000 分，每盈利 $10 得 3 分
  let totalProfit = statsData.avgPnl * statsData.total;
  let profitScore = 0;
  if (totalProfit > 0) {
    profitScore = Math.min(3000, (totalProfit / 10) * 3);
  }
  score += profitScore;
  
  // 3. 风险控制评分：最高 2500 分
  let riskScore = 2000;
  if (statsData.minPnl < 0) {
    let lossPenalty = Math.min(2000, (Math.abs(statsData.minPnl) / 100) * 50);
    riskScore = Math.max(0, 2000 - lossPenalty);
  }
  score += riskScore;
  
  // 4. 交易活跃度评分：最高 2500 分，每笔交易 50 分
  let activityScore = Math.min(2500, statsData.total * 50);
  score += activityScore;
  
  // 5. 盈亏比评分：最高 1000 分
  let rrScore = 0;
  if (statsData.minPnl < 0 && statsData.avgPnl > 0) {
    let ratio = Math.abs(statsData.avgPnl / statsData.minPnl);
    rrScore = Math.min(1000, ratio * 200);
  } else if (statsData.avgPnl > 0) {
    rrScore = 500;
  }
  score += rrScore;
  
  return Math.min(10000, Math.max(0, Math.floor(score)));
}

// ============== 等级判定函数 (每个子等级间隔1000分) ==============
function getRankByScore(score) {
  // 如果没有分数，返回默认
  if (score === 0) {
    return {
      name: 'Bronze I',
      mainRank: 'Bronze',
      subRank: 'I',
      rankKey: 'bronze',
      rankIndex: 0,
      subRankIndex: 0,
      currentSubLevel: 1,
      nextNeeded: 1000,
      totalPercent: 0,
      isMaxLevel: false
    };
  }
  
  // 主等级顺序（每个主等级有4个子等级）
  const mainRanks = [
    'Bronze', 'Silver', 'Gold', 'Platinum', 
    'Diamond', 'Master', 'Grandmaster', 'Legend'
  ];
  
  // 子等级
  const subRanks = ['I', 'II', 'III', 'IV'];
  
  // 计算当前等级（每个子等级1000分）
  let adjustedScore = Math.max(0, score);
  let levelNumber = Math.floor(adjustedScore / 1000);
  
  // 总共 32 个等级（8主等级 × 4子等级）
  const maxLevels = mainRanks.length * 4;
  
  let isMaxLevel = false;
  if (levelNumber >= maxLevels) {
    levelNumber = maxLevels - 1;
    isMaxLevel = true;
  }
  
  let rankIndex = Math.floor(levelNumber / 4);
  let subRankIndex = levelNumber % 4;
  
  const mainRank = mainRanks[rankIndex];
  const subRank = subRanks[subRankIndex];
  const fullRankName = `${mainRank} ${subRank}`;
  
  // 计算下一级所需分数
  let nextNeeded = 0;
  if (!isMaxLevel) {
    let nextLevelNumber = levelNumber + 1;
    let nextScore = nextLevelNumber * 1000;
    nextNeeded = nextScore - score;
    if (nextNeeded < 0) nextNeeded = 0;
  }
  
  const rankKey = mainRank.toLowerCase();
  
  return {
    name: fullRankName,
    mainRank: mainRank,
    subRank: subRank,
    rankKey: rankKey,
    rankIndex: rankIndex,
    subRankIndex: subRankIndex,
    currentSubLevel: subRankIndex + 1,
    nextNeeded: nextNeeded,
    totalPercent: Math.min(100, Math.floor((score / 32000) * 100)),
    isMaxLevel: isMaxLevel
  };
}

// ============== 根据等级获取粒子数量 ==============
function getParticleCountByRank(rankKey) {
    switch(rankKey) {
        case 'bronze':
            return 35;
        case 'silver':
            return 40;
        case 'gold':
            return 45;
        case 'platinum':
            return 50;
        case 'diamond':
            return 55;
        case 'master':
            return 60;
        case 'grandmaster':
            return 70;
        case 'legend':
            return 80;
        case 'no_data':
            return 20;
        default:
            return 35;
    }
}

// ============== 星光粒子效果函数（顺畅随机漂浮） ==============
function addStarDustEffect(levelIcon, config) {
    // 获取等级卡片
    var rankCard = document.querySelector('.rank-level-card');
    if (!rankCard) return;
    
    // 移除旧的粒子和动画
    var oldDust = rankCard.querySelector('.star-dust');
    if (oldDust) {
        if (oldDust.animationId) cancelAnimationFrame(oldDust.animationId);
        oldDust.remove();
    }
    
    // 粒子数量
    var particleCount = 45;
    
    // 创建粒子容器
    var dustContainer = document.createElement('div');
    dustContainer.className = 'star-dust';
    dustContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15; overflow: hidden; border-radius: 18px;';
    
    // 获取卡片尺寸 - 使用整个卡片区域，不留边距
    var cardWidth = rankCard.offsetWidth;
    var cardHeight = rankCard.offsetHeight;
    
    // 粒子分布范围 - 整个卡片，留少量边缘
    var minX = 5;
    var maxX = cardWidth - 5;
    var minY = 5;
    var maxY = cardHeight - 5;
    
    var rangeWidth = Math.max(50, maxX - minX);
    var rangeHeight = Math.max(50, maxY - minY);
    
    // 存储每个粒子的数据
    var particles = [];
    
    for (var i = 0; i < particleCount; i++) {
        var particle = document.createElement('div');
        
        var size = 2 + Math.random() * 6;
        var leftPos = minX + Math.random() * rangeWidth;
        var topPos = minY + Math.random() * rangeHeight;
        
        // 随机速度 - 更慢更顺畅
        var angle = Math.random() * Math.PI * 2;
        var speed = 8 + Math.random() * 12;
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${leftPos}px;
            top: ${topPos}px;
            border-radius: 50%;
            background: ${config.particleColor || '#CD7F32'};
            box-shadow: 0 0 ${size * 2}px ${config.particleGlow || '#F0C674'};
            opacity: ${0.4 + Math.random() * 0.5};
            will-change: left, top, opacity, width, height;
        `;
        
        dustContainer.appendChild(particle);
        
        particles.push({
            element: particle,
            x: leftPos,
            y: topPos,
            vx: vx,
            vy: vy,
            size: size,
            baseOpacity: 0.4 + Math.random() * 0.5,
            angle: angle,
            rotationSpeed: 0.5 + Math.random() * 1.5,
            glowIntensity: 0.5 + Math.random() * 0.8
        });
    }
    
    rankCard.style.position = 'relative';
    rankCard.style.overflow = 'hidden';
    rankCard.appendChild(dustContainer);
    
    // 边界反弹（带一点随机反弹角度）
    function bounce(p, minX, maxX, minY, maxY) {
        if (p.x < minX) {
            p.x = minX;
            p.vx = Math.abs(p.vx) * (0.9 + Math.random() * 0.2);
        }
        if (p.x > maxX) {
            p.x = maxX;
            p.vx = -Math.abs(p.vx) * (0.9 + Math.random() * 0.2);
        }
        if (p.y < minY) {
            p.y = minY;
            p.vy = Math.abs(p.vy) * (0.9 + Math.random() * 0.2);
        }
        if (p.y > maxY) {
            p.y = maxY;
            p.vy = -Math.abs(p.vy) * (0.9 + Math.random() * 0.2);
        }
    }
    
    // 动画循环 - 使用 requestAnimationFrame 实现60fps平滑动画
    var lastTime = performance.now();
    var animationId = null;
    
    function animateParticles(now) {
        var delta = Math.min(0.033, (now - lastTime) / 1000);
        if (delta <= 0) {
            lastTime = now;
            animationId = requestAnimationFrame(animateParticles);
            return;
        }
        lastTime = now;
        
        // 实时获取卡片尺寸（支持响应式）
        var currentWidth = rankCard.offsetWidth;
        var currentHeight = rankCard.offsetHeight;
        var boundMinX = 5;
        var boundMaxX = currentWidth - 5;
        var boundMinY = 5;
        var boundMaxY = currentHeight - 5;
        
        if (boundMaxX <= boundMinX) boundMaxX = boundMinX + 10;
        if (boundMaxY <= boundMinY) boundMaxY = boundMinY + 10;
        
        var time = Date.now() / 1000;
        
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            
            // 更新位置
            p.x += p.vx * delta;
            p.y += p.vy * delta;
            
            // 边界处理
            bounce(p, boundMinX, boundMaxX, boundMinY, boundMaxY);
            
            // 应用位置
            p.element.style.left = p.x + 'px';
            p.element.style.top = p.y + 'px';
            
            // 平滑的呼吸效果（透明度+大小）
            var breath = 0.6 + 0.4 * Math.sin(time * p.rotationSpeed + p.angle);
            var finalOpacity = Math.min(0.9, Math.max(0.3, p.baseOpacity * breath));
            p.element.style.opacity = finalOpacity;
            
            // 大小呼吸
            var sizeBreath = p.size * (0.7 + 0.3 * Math.sin(time * p.rotationSpeed * 1.5 + p.angle));
            p.element.style.width = sizeBreath + 'px';
            p.element.style.height = sizeBreath + 'px';
            
            // 光晕强度变化
            var glowIntensity = p.glowIntensity * (0.5 + 0.5 * Math.sin(time * p.rotationSpeed * 2));
            p.element.style.boxShadow = `0 0 ${sizeBreath * (1.5 + glowIntensity)}px ${config.particleGlow || '#F0C674'}`;
        }
        
        animationId = requestAnimationFrame(animateParticles);
    }
    
    // 启动动画
    animationId = requestAnimationFrame(animateParticles);
    dustContainer.animationId = animationId;
    
    // 页面可见性变化时暂停/恢复动画（省电）
    function handleVisibilityChange() {
        if (document.hidden) {
            if (animationId) cancelAnimationFrame(animationId);
            animationId = null;
        } else if (!animationId && dustContainer.parentNode) {
            lastTime = performance.now();
            animationId = requestAnimationFrame(animateParticles);
            dustContainer.animationId = animationId;
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    dustContainer.visibilityHandler = handleVisibilityChange;
    
    // 清理函数（当卡片被移除时）
    var observer = new MutationObserver(function(mutations) {
        if (!document.body.contains(rankCard)) {
            if (animationId) cancelAnimationFrame(animationId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// ============== 3D等级徽章 SVG 更新函数（带星光粒子） ==============
function updateRankSvg(svgElement, rankKey, subRank) {
    if (!svgElement) return;
    
    var rankConfig = {
        bronze: {
            bgGrad1: '#F0C674', bgGrad2: '#CD7F32', bgGrad3: '#8B5A2B', bgGrad4: '#3E2723',
            edgeGrad1: '#FFF8DC', edgeGrad2: '#CD7F32',
            particleColor: '#CD7F32', particleGlow: '#F0C674'
        },
        silver: {
            bgGrad1: '#E8E8E8', bgGrad2: '#C0C0C0', bgGrad3: '#A0A0A0', bgGrad4: '#707070',
            edgeGrad1: '#FFFFFF', edgeGrad2: '#A0A0A0',
            particleColor: '#C0C0C0', particleGlow: '#FFFFFF'
        },
        gold: {
            bgGrad1: '#FFD700', bgGrad2: '#DAA520', bgGrad3: '#B8860B', bgGrad4: '#8B6914',
            edgeGrad1: '#FFF8DC', edgeGrad2: '#DAA520',
            particleColor: '#FFD700', particleGlow: '#FFF8DC'
        },
        platinum: {
            bgGrad1: '#E5E4E2', bgGrad2: '#B8B8B8', bgGrad3: '#8C8C8C', bgGrad4: '#5C5C5C',
            edgeGrad1: '#FFFFFF', edgeGrad2: '#B8B8B8',
            particleColor: '#E5E4E2', particleGlow: '#FFFFFF'
        },
        diamond: {
            bgGrad1: '#4169E1', bgGrad2: '#2E4AB5', bgGrad3: '#1E3A8A', bgGrad4: '#0F2350',
            edgeGrad1: '#87CEEB', edgeGrad2: '#2E4AB5',
            particleColor: '#4169E1', particleGlow: '#87CEEB'
        },
        master: {
            bgGrad1: '#9B59B6', bgGrad2: '#7D3C98', bgGrad3: '#5B2C6F', bgGrad4: '#3B1E4A',
            edgeGrad1: '#D7BDE2', edgeGrad2: '#7D3C98',
            particleColor: '#9B59B6', particleGlow: '#D7BDE2'
        },
        grandmaster: {
            bgGrad1: '#FF6666', bgGrad2: '#CC3333', bgGrad3: '#991111', bgGrad4: '#660000',
            edgeGrad1: '#FFB3B3', edgeGrad2: '#CC3333',
            particleColor: '#FF4444', particleGlow: '#FFB3B3'
        },
        legend: {
            bgGrad1: '#FFD700', bgGrad2: '#FFA500', bgGrad3: '#FF8C00', bgGrad4: '#CC7000',
            edgeGrad1: '#FFF8DC', edgeGrad2: '#FFD700',
            particleColor: '#FFD700', particleGlow: '#FFF8DC'
        },
        no_data: {
            bgGrad1: '#4B5563', bgGrad2: '#374151', bgGrad3: '#1F2937', bgGrad4: '#111827',
            edgeGrad1: '#9CA3AF', edgeGrad2: '#6B7280',
            particleColor: '#6B7280', particleGlow: '#9CA3AF'
        }
    };
    
    var config = rankConfig[rankKey] || rankConfig.bronze;
    
    var romanNumeral = '';
    if (subRank === 'I') romanNumeral = 'I';
    else if (subRank === 'II') romanNumeral = 'II';
    else if (subRank === 'III') romanNumeral = 'III';
    else if (subRank === 'IV') romanNumeral = 'IV';
    
    var svgContent = '<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-badge-svg">' +
        '<defs>' +
            '<linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="' + config.bgGrad1 + '"/>' +
                '<stop offset="30%" stop-color="' + config.bgGrad2 + '"/>' +
                '<stop offset="70%" stop-color="' + config.bgGrad3 + '"/>' +
                '<stop offset="100%" stop-color="' + config.bgGrad4 + '"/>' +
            '</linearGradient>' +
            '<linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
                '<stop offset="0%" stop-color="' + config.edgeGrad1 + '"/>' +
                '<stop offset="100%" stop-color="' + config.edgeGrad2 + '"/>' +
            '</linearGradient>' +
            '<radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">' +
                '<stop offset="0%" stop-color="' + config.edgeGrad1 + '" stop-opacity="0.3"/>' +
                '<stop offset="100%" stop-color="' + config.edgeGrad1 + '" stop-opacity="0"/>' +
            '</radialGradient>' +
            '<filter id="mainGlow">' +
                '<feGaussianBlur stdDeviation="2.5" result="blur"/>' +
                '<feMerge>' +
                    '<feMergeNode in="blur"/>' +
                    '<feMergeNode in="SourceGraphic"/>' +
                '</feMerge>' +
            '</filter>' +
            '<filter id="innerGlow">' +
                '<feGaussianBlur stdDeviation="1.5" result="blur"/>' +
                '<feMerge>' +
                    '<feMergeNode in="blur"/>' +
                    '<feMergeNode in="SourceGraphic"/>' +
                '</feMerge>' +
            '</filter>' +
        '</defs>' +
        '<circle cx="40" cy="40" r="35" fill="url(#centerGlow)"/>' +
        '<path d="M40 6 L72 22 L72 54 Q72 72 40 82 Q8 72 8 54 L8 22 Z" fill="url(#mainBg)" stroke="url(#edgeGrad)" stroke-width="3" filter="url(#mainGlow)"/>' +
        '<path d="M40 13 L64 26 L64 52 Q64 67 40 76 Q16 67 16 52 L16 26 Z" fill="none" stroke="' + config.edgeGrad1 + '" stroke-width="1.5" opacity="0.5"/>' +
        '<path d="M30 16 L36 8 L40 14 L44 8 L50 16" fill="none" stroke="' + config.edgeGrad1 + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#innerGlow)"/>' +
        '<circle cx="40" cy="44" r="20" fill="rgba(0,0,0,0.25)" stroke="' + config.edgeGrad1 + '" stroke-width="1.2" opacity="0.6"/>' +
        '<circle cx="40" cy="44" r="14" fill="rgba(0,0,0,0.15)" stroke="' + config.edgeGrad1 + '" stroke-width="0.8" opacity="0.4"/>' +
        '<text x="40" y="52" text-anchor="middle" fill="' + config.edgeGrad1 + '" font-size="22" font-weight="bold" filter="url(#innerGlow)">' + romanNumeral + '</text>' +
        '<path d="M28 70 L40 65 L52 70" fill="none" stroke="' + config.edgeGrad1 + '" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
        '</svg>';
    
    svgElement.innerHTML = svgContent;
    
    var levelIcon = svgElement.closest('.level-icon');
if (levelIcon) {
    // 直接调用，让函数内部自己找到 rank-level-card
    addStarDustEffect(levelIcon, config);
}
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
  
  // 获取当前等级
  const currentRank = getRankByScore(overallScore);
  
  // 计算当前等级内的进度（0-1000）
  let scoreInCurrentLevel = overallScore % 1000;
  let nextLevelScore = 1000;
  
  let isMaxLevel = false;
  if (currentRank.isMaxLevel) {
    isMaxLevel = true;
    scoreInCurrentLevel = 1000;
    nextLevelScore = 1000;
  }
  
  const scorePercent = (scoreInCurrentLevel / 1000) * 100;
  
  // 获取 DOM 元素
  const overallScoreEl = document.getElementById('overallScore');
  const scoreProgressEl = document.getElementById('scoreProgress');
  const scoreStatusEl = document.getElementById('scoreStatus');
  const nextScoreTargetEl = document.getElementById('nextScoreTarget');
  const currentRankLabelEl = document.getElementById('currentRankLabel');
  const nextRankLabelEl = document.getElementById('nextRankLabel');
  const currentLevelEl = document.getElementById('currentLevel');
  const nextLevelNeededEl = document.getElementById('nextLevelNeeded');
  const rankSvg = document.getElementById('rankSvg');
  const levelIcon3d = document.getElementById('levelIcon3d');
  const currentBadgeEl = document.getElementById('currentBadge');
  const nextBadgeEl = document.getElementById('nextBadge');
  
  // 更新分数显示
  if (overallScoreEl) overallScoreEl.textContent = overallScore;
  if (scoreProgressEl) scoreProgressEl.style.width = `${scorePercent}%`;
  if (nextScoreTargetEl) nextScoreTargetEl.textContent = nextLevelScore;
  
  // 更新左侧等级徽章文字
  if (currentLevelEl) currentLevelEl.textContent = currentRank.name;
  
  // 更新左侧下一等级所需分数
  if (nextLevelNeededEl) {
    if (isMaxLevel) {
      nextLevelNeededEl.textContent = 'MAX';
    } else {
      let needed = 1000 - (overallScore % 1000);
      if (needed === 1000) needed = 0;
      nextLevelNeededEl.textContent = `${needed} pts`;
    }
  }
  
  // 更新右侧卡片中的当前等级标签
  if (currentRankLabelEl) {
    currentRankLabelEl.textContent = currentRank.name;
  }
  
  // 更新左侧 3D 徽章 SVG
  if (rankSvg) {
    updateRankSvg(rankSvg, currentRank.rankKey, currentRank.subRank);
  }
  
  // 设置等级图标的数据属性
  if (levelIcon3d) {
    levelIcon3d.setAttribute('data-rank', currentRank.rankKey);
    levelIcon3d.setAttribute('data-sub-rank', currentRank.subRank);
  }
  
  // 更新 Ranking Score 卡片中的当前徽章
  if (currentBadgeEl) {
    const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.setAttribute('viewBox', '0 0 80 80');
    currentBadgeEl.innerHTML = '';
    currentBadgeEl.appendChild(tempSvg);
    updateRankSvg(tempSvg, currentRank.rankKey, currentRank.subRank);
  }
  
  // 计算下一等级并更新徽章
  let nextRankName = '';
  let nextRankKey = '';
  let nextSubRank = '';
  
  if (!isMaxLevel) {
    let nextScore = overallScore + (1000 - (overallScore % 1000));
    if (nextScore % 1000 === 0 && nextScore === overallScore) {
      nextScore = overallScore + 1000;
    }
    const nextRank = getRankByScore(nextScore);
    nextRankName = nextRank.name;
    nextRankKey = nextRank.rankKey;
    nextSubRank = nextRank.subRank;
    
    if (nextBadgeEl) {
      const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      tempSvg.setAttribute('viewBox', '0 0 80 80');
      nextBadgeEl.innerHTML = '';
      nextBadgeEl.appendChild(tempSvg);
      updateRankSvg(tempSvg, nextRankKey, nextSubRank);
    }
    
    if (nextRankLabelEl) nextRankLabelEl.textContent = nextRankName;
  } else {
    nextRankName = 'MAX LEVEL';
    if (nextBadgeEl) {
      nextBadgeEl.innerHTML = '<div style="font-size: 2rem;">🏆</div>';
    }
    if (nextRankLabelEl) nextRankLabelEl.textContent = nextRankName;
  }
  
  // 更新状态文本
  if (scoreStatusEl) {
    if (overallScore === 0) {
      scoreStatusEl.textContent = '📊 添加交易开始积累分数';
    } else if (isMaxLevel) {
      scoreStatusEl.textContent = '🏆 已达最高等级！传奇交易员！';
    } else {
      let needed = 1000 - (overallScore % 1000);
      if (needed === 1000) needed = 0;
      scoreStatusEl.textContent = `📈 还需 ${needed} 分升级到 ${nextRankName}`;
    }
  }
  
  // 更新连胜显示
  const winningStreak = calculateWinningStreak(allTrades);
  const streakValueEl = document.getElementById('winningStreak');
  if (streakValueEl) streakValueEl.textContent = winningStreak;
}

// ============== 纪律评分计算函数 ==============
function updateDisciplineScore(trades) {
  const disciplineScoreEl = document.getElementById('disciplineScore');
  const disciplineProgressEl = document.getElementById('disciplineProgress');
  const disciplineDetailsEl = document.getElementById('disciplineDetails');
  
  if (!disciplineScoreEl) return;
  
  const buySellTrades = trades.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  
  if (buySellTrades.length === 0) {
    if (disciplineScoreEl) disciplineScoreEl.textContent = '0';
    if (disciplineProgressEl) disciplineProgressEl.style.width = '0%';
    if (disciplineDetailsEl) disciplineDetailsEl.innerHTML = '<span>📊 暂无交易数据</span>';
    return;
  }
  
  let tradesWithSL = 0;
  buySellTrades.forEach(trade => {
    const sl = parseFloat(trade.sl || 0);
    if (sl && sl !== 0) tradesWithSL++;
  });
  const stopLossScore = (tradesWithSL / buySellTrades.length) * 50;
  
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
  
  let totalScore = Math.floor(stopLossScore + frequencyScore + riskScore);
  totalScore = Math.min(100, Math.max(0, totalScore));
  
  disciplineScoreEl.textContent = totalScore;
  if (disciplineProgressEl) disciplineProgressEl.style.width = `${totalScore}%`;
  
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
  
  let currentWinStreak = 0;
  let currentLossStreak = 0;
  
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
  
  let tradesWithSL = 0;
  buySellTrades.forEach(t => {
    const sl = parseFloat(t.sl || 0);
    if (sl && sl !== 0) tradesWithSL++;
  });
  const riskAdherence = Math.round((tradesWithSL / buySellTrades.length) * 100);
  
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
  
  let emotionLevel = 50 + winEffect + lossEffect + performanceEffect;
  if (riskAdherence < 30) emotionLevel -= 15;
  else if (riskAdherence < 60) emotionLevel -= 5;
  else if (riskAdherence >= 80) emotionLevel += 5;
  emotionLevel = Math.min(95, Math.max(5, emotionLevel));
  
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
  
  if (currentLossStreak >= 3) {
    message = `⚠️ ${currentLossStreak} consecutive loss(es), consider pausing to review`;
  } else if (currentWinStreak >= 3) {
    message = `🔥 ${currentWinStreak} consecutive win(s), stay cautious`;
  }
  
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

// ============== 六维雷达图绘制函数 ==============
function initRadarChart(statsData, allTradesData) {
  const canvas = document.getElementById('radarChart');
  if (!canvas) return;
  
  if (radarChart) {
    try { radarChart.destroy(); } catch(e) {}
  }
  
  const buySellTrades = allTradesData.filter(t => t.direction === 'Buy' || t.direction === 'Sell');
  const totalTrades = buySellTrades.length;
  
  let winRateScore = statsData.winRate;
  
  let profitFactorScore = 0;
  let totalWinning = 0;
  let totalLosing = 0;
  buySellTrades.forEach(trade => {
    const pnl = parseFloat(trade.pnl_amount || 0);
    if (pnl > 0) totalWinning += pnl;
    else if (pnl < 0) totalLosing += Math.abs(pnl);
  });
  const profitFactor = totalLosing > 0 ? totalWinning / totalLosing : (totalWinning > 0 ? 10 : 0);
  profitFactorScore = Math.min(100, Math.max(0, (profitFactor - 0.5) / 3.5 * 100));
  if (profitFactor >= 3) profitFactorScore = 100;
  if (profitFactor <= 0.5) profitFactorScore = 0;
  
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
  maxDrawdownScore = Math.max(0, Math.min(100, 100 - maxDrawdown * 2));
  
  let recoveryFactorScore = 50;
  const maxDrawdownAmount = maxDrawdown / 100 * peak;
  const recoveryFactor = maxDrawdownAmount > 0 ? totalWinning / maxDrawdownAmount : (totalWinning > 0 ? 10 : 0);
  recoveryFactorScore = Math.min(100, Math.max(0, (recoveryFactor / 3) * 100));
  if (recoveryFactor >= 3) recoveryFactorScore = 100;
  
  let avgWinLossScore = 50;
  const winTrades = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0);
  const lossTrades = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) < 0);
  const avgWin = winTrades.length > 0 ? totalWinning / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? totalLosing / lossTrades.length : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 5 : 0);
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

// 在 fetchTrades 函数中，找到调用 groupTradesByDate 的地方
// 大约在第 2150 行附近

async function fetchTrades() {
  const session = await checkAuth();
  if (!session) return;
  displayUserInfo(session);
  
  try {
    const { data, error } = await client.from("trades").select("*").eq("user_id", session.user.id).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (error) { console.error("Error fetching trades:", error); return; }
    
    window.allTradesData = data || [];
    
    // 从 DOM 获取当前的 Initial Balance
    let currentInitialBalance = null;
    const initialBalanceEl = document.getElementById("initialBalance");
    if (initialBalanceEl) {
      const balanceText = initialBalanceEl.textContent;
      const match = balanceText.match(/\$?([0-9.]+)/);
      if (match) {
        currentInitialBalance = parseFloat(match[1]);
      }
    }
    
    console.log("fetchTrades - 读取到的 Initial Balance:", currentInitialBalance);
    
    // 如果没有读取到，尝试从图表数据计算
    if (currentInitialBalance === null || isNaN(currentInitialBalance)) {
      // 从 allTradesData 计算初始余额
      const sortedForBalance = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at || a.date || 0);
        const dateB = new Date(b.created_at || b.date || 0);
        return dateA - dateB;
      });
      
      let calcBalance = 0;
      for (const trade of sortedForBalance) {
        const change = trade.balance_change !== undefined && trade.balance_change !== 0 
          ? Number(trade.balance_change) 
          : Number(trade.pnl_amount || 0);
        calcBalance += change;
      }
      // 如果有负的累计（说明有初始资金），需要推算
      // 简化处理：如果 chart 有数据，从 chart 获取
      if (chart && chart.data && chart.data.datasets[0].data.length > 0) {
        currentInitialBalance = chart.data.datasets[0].data[0];
      } else {
        currentInitialBalance = 1000;
      }
      console.log("fetchTrades - 推算的 Initial Balance:", currentInitialBalance);
    }
    
    // 传递初始资金给 groupTradesByDate
    const groupedData = groupTradesByDate(data, currentInitialBalance);
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

  // 确保 Initial Balance 正确显示
  const initialBalance = values.length > 0 ? values[0] : 0;
  const currentPnl = values.length > 0 ? values[values.length - 1] - initialBalance : 0;
  
  const initialBalanceEl = document.getElementById("initialBalance");
  const currentPnlEl = document.getElementById("currentPnl");
  
  if (initialBalanceEl) {
    initialBalanceEl.textContent = `$${initialBalance.toFixed(2)}`;
    console.log("updateChart - 设置 Initial Balance:", initialBalance);
  }
  if (currentPnlEl) {
    currentPnlEl.textContent = `${currentPnl>=0?'+':''}$${currentPnl.toFixed(2)}`;
    currentPnlEl.className = currentPnl>=0 ? "pnl-positive" : "pnl-negative";
  }
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
    if (!editId || !editDate) return;
    
    const payload = {
      date: editDate.value, symbol: editSymbol ? editSymbol.value : '', direction: editDirection ? editDirection.value : 'Buy',
      session: editSession ? editSession.value : 'Asia', lot_size: editLotSize ? parseFloat(editLotSize.value) || 0 : 0,
      entry: editEntry ? parseFloat(editEntry.value) || 0 : 0, exit: editExit ? parseFloat(editExit.value) || 0 : 0,
      pnl_amount: editPnlAmount ? parseFloat(editPnlAmount.value) || 0 : 0, user_id: session.user.id
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
    addHoverPreviewStyles();
    initHoverPreviews();
    if (window.initLanguage) window.initLanguage();
    setTimeout(() => { updateRadarChart(); }, 500);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();