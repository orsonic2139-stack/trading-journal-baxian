// ---------------- Hamburger Menu ----------------
const sidebar = document.getElementById("sidebar");
const pageContent = document.getElementById("pageContent");
const hamburgerBtn = document.getElementById("hamburgerBtn");

hamburgerBtn.addEventListener("click", () => {
  sidebar.classList.toggle("show");
  pageContent.classList.toggle("shift");
});

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
const entry = document.getElementById("entry");
const exit = document.getElementById("exit");
const pnlAmount = document.getElementById("pnlAmount");
const notes = document.getElementById("notes");

let showAll = true;
let chart;
let currentTransactionType = null;
let chartTradeDetails = [];

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
logoutBtn.addEventListener("click", async () => {
  const { error } = await client.auth.signOut();
  if (error) {
    console.error('Logout error:', error);
    alert('Logout failed: ' + error.message);
  } else {
    window.location.href = 'login.html';
  }
});

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
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          callbacks: {
            title: function(tooltipItems) {
              return tooltipItems[0].label;
            },
            label: function(context) {
              const index = context.dataIndex;
              const balance = context.dataset.data[index];
              const tradeDetail = chartTradeDetails[index];
              
              if (!tradeDetail) {
                return [
                  `Balance: $${balance.toFixed(2)}`,
                  'Pair: N/A',
                  'P&L: N/A'
                ];
              }
              
              const { direction, symbol, pnl_amount, balance_change } = tradeDetail;
              
              // Balance 行
              const balanceLine = `Balance: $${balance.toFixed(2)}`;
              
              // Pair 行
              let pairLine = 'Pair: ';
              if (direction === 'Buy' || direction === 'Sell') {
                pairLine += symbol || 'N/A';
              } else if (direction === 'Deposit') {
                pairLine += 'Deposit';
              } else if (direction === 'Withdrawal') {
                pairLine += 'Withdrawal';
              } else {
                pairLine += 'N/A';
              }
              
              // P&L 行
              let pnlChange = 0;
              if (direction === 'Deposit' || direction === 'Withdrawal') {
                pnlChange = balance_change || 0;
              } else {
                pnlChange = pnl_amount || 0;
              }
              
              const pnlSign = pnlChange >= 0 ? '+' : '-';
              const pnlValue = Math.abs(pnlChange).toFixed(2);
              const pnlLine = `P&L: ${pnlSign}$${pnlValue}`;
              
              return [balanceLine, pairLine, pnlLine];
            }
          }
        }
      },
      scales: {
        x: { 
          grid: { display: false }, 
          ticks: { color: "#6ee7b7" }, 
          title: { display: true, text: "Date", color: "#aaa" } 
        },
        y: { 
          grid: { display: false }, 
          ticks: { color: "#6ee7b7", callback: v => `$${v}` }, 
          title: { display: true, text: "Account Balance", color: "#aaa" } 
        }
      }
    }
  });
}

// ============== 按日期分组并排序 ==============

function groupTradesByDate(data) {
  if (!data || data.length === 0) return [];
  
  // 简单排序：按日期降序，然后按ID降序
  const sorted = [...data].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    const dateCompare = dateB - dateA;
    
    if (dateCompare !== 0) return dateCompare;
    
    // 同一天内按ID降序
    return b.id - a.id;
  });
  
  return sorted;
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
      .order("date", { ascending: false });
      
    if (error) {
      console.error("Error fetching trades:", error);
      return;
    }
    
    console.log('获取到交易数据:', data?.length || 0, '条');
    
    // 简单排序
    const groupedData = data ? groupTradesByDate(data) : [];
    
    renderTable(groupedData);
    updateStats(groupedData);
    updateChart(groupedData);
    updateTopBalance(groupedData);
    
  } catch (error) {
    console.error("获取交易数据异常:", error);
  }
}

// ---------------- Render Trade Table ----------------
function renderTable(data) {
  if (!data || data.length === 0) {
    tradeList.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 2rem; color: #94a3b8;">No trades found</td></tr>';
    return;
  }
  
  const rows = showAll ? data : data.slice(0, 3);
  
  tradeList.innerHTML = rows.map(t => {
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
    
    let displayDate = t.date ? t.date.replace(/-/g,'/') : '';
    
    if (t.created_at && t.date === new Date().toISOString().split('T')[0]) {
      try {
        const createdDate = new Date(t.created_at);
        const timeStr = createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        displayDate += ` ${timeStr}`;
      } catch (e) {}
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
    
    let notesDisplay = t.notes || "";
    if (isBalanceTransaction && !notesDisplay) {
      const lang = localStorage.getItem('language') || 'en';
      notesDisplay = lang === 'zh' 
        ? (t.direction === "Deposit" ? "资金存入" : "资金取出")
        : (t.direction === "Deposit" ? "Funds deposited" : "Funds withdrawn");
    }
    
    return `<tr>
      <td>${displayDate}</td>
      <td>${t.symbol || (isBalanceTransaction ? t.direction : "")}</td>
      <td><span class="${directionClass}">${directionDisplay}</span></td>
      <td>${Number(t.lot_size||0).toFixed(2)}</td>
      <td>${Number(t.entry||0).toFixed(4)}</td>
      <td>${Number(t.exit||0).toFixed(4)}</td>
      <td class="${amountClass}">${amountSign}${Math.abs(displayAmount).toFixed(2)}</td>
      <td>${notesDisplay}</td>
      <td>
        ${isBuySell ? `<button class="edit-btn" onclick="window.showEditForm(${JSON.stringify(t).replace(/"/g, '&quot;')})" data-i18n="edit">Edit</button>` : ''}
        <button class="delete-btn" onclick="deleteTrade('${t.id}')" data-i18n="delete">Delete</button>
      </td>
    </tr>`;
  }).join('');
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
  const tradesOnly = data.filter(t => t.direction === "Buy" || t.direction === "Sell");
  let total = tradesOnly.length, wins = 0, sum = 0, max = -Infinity, min = Infinity;
  
  tradesOnly.forEach(t => {
    const pnl = Number(t.pnl_amount || 0);
    sum += pnl;
    if(pnl > 0) wins++;
    if(pnl > max) max = pnl;
    if(pnl < min) min = pnl;
  });
  
  animateStat(stats.total, total, 0);
  animateStat(stats.win, wins, 0);
  stats.rate.textContent = total ? ((wins/total)*100).toFixed(2)+'%' : "0%";
  animateStat(stats.avg, total ? sum/total : 0);
  animateStat(stats.max, total && max !== -Infinity ? max : 0);
  animateStat(stats.min, total && min !== Infinity ? min : 0);
}

// ---------------- Update Chart ----------------
function updateChart(data) {
  if(!chart) initChart();
  
  // 图表需要按日期升序排列
  const chartData = [...data].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateA - dateB;
  });
  
  let balance = 0;
  let labels = [];
  let values = [];
  let colors = [];
  chartTradeDetails = [];
  
  chartData.forEach(t => {
    const change = t.balance_change !== undefined && t.balance_change !== 0 ? 
                   Number(t.balance_change) : Number(t.pnl_amount || 0);
    balance += change;

    labels.push(t.date ? t.date.replace(/-/g,'/') : '');
    values.push(balance);
    
    chartTradeDetails.push({
      direction: t.direction,
      symbol: t.symbol,
      pnl_amount: t.pnl_amount,
      balance_change: t.balance_change,
      notes: t.notes
    });

    if(t.direction === "Withdrawal") {
      colors.push("#ff4d4d");
    } else if(t.direction === "Deposit") {
      colors.push("#3eb489");
    } else {
      colors.push(change >= 0 ? "#3eb489" : "#ff4d4d");
    }
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
}

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
  
  const payload = {
    date: date.value,
    symbol: symbol.value,
    direction: direction.value,
    lot_size: parseFloat(lotSize.value) || 0,
    entry: parseFloat(entry.value) || 0,
    exit: parseFloat(exit.value) || 0,
    pnl_amount: parseFloat(pnlAmount.value) || 0,
    balance_change: 0,
    notes: notes.value,
    user_id: session.user.id
  };
  
  const { error } = await client.from("trades").insert([payload]);
  if(error) {
    console.error("Error adding trade:", error);
    alert("Failed to add trade: " + error.message);
  } else { 
    form.reset(); 
    date.value = new Date().toISOString().split('T')[0];
    symbol.focus(); 
    showNotification('Trade added successfully!', 'success');
    fetchTrades(); 
  }
});

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

// ---------------- Initial Load ----------------
async function initApp() {
  const session = await checkAuth();
  if (session) {
    displayUserInfo(session);
    initChart();
    fetchTrades(); // 先确保数据能正常显示
    
    // 可选效果，如果稳定后再启用
    setTimeout(() => {
      createParticles();
      addCardGlowEffect();
    }, 1000);
    
    initBalanceModal();
    updateBalanceButtons();
    
    if (window.initLanguage) window.initLanguage();
  }
}

initApp();

// 暴露函数给全局
window.showEditForm = showEditForm;
window.hideEditForm = hideEditForm;
window.deleteTrade = deleteTrade;
window.fetchTrades = fetchTrades;
window.showBalanceModal = showBalanceModal;