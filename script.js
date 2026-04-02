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
const sl = document.getElementById("sl");
const entry = document.getElementById("entry");
const exit = document.getElementById("exit");
const pnlAmount = document.getElementById("pnlAmount");
const notes = document.getElementById("notes");

let showAll = true;
let chart;
let currentTransactionType = null;
let chartTradeDetails = [];
let dateGroups = {}; // 存储日期分组状态（保留用于兼容性，但不再用于控制展开/收缩）

// ============== 性能优化函数 ==============

// 防抖函数
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
  
  // 检查是否有必要的数据
  if (!entry || entry === 0) {
    return "N/A";
  }
  
  // 判断交易是盈利还是亏损
  const isProfit = pnl > 0;
  
  // 如果没有Exit，尝试使用PNL计算
  if (!exit || exit === 0) {
    if (pnl !== 0) {
      // 使用PNL反向计算Exit价格
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

// 辅助函数：根据价格计算R:R
function calculateRRFromPrices(entry, exit, sl, direction, isProfit) {
  // 计算风险（止损距离）
  let risk = 0;
  
  // 如果有止损价，使用止损价计算风险
  if (sl && sl !== 0) {
    if (direction === "Buy") {
      risk = Math.abs(entry - sl);
    } else if (direction === "Sell") {
      risk = Math.abs(sl - entry);
    }
  } else {
    // 如果没有止损价
    if (!isProfit) {
      // 亏损交易：风险是实际亏损金额
      if (direction === "Buy") {
        risk = Math.abs(exit - entry);
      } else if (direction === "Sell") {
        risk = Math.abs(entry - exit);
      }
    } else {
      // 盈利交易但没有SL：使用合理默认值
      if (direction === "Buy") {
        risk = Math.abs(exit - entry) * 0.5;
      } else if (direction === "Sell") {
        risk = Math.abs(entry - exit) * 0.5;
      }
    }
  }
  
  // 计算回报（盈利或亏损的绝对值）
  let reward = 0;
  if (direction === "Buy") {
    reward = Math.abs(exit - entry);
  } else if (direction === "Sell") {
    reward = Math.abs(entry - exit);
  }
  
  // 计算R:R比率
  if (risk > 0) {
    const rrRatio = reward / risk;
    
    // 如果是亏损交易，显示负的R:R
    if (!isProfit) {
      // 亏损等于风险：显示 -1R
      if (Math.abs(rrRatio - 1) < 0.05) {
        return "-1R";
      }
      // 亏损小于风险：显示 -0.XR
      else if (rrRatio < 1) {
        return `-${rrRatio.toFixed(1)}R`;
      }
      // 亏损大于风险：显示 -X.XR
      else {
        return `-${rrRatio.toFixed(1)}R`;
      }
    }
    
    // 盈利交易正常显示
    if (rrRatio >= 100) {
      return rrRatio.toFixed(0);
    } else if (rrRatio >= 10) {
      return rrRatio.toFixed(1);
    } else {
      return rrRatio.toFixed(2);
    }
  } 
  // 如果风险为0
  else if (risk === 0) {
    return isProfit ? "∞" : "N/A";
  }
  // 如果回报为0
  else if (reward === 0) {
    return "0";
  }
  
  return "N/A";
}

// 辅助函数：根据R:R值计算渐变颜色（红渐变青）
function getRRGradientColor(rrValue) {
  // 如果是亏损交易
  if (rrValue.includes('-') || rrValue.includes('R')) {
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  }
  
  const rrNum = parseFloat(rrValue);
  
  // 红渐变青的颜色映射
  if (rrNum <= 0) {
    return 'linear-gradient(135deg, #ef4444, #dc2626)';
  } else if (rrNum < 0.5) {
    return 'linear-gradient(135deg, #ef4444, #f97316)';
  } else if (rrNum < 1) {
    return 'linear-gradient(135deg, #f97316, #eab308)';
  } else if (rrNum < 1.5) {
    return 'linear-gradient(135deg, #eab308, #22c55e)';
  } else if (rrNum < 2) {
    return 'linear-gradient(135deg, #22c55e, #0ea5e9)';
  } else if (rrNum < 3) {
    return 'linear-gradient(135deg, #0ea5e9, #06b6d4)';
  } else if (rrNum < 5) {
    return 'linear-gradient(135deg, #06b6d4, #8b5cf6)';
  } else {
    return 'linear-gradient(135deg, #8b5cf6, #ec4899)';
  }
}

// 暴露给全局使用
window.calculateRiskReward = calculateRiskReward;

// ============== 日期分组功能（全部展开） ==============

// 初始化日期组状态（保留用于兼容性）
function initDateGroups() {
  // 不再使用收缩功能，直接清空
  dateGroups = {};
}

// 按日期分组交易（所有组都设置为展开状态）
function groupTradesByDate(trades) {
  if (!trades || trades.length === 0) return [];
  
  // 按日期降序排序
  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = new Date(a.created_at || a.date || 0);
    const dateB = new Date(b.created_at || b.date || 0);
    return dateB - dateA;
  });
  
  // 按日期分组
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
    
    // 计算聚合数据
    if (trade.direction === "Buy" || trade.direction === "Sell") {
      const pnl = parseFloat(trade.pnl_amount || 0);
      groups[dateKey].totalPnl += pnl;
      groups[dateKey].totalLots += parseFloat(trade.lot_size || 0);
      if (pnl > 0) groups[dateKey].winCount++;
      groups[dateKey].hasBuySell = true;
      
      // 计算风险回报比
      trade.riskReward = calculateRiskReward(trade);
    } else if (trade.direction === "Deposit") {
      groups[dateKey].depositAmount += parseFloat(trade.balance_change || 0);
      groups[dateKey].hasBalanceTx = true;
    } else if (trade.direction === "Withdrawal") {
      groups[dateKey].withdrawalAmount += parseFloat(trade.balance_change || 0);
      groups[dateKey].hasBalanceTx = true;
    }
  });
  
  // 处理每个分组 - 全部设置为展开状态
  const result = Object.values(groups).map(group => {
    group.isSingle = group.tradeCount === 1;
    group.hasOnlyBalanceTx = group.hasBalanceTx && !group.hasBuySell;
    
    // 所有分组都设置为展开状态
    group.isExpanded = true;
    
    return group;
  });
  
  return result;
}

// ============== 性能计算函数 ==============

function calculatePerformance(group) {
  // 只计算买卖交易的性能
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
  
  // 计算盈利交易比例
  const winningTrades = buySellTrades.filter(t => parseFloat(t.pnl_amount || 0) > 0).length;
  const winPercentage = (winningTrades / totalBuySellTrades) * 100;
  
  // 确定颜色和标签
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
  
  // 创建一体式进度条
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
  const lang = localStorage.getItem('language') || 'en';
  const percentageText = lang === 'zh' ? `${percentage.toFixed(0)}%` : `${percentage.toFixed(0)}%`;
  
  // 根据百分比计算渐变颜色
  let gradientColor;
  
  if (percentage <= 30) {
    gradientColor = 'linear-gradient(90deg, #ef4444, #dc2626)';
  } else if (percentage <= 50) {
    gradientColor = 'linear-gradient(90deg, #f97316, #ea580c)';
  } else if (percentage <= 80) {
    gradientColor = 'linear-gradient(90deg, #eab308, #ca8a04)';
  } else {
    gradientColor = 'linear-gradient(90deg, #06b6d4, #0891b2)';
  }
  
  return `
    <div class="solid-progress-container" style="
      width: 100%; 
      height: 20px; 
      background: #374151; 
      border-radius: 10px; 
      overflow: hidden; 
      border: 1px solid rgba(255, 255, 255, 0.1);
      position: relative;
    ">
      <div class="solid-progress-bar" style="
        width: ${percentage}%; 
        background: ${gradientColor}; 
        border-radius: 10px; 
        height: 100%; 
        display: flex; 
        align-items: center; 
        justify-content: flex-end; 
        padding-right: 8px;
        position: relative;
        transition: width 0.5s ease;
        min-width: 20px;
      ">
        <span class="progress-text" style="
          color: white; 
          font-size: 0.7rem; 
          font-weight: 600; 
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          position: relative;
        ">${percentageText}</span>
      </div>
    </div>
  `;
}

// ============== 更新表格标题（始终显示展开表头） ==============

function updateTableHeaders() {
  const collapsedHeader = document.getElementById('collapsedHeader');
  const expandedHeader = document.getElementById('expandedHeader');
  
  if (!collapsedHeader || !expandedHeader) return;
  
  // 始终隐藏收缩表头，显示展开表头（因为所有交易都展开显示）
  collapsedHeader.style.display = 'none';
  expandedHeader.style.display = 'table-row';
  
  // 更新语言
  if (window.initLanguage) {
    setTimeout(() => window.initLanguage(), 10);
  }
}

// ============== 渲染表格函数（全部展开） ==============

function renderTable(groups) {
  console.log('渲染分组表格（全部展开），组数:', groups?.length);
  
  if (!groups || groups.length === 0) {
    tradeList.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: #94a3b8;">No trades found</td></tr>';
    updateTableHeaders();
    return;
  }
  
  // 先清空表格内容
  tradeList.innerHTML = '';
  
  const rows = showAll ? groups : groups.slice(0, 5);
  
  // 始终显示展开表头
  updateTableHeaders();
  
  rows.forEach(group => {
    const dateStr = group.date;
    const isExpanded = true; // 所有组都展开
    const hasMultiple = group.tradeCount > 1;
    
    // 格式化日期显示
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    
    // 计算显示信息
    const totalTrades = group.tradeCount;
    const totalPnl = group.totalPnl;
    const totalLots = group.totalLots;
    const depositAmount = group.depositAmount;
    const withdrawalAmount = group.withdrawalAmount;
    
    const pnlClass = totalPnl >= 0 ? 'pnl-positive' : 'pnl-negative';
    const pnlSign = totalPnl >= 0 ? '+' : '';
    
    // 计算性能进度条
    const performance = calculatePerformance(group);
    
    // 获取当前语言
    const lang = localStorage.getItem('language') || 'en';
    
    // 对交易进行降序排序（最新的在前）
    const sortedTrades = [...group.trades].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeB - timeA;
    });
    
    // 创建日期分组头行（简化版，不包含展开按钮）
    const headerRow = document.createElement('tr');
    headerRow.className = `date-group-header expanded`;
    headerRow.dataset.date = dateStr;
    
    headerRow.innerHTML = `
      <td colspan="11" style="padding: 0.8rem 0.7rem !important; background: rgba(15, 23, 42, 0.95);">
        <div class="date-header" style="display: flex; align-items: center; gap: 10px;">
          <strong style="color: #3b82f6; font-size: 1rem;">${formattedDate}</strong>
          ${hasMultiple ? `<span class="trade-count-badge" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important; color: white !important; padding: 3px 8px !important; border-radius: 12px !important; font-size: 0.7rem !important; font-weight: 600 !important; min-width: 24px !important; text-align: center !important; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${totalTrades}</span>` : ''}
          <span style="color: #94a3b8; font-size: 0.85rem; margin-left: auto;">${totalTrades} trade${totalTrades !== 1 ? 's' : ''}</span>
        </div>
      </td>
    `;
    
    tradeList.appendChild(headerRow);
    
    // 添加详细交易行
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
      
      // 显示时间
      let displayTime = '';
      if (t.created_at) {
        try {
          const createdDate = new Date(t.created_at);
          displayTime = createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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
      
      // 计算风险回报比并生成带样式的 HTML
      let riskRewardHtml = "";
      if (isBuySell) {
        const rrValue = calculateRiskReward(t);
        const isProfit = parseFloat(t.pnl_amount || 0) > 0;
        
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
      
      let notesDisplay = t.notes || "";
      if (isBalanceTransaction && !notesDisplay) {
        const lang = localStorage.getItem('language') || 'en';
        notesDisplay = lang === 'zh' 
          ? (t.direction === "Deposit" ? "资金存入" : "资金取出")
          : (t.direction === "Deposit" ? "Funds deposited" : "Funds withdrawn");
      }
      
      const detailRow = document.createElement('tr');
      detailRow.className = `trade-detail-row visible`;
      detailRow.dataset.date = dateStr;
      
      detailRow.innerHTML = `
        <td style="color: #94a3b8; font-size: 0.9rem;">
          ${displayTime || ''}
        </td>
        <td>${t.symbol || (isBalanceTransaction ? '' : '-')}</td>
        <td><span class="${directionClass}">${directionDisplay}</span></td>
        <td>${isBuySell ? Number(t.lot_size||0).toFixed(2) : ''}</td>
        <td>${isBuySell ? (t.sl ? Number(t.sl||0).toFixed(4) : '-') : ''}</td>
        <td>${isBuySell ? (t.entry ? Number(t.entry||0).toFixed(4) : '-') : ''}</td>
        <td>${isBuySell ? (t.exit ? Number(t.exit||0).toFixed(4) : '-') : ''}</td>
        <td style="text-align: center; min-width: 90px;">${riskRewardHtml}</td>
        <td class="${amountClass}" style="color: ${displayAmount >= 0 ? '#0ee7ff' : '#ef4444'} !important;">${amountSign}$${Math.abs(displayAmount).toFixed(2)}</td>
        <td>${notesDisplay}</td>
        <td>
          ${isBuySell ? `<button class="edit-btn" onclick="window.showEditForm(${JSON.stringify(t).replace(/"/g, '&quot;')})" data-i18n="edit">Edit</button>` : ''}
          <button class="delete-btn" onclick="deleteTrade('${t.id}')" data-i18n="delete">Delete</button>
        </td>
      `;
      
      tradeList.appendChild(detailRow);
    });
  });
}

// 移除 toggleDateGroup 函数（不再需要）
// 保留空函数避免报错
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
              
              const balanceLine = `Balance: $${balance.toFixed(2)}`;
              
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
    
    const groupedData = groupTradesByDate(data);
    
    renderTable(groupedData);
    updateStats(groupedData.flatMap(g => g.trades));
    updateChart(data);
    updateTopBalance(data);
    
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
    
    // 重新获取交易数据
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
    
    // 更新最大值
    if (max === null || pnl > max) max = pnl;
    
    // 只更新亏损交易的最小值（pnl < 0）
    if (pnl < 0) {
      if (min === null || pnl < min) min = pnl;
    }
  });
  
  animateStat(stats.total, total, 0);
  animateStat(stats.win, wins, 0);
  stats.rate.textContent = total ? ((wins/total)*100).toFixed(2)+'%' : "0%";
  animateStat(stats.avg, total ? sum/total : 0);
  
  // 最大值：如果有交易则显示最大值，否则为0
  animateStat(stats.max, max !== null ? max : 0);
  
  // 最小值：如果有亏损交易则显示最小值，否则为0
  animateStat(stats.min, min !== null ? min : 0);
}

// ---------------- Update Chart ----------------
const updateChart = debounce(function(data) {
  if(!chart) initChart();
  
  // 按创建时间排序（created_at），这是最准确的顺序
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
  
  console.log('=== 图表数据（按时间顺序）===');
  chartData.forEach((t, index) => {
    const change = t.balance_change !== undefined && t.balance_change !== 0 ? 
                   Number(t.balance_change) : Number(t.pnl_amount || 0);
    balance += change;

    // 创建显示标签：日期 + 时间
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

    if(t.direction === "Withdrawal") {
      colors.push("#ff4d4d");
    } else if(t.direction === "Deposit") {
      colors.push("#3eb489");
    } else {
      colors.push(change >= 0 ? "#3eb489" : "#ff4d4d");
    }
    
    console.log(`[${index}] ${displayLabel}: ${t.direction} ${t.symbol || ''} P/L: ${change}, 累计余额: ${balance}`);
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
    sl: parseFloat(sl.value) || 0,
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
  const editSl = document.getElementById('editSl');
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
  if (editSl) editSl.value = trade.sl || '';
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
    const editSl = document.getElementById('editSl');
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
      sl: editSl ? parseFloat(editSl.value) || 0 : 0,
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

// ---------------- Initial Load ----------------
async function initApp() {
  const session = await checkAuth();
  if (session) {
    displayUserInfo(session);
    initChart();
    
    // 初始化日期组状态（清空收缩状态）
    initDateGroups();
    
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

// 启动应用
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}