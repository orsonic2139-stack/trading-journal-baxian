// language.js - 多语言支持
const translations = {
  en: {
    // 侧边栏和标题
    "dashboard": "Dashboard",
    "reports": "Reports",
    "settings": "Settings",
    "trading_journal": "Trading Journal",
    
    // 按钮和操作
    "save_changes": "Save Changes",
    "reset_default": "Reset to Default",
    "deposit": "Deposit",
    "withdrawal": "Withdrawal",
    "logout": "Logout",
    "add_trade": "Add Trade",
    "hide": "Hide",
    "show_all": "Show All",
    
    // 语言设置
    "language": "Language",
    "interface_lang": "Interface Language",
    "language_desc": "Choose your preferred language for the app",
    
    // 主题设置
    "appearance": "Appearance",
    "theme_mode": "Theme Mode",
    "theme_desc": "Switch between light and dark theme",
    "auto_theme": "Auto Theme",
    "auto_theme_desc": "Follow system theme settings",
    "dark_mode": "Dark Mode",
    "light_mode": "Light Mode",
    
    // 设置页面
    "settings_desc": "Customize your trading journal experience",

    // 状态卡片翻译
    "daily_profit_target": "Daily Profit Target",
    "daily_loss_limit": "Daily Loss Limit",
    "trading_status": "Trading Status",
    "no_trading_today": "📊 No trading today",
    "target_desc": "Daily Profit Target",
    "limit_desc": "Daily Loss Limit",
    "status_desc": "Based on today's performance",
    "daily_quest": "Daily Quest",
    "daily_quest_title": "Daily Trading Challenges",
    "quest_desc": "Complete daily tasks to earn rewards and improve your trading skills!",
    "completed_tasks": "Completed Tasks",
    "current_streak": "Current Streak",
    "total_rewards": "Total Rewards",
    "total_tasks": "out of 5 total",
    "days": "days",
    "earned": "earned",
    "todays_quests": "Today's Quests",
    "reward_history": "Reward History",

    // 状态评语
    "profit_target_achieved": "Target achieved! Profit {0} ({1}%)",
    "good_performance": "Good performance! Profit {0} ({1}%)",
    "small_profit": "Small profit {0} ({1}%)",
    "loss_exceeded": "Loss exceeded limit! Loss {0} ({1}%)",
    "near_loss_limit": "Near loss limit! Loss {0} ({1}%)",
    "small_loss": "Small loss {0} ({1}%)",
    "no_trading_today": "No trading today",
    
    // 统计卡片
    "total_trades": "Total Trades",
    "winning_trades": "Winning Trades",
    "win_rate": "Win Rate",
    "avg_pl": "Average P/L",
    "best_profit": "Best Profit",
    "biggest_loss": "Biggest Loss",
    
    // 交易相关
    "symbol": "Symbol",
    "direction": "Direction",
    "lot_size": "Lot Size",
    "entry": "Entry",
    "exit": "Exit",
    "notes": "Notes",
    "operation_history": "Operation History",
    "date": "Date",
    "profit_loss": "P/L",
    "buy": "Buy",
    "sell": "Sell",
    "lot": "Lot",
    
    // 图表相关
    "initial_balance": "Initial Balance",
    "current_pl": "Current P&L",
    "account_email": "Account Email",
    
    // 新增交易相关
    "performance": "Performance",
    "summary": "Summary",
    "rr": "R:R",
    "trades": "Trades",
    "deposit_withdrawal": "D/W",
    "balance_transactions": "Balance Transactions",
    "single_trade": "Single Trade",
    "risk_reward": "Risk/Reward",
    "total_lots": "Total Lots",
    "trade_count": "Trade Count",
    
    // 编辑/删除相关
    "edit": "Edit",
    "delete": "Delete",
    "edit_trade": "Edit Trade",
    "save_changes": "Save Changes",
    "cancel": "Cancel",
    "confirm_delete": "Are you sure you want to delete this trade?",
    "trade_deleted": "Trade deleted successfully",
    "trade_updated": "Trade updated successfully",
    "actions": "Actions"
  },
  
  zh: {
    // 侧边栏和标题
    "dashboard": "仪表盘",
    "reports": "报告",
    "settings": "设置",
    "trading_journal": "交易日志",
    
    // 按钮和操作
    "save_changes": "保存更改",
    "reset_default": "重置默认",
    "deposit": "入金",
    "withdrawal": "出金",
    "logout": "退出登录",
    "add_trade": "添加交易",
    "hide": "隐藏",
    "show_all": "显示全部",
    
    // 语言设置
    "language": "语言",
    "interface_lang": "界面语言",
    "language_desc": "选择您偏好的应用语言",
    
    // 主题设置
    "appearance": "外观",
    "theme_mode": "主题模式",
    "theme_desc": "切换亮色和暗色主题",
    "auto_theme": "自动主题",
    "auto_theme_desc": "跟随系统主题设置",
    "dark_mode": "暗色模式",
    "light_mode": "亮色模式",
    
    // 设置页面
    "settings_desc": "定制您的交易日志体验",

    // 状态卡片翻译
    "daily_profit_target": "每日盈利目标",
    "daily_loss_limit": "每日亏损限制",
    "trading_status": "当日交易状态",
    "no_trading_today": "📊 今日尚未开始交易",
    "target_desc": "每日盈利目标",
    "limit_desc": "每日亏损限制",
    "status_desc": "基于今日表现",
    "daily_quest": "每日任务",
    "daily_quest_title": "每日交易挑战",
    "quest_desc": "完成每日任务，赚取奖励并提升交易技能！",
    "completed_tasks": "已完成任务",
    "current_streak": "连续天数",
    "total_rewards": "总奖励",
    "total_tasks": "共5个任务",
    "days": "天",
    "earned": "已获得",
    "todays_quests": "今日任务",
    "reward_history": "奖励历史",

    // 状态评语
    "profit_target_achieved": "目标达成！盈利 {0} ({1}%)",
    "good_performance": "表现良好！盈利 {0} ({1}%)",
    "small_profit": "小幅盈利 {0} ({1}%)",
    "loss_exceeded": "亏损超限！亏损 {0} ({1}%)",
    "near_loss_limit": "接近亏损限制！亏损 {0} ({1}%)",
    "small_loss": "小幅亏损 {0} ({1}%)",
    "no_trading_today": "今日尚未开始交易",
    
    // 统计卡片
    "total_trades": "总交易数",
    "winning_trades": "盈利交易",
    "win_rate": "胜率",
    "avg_pl": "平均盈亏",
    "best_profit": "最大盈利",
    "biggest_loss": "最大亏损",
    
    // 交易相关
    "symbol": "交易品种",
    "direction": "方向",
    "lot_size": "手数",
    "entry": "进场价",
    "exit": "出场价",
    "notes": "备注",
    "operation_history": "交易历史",
    "date": "日期",
    "profit_loss": "盈亏",
    "buy": "买入",
    "sell": "卖出",
    "lot": "手数",
    
    // 图表相关
    "initial_balance": "初始余额",
    "current_pl": "当前盈亏",
    "account_email": "账户邮箱",
    
    // 新增交易相关
    "performance": "表现",
    "summary": "概要",
    "rr": "风险回报比",
    "trades": "交易数",
    "deposit_withdrawal": "入/出金",
    "balance_transactions": "资金操作",
    "single_trade": "单笔交易",
    "risk_reward": "风险/回报",
    "total_lots": "总手数",
    "trade_count": "交易数量",
    
    // 编辑/删除相关
    "edit": "编辑",
    "delete": "删除",
    "edit_trade": "编辑交易",
    "save_changes": "保存更改",
    "cancel": "取消",
    "confirm_delete": "确定要删除这笔交易吗？",
    "trade_deleted": "交易删除成功",
    "trade_updated": "交易更新成功",
    "actions": "操作"
  }
};

// 更改语言函数
function changeLanguage(lang) {
  if (!translations[lang]) return;
  
  // 更新所有有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });
  
  // 更新所有有 data-i18n-placeholder 属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[lang][key] && element.placeholder !== undefined) {
      element.placeholder = translations[lang][key];
    }
  });
  
  // 更新选择框选项
  document.querySelectorAll('option[data-i18n]').forEach(option => {
    const key = option.getAttribute('data-i18n');
    if (translations[lang][key]) {
      option.textContent = translations[lang][key];
    }
  });
  
  // 保存语言偏好
  localStorage.setItem('language', lang);
  
  // 更新页面方向（如果需要）
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  // 更新切换按钮文本（如果存在）
  updateToggleButton(lang);
}

// 更新切换按钮文本
function updateToggleButton(lang) {
  const toggleBtn = document.getElementById('toggleTrades');
  if (!toggleBtn) return;
  
  const showAll = toggleBtn.textContent.includes('Hide') || toggleBtn.textContent.includes('隐藏');
  
  if (lang === 'zh') {
    toggleBtn.textContent = showAll ? '隐藏' : '显示全部';
  } else {
    toggleBtn.textContent = showAll ? 'Hide' : 'Show All';
  }
}

// 初始化语言
function initLanguage() {
  const savedLang = localStorage.getItem('language') || 'en';
  changeLanguage(savedLang);
  
  // 更新语言按钮状态（如果在设置页面）
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.lang === savedLang) {
      btn.classList.add('active');
    }
  });
}

// 全局暴露函数
window.changeLanguage = changeLanguage;
window.initLanguage = initLanguage;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initLanguage);

// 监听storage事件，当在settings页面更改语言时更新其他页面
window.addEventListener('storage', function(e) {
  if (e.key === 'language') {
    changeLanguage(e.newValue);
  }
});