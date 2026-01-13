// theme.js - 主题管理
const themeColors = {
  dark: {
    '--bg-primary': '#0e1117',
    '--bg-secondary': '#0b0f1a',
    '--card-bg': 'linear-gradient(145deg, #1f2937, #0f172a)',
    '--text-primary': '#e5e7eb',
    '--text-secondary': '#9ca3af',
    '--accent-color': '#3eb489',
    '--accent-secondary': '#818cf8',
    '--border-color': '#1e293b',
    '--input-bg': '#020617',
    '--btn-text': '#020617',
    '--item-hover': 'rgba(62, 180, 137, 0.05)',
    '--shadow-color': 'rgba(0, 0, 0, 0.3)'
  },
  
  light: {
    '--bg-primary': '#f8fafc',
    '--bg-secondary': '#f1f5f9',
    '--card-bg': 'linear-gradient(145deg, #ffffff, #f1f5f9)',
    '--text-primary': '#1e293b',
    '--text-secondary': '#64748b',
    '--accent-color': '#3b82f6',
    '--accent-secondary': '#8b5cf6',
    '--border-color': '#cbd5e1',
    '--input-bg': '#ffffff',
    '--btn-text': '#ffffff',
    '--item-hover': 'rgba(59, 130, 246, 0.05)',
    '--shadow-color': 'rgba(0, 0, 0, 0.1)'
  }
};

// 应用主题
function applyTheme(theme) {
  const colors = themeColors[theme] || themeColors.dark;
  
  // 设置CSS变量
  Object.entries(colors).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
  
  // 更新图表颜色（如果存在）
  updateChartTheme(theme);
  
  // 保存主题
  localStorage.setItem('theme', theme);
}

// 切换主题
function toggleTheme() {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  return newTheme;
}

// 初始化主题
function initTheme() {
  // 检查自动主题
  const autoThemeEnabled = localStorage.getItem('autoTheme') === 'true';
  
  if (autoThemeEnabled && window.matchMedia) {
    // 监听系统主题变化
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(systemTheme);
    
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  } else {
    // 使用保存的主题
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
  }
  
  // 更新开关状态
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.checked = (localStorage.getItem('theme') || 'dark') === 'light';
    
    themeToggle.addEventListener('change', function() {
      const theme = this.checked ? 'light' : 'dark';
      applyTheme(theme);
    });
  }
  
  // 自动主题开关
  const autoToggle = document.getElementById('autoThemeToggle');
  if (autoToggle) {
    autoToggle.checked = localStorage.getItem('autoTheme') === 'true';
    
    autoToggle.addEventListener('change', function() {
      localStorage.setItem('autoTheme', this.checked);
      initTheme(); // 重新初始化主题
    });
  }
}

// 更新图表主题（如果页面中有图表）
function updateChartTheme(theme) {
  if (!window.chart) return;
  
  const isLight = theme === 'light';
  
  chart.options.scales.x.ticks.color = isLight ? '#475569' : '#6ee7b7';
  chart.options.scales.y.ticks.color = isLight ? '#475569' : '#6ee7b7';
  chart.options.scales.x.title.color = isLight ? '#64748b' : '#aaa';
  chart.options.scales.y.title.color = isLight ? '#64748b' : '#aaa';
  
  // 更新数据集颜色
  chart.data.datasets[0].borderColor = isLight ? '#3b82f6' : '#3eb489';
  
  // 更新渐变
  const ctx = chart.ctx;
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  if (isLight) {
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
  } else {
    gradient.addColorStop(0, 'rgba(62, 180, 137, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
  }
  chart.data.datasets[0].backgroundColor = gradient;
  
  chart.update();
}

// 全局暴露函数
window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initTheme);

// 监听storage事件（跨页面同步）
window.addEventListener('storage', function(e) {
  if (e.key === 'theme') {
    applyTheme(e.newValue);
  }
});