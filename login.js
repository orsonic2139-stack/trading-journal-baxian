// login.js - 修复版
const SUPABASE_URL = "https://qwcfxuwerdpadntjxwvo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Y2Z4dXdlcmRwYWRudGp4d3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDQyNjcsImV4cCI6MjA4MzcyMDI2N30.5kMmJwYQQ0vugPplzXhHjeG2C3QB5CQZ39p57WQv1ag";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 安全地获取元素函数
function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`元素 #${id} 不存在`);
  }
  return element;
}

// 安全的元素操作
function safeSetText(id, text) {
  const element = getElement(id);
  if (element) {
    element.textContent = text;
  }
}

function safeShowElement(id, show = true) {
  const element = getElement(id);
  if (element) {
    element.style.display = show ? 'flex' : 'none';
  }
}

// 主初始化函数
function initLogin() {
  console.log('初始化登录页面');
  
  // 检查必要元素是否存在
  const requiredElements = [
    'loginForm', 'signupForm', 'loginEmail', 'loginPassword',
    'signupEmail', 'signupPassword'
  ];
  
  let allElementsExist = true;
  requiredElements.forEach(id => {
    if (!document.getElementById(id)) {
      console.error(`缺少必要元素: #${id}`);
      allElementsExist = false;
    }
  });
  
  if (!allElementsExist) {
    console.error('页面元素不完整，可能HTML结构有问题');
    return;
  }
  
  // 初始化标签页
  initTabs();
  
  // 初始化表单
  initForms();
  
  console.log('登录页面初始化完成');
}

// 初始化标签页
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  if (tabButtons.length === 0) {
    console.error('未找到标签按钮');
    return;
  }
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // 获取标签名
      const tab = btn.dataset.tab;
      if (!tab) {
        console.error('按钮没有 data-tab 属性');
        return;
      }
      
      // 切换按钮状态
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // 切换表单显示
      const forms = document.querySelectorAll('.login-form');
      forms.forEach(form => form.classList.remove('active'));
      
      const targetForm = document.getElementById(`${tab}Form`);
      if (targetForm) {
        targetForm.classList.add('active');
      } else {
        console.error(`找不到表单: #${tab}Form`);
      }
      
      // 清除错误消息
      clearMessages();
    });
  });
}

// 初始化表单
function initForms() {
  // 登录表单
  const loginForm = getElement('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleLogin();
    });
  }
  
  // 注册表单
  const signupForm = getElement('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSignup();
    });
  }
  
  // 密码显示/隐藏
  initPasswordToggle();
}

// 密码显示/隐藏
function initPasswordToggle() {
  const loginToggle = getElement('loginTogglePassword');
  const loginPassword = getElement('loginPassword');
  
  if (loginToggle && loginPassword) {
    loginToggle.addEventListener('click', () => {
      const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      loginPassword.setAttribute('type', type);
      loginToggle.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
  }
  
  const signupToggle = getElement('signupTogglePassword');
  const signupPassword = getElement('signupPassword');
  
  if (signupToggle && signupPassword) {
    signupToggle.addEventListener('click', () => {
      const type = signupPassword.getAttribute('type') === 'password' ? 'text' : 'password';
      signupPassword.setAttribute('type', type);
      signupToggle.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
  }
}

// 处理登录
async function handleLogin() {
  console.log('处理登录请求');
  
  const email = getElement('loginEmail')?.value?.trim();
  const password = getElement('loginPassword')?.value;
  
  // 验证输入
  if (!email || !password) {
    showMessage('loginError', '请填写邮箱和密码');
    return;
  }
  
  // 显示加载状态
  showLoading(true);
  
  try {
    console.log('发送登录请求到Supabase');
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('登录错误:', error);
      showMessage('loginError', error.message);
      return;
    }
    
    console.log('登录成功:', data);
    showMessage('loginSuccess', '登录成功！正在跳转...');
    
    // 等待2秒后跳转
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    
  } catch (error) {
    console.error('登录异常:', error);
    showMessage('loginError', '网络错误，请重试');
  } finally {
    showLoading(false);
  }
}

// 处理注册
async function handleSignup() {
  console.log('处理注册请求');
  
  const email = getElement('signupEmail')?.value?.trim();
  const password = getElement('signupPassword')?.value;
  
  if (!email || !password) {
    showMessage('signupError', '请填写邮箱和密码');
    return;
  }
  
  if (password.length < 6) {
    showMessage('signupError', '密码至少需要6个字符');
    return;
  }
  
  showLoading(true);
  
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });
    
    if (error) {
      console.error('注册错误:', error);
      showMessage('signupError', error.message);
      return;
    }
    
    console.log('注册成功:', data);
    showMessage('signupSuccess', '账户创建成功！请检查邮箱确认。');
    
    // 清空表单
    const signupForm = getElement('signupForm');
    if (signupForm) signupForm.reset();
    
  } catch (error) {
    console.error('注册异常:', error);
    showMessage('signupError', '网络错误，请重试');
  } finally {
    showLoading(false);
  }
}

// 显示消息
function showMessage(elementId, message) {
  const element = getElement(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

// 清除所有消息
function clearMessages() {
  const messageElements = document.querySelectorAll('.error-message, .success-message');
  messageElements.forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

// 显示/隐藏加载状态
function showLoading(show) {
  const overlay = getElement('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// 演示登录
function initDemoLogin() {
  const demoBtn = getElement('demoLogin');
  if (demoBtn) {
    demoBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // 设置演示账户
      const loginEmail = getElement('loginEmail');
      const loginPassword = getElement('loginPassword');
      
      if (loginEmail && loginPassword) {
        loginEmail.value = 'demo@tradingjournal.com';
        loginPassword.value = 'Demo@123';
        
        // 切换到登录标签
        document.querySelector('.tab-btn[data-tab="login"]')?.click();
        
        // 等待片刻后自动登录
        setTimeout(() => {
          handleLogin();
        }, 500);
      }
    });
  }
}

// 当页面完全加载后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  // DOMContentLoaded 已经触发
  initLogin();
}

// 初始化演示登录
initDemoLogin();

// 暴露到全局
window.loginModule = {
  initLogin,
  handleLogin,
  handleSignup,
  client
};

console.log('login.js 已加载，等待初始化');