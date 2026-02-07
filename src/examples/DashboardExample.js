/**
 * Dashboard 使用示例 - MarketBook项目
 * 展示用户仪表板的完整集成示例
 * 
 * @version 1.0.0
 * @author MarketBook Team
 */

import React from 'react';
import UserDashboard from '../components/UserDashboard';
import { sampleUserData } from '../data/sampleUserData';
import '../styles/UserDashboard.css';

/**
 * Dashboard 示例组件
 * 展示用户仪表板在实际应用中的使用方式
 */
const DashboardExample = () => {
  // 模拟用户数据加载状态
  const [loading, setLoading] = React.useState(true);
  const [userData, setUserData] = React.useState(null);

  // 模拟数据加载
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setUserData(sampleUserData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 处理用户操作的回调函数
  const handleUserAction = (action, data) => {
    console.log('用户操作:', action, data);
    
    switch (action) {
      case 'editProfile':
        alert('打开编辑资料页面');
        break;
      case 'viewTradingHistory':
        alert('查看交易历史');
        break;
      case 'updatePreferences':
        alert('更新偏好设置');
        break;
      case 'quickTrade':
        alert('执行快速交易');
        break;
      default:
        console.log('未知操作:', action);
    }
  };

  // 处理通知操作
  const handleNotificationAction = (notificationId, action) => {
    console.log('通知操作:', notificationId, action);
    
    // 在实际应用中，这里会调用API更新通知状态
    if (action === 'dismiss') {
      alert(`已关闭通知: ${notificationId}`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>正在加载用户数据...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-example">
      <header className="example-header">
        <h1>MarketBook - 用户仪表板示例</h1>
        <p>展示用户仪表板的完整功能和交互效果</p>
      </header>
      
      <main className="example-content">
        <UserDashboard
          userData={userData}
          onUserAction={handleUserAction}
          onNotificationAction={handleNotificationAction}
          theme="light"
        />
      </main>
      
      <footer className="example-footer">
        <div className="feature-highlights">
          <h3>设计优化亮点</h3>
          <ul>
            <li>✅ 响应式设计，适配各种屏幕尺寸</li>
            <li>✅ 深色/浅色主题切换支持</li>
            <li>✅ 直观的数据可视化图表</li>
            <li>✅ 实时通知系统</li>
            <li>✅ 平滑的动画过渡效果</li>
            <li>✅ 无障碍访问优化</li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

// 添加示例特定的样式
const exampleStyles = `
.dashboard-example {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.example-header {
  text-align: center;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.example-header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5em;
  font-weight: 300;
}

.example-header p {
  margin: 0;
  font-size: 1.2em;
  opacity: 0.9;
}

.example-content {
  margin-bottom: 40px;
}

.example-footer {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.feature-highlights h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.3em;
}

.feature-highlights ul {
  list-style: none;
  padding: 0;
}

.feature-highlights li {
  padding: 8px 0;
  font-size: 1.1em;
  color: #555;
}

.dashboard-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// 在组件挂载时注入样式
const styleSheet = document.createElement('style');
styleSheet.textContent = exampleStyles;
document.head.appendChild(styleSheet);

export default DashboardExample;