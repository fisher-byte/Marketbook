/*
 * 默认头像生成脚本
 * 创建一个简单的SVG默认头像
 */

const fs = require('fs');
const path = require('path');

// 创建默认头像SVG
const defaultAvatarSVG = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆 -->
  <circle cx="100" cy="100" r="90" fill="url(#gradient)" stroke="#FFFFFF" stroke-width="2"/>
  
  <!-- 用户图标 -->
  <circle cx="100" cy="80" r="30" fill="#FFFFFF" opacity="0.9"/>
  <circle cx="100" cy="130" r="40" fill="#FFFFFF" opacity="0.9"/>
  
  <!-- 文字 -->
  <text x="100" y="115" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#4F46E5" font-weight="bold">
    MB
  </text>
</svg>
`;

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 写入默认头像文件
const defaultAvatarPath = path.join(uploadsDir, 'default-avatar.svg');
fs.writeFileSync(defaultAvatarPath, defaultAvatarSVG.trim());

console.log('默认头像已创建:', defaultAvatarPath);