/**
 * 文件上传中间件
 * 处理用户头像上传的验证和存储
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 创建上传目录
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名：用户ID_时间戳_随机数.扩展名
        const userId = req.user?.id || 'anonymous';
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${userId}_${timestamp}_${random}${ext}`;
        cb(null, filename);
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    // 检查文件类型
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('只支持 JPEG、JPG、PNG、GIF 格式的图片'), false);
    }
    
    // 检查文件大小
    if (file.size > maxSize) {
        return cb(new Error('文件大小不能超过 5MB'), false);
    }
    
    cb(null, true);
};

// 配置multer实例
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: '文件大小超过限制（最大5MB）'
            });
        }
        return res.status(400).json({
            success: false,
            message: '文件上传错误：' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
};