/**
 * 头像上传路由
 * 处理用户头像的上传、更新和删除操作
 */

const express = require('express');
const multer = require('multer');
const avatarController = require('../controllers/avatarController');
const { validateToken } = require('../middleware/validation');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        // 使用用户ID和时间戳生成唯一文件名
        const userId = req.userId;
        const timestamp = Date.now();
        const extension = file.originalname.split('.').pop();
        cb(null, `avatar_${userId}_${timestamp}.${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 限制2MB
    },
    fileFilter: function (req, file, cb) {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'), false);
        }
    }
});

// 上传头像
router.post('/upload', 
    validateToken, 
    upload.single('avatar'), 
    avatarController.uploadAvatar
);

// 获取用户头像
router.get('/:userId', avatarController.getAvatar);

// 删除头像
router.delete('/', validateToken, avatarController.deleteAvatar);

// 头像信息
router.get('/info/:userId', avatarController.getAvatarInfo);

module.exports = router;