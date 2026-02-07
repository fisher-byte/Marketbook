/**
 * 用户输入验证中间件
 * 提供表单验证和输入清理功能
 */

const { body, validationResult } = require('express-validator');

// 用户注册验证规则
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('用户名长度必须在3-20个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少6位')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('密码必须包含大小写字母和数字'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('两次输入的密码不一致');
            }
            return true;
        })
];

// 用户登录验证规则
const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('请输入有效的邮箱地址'),
    
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
];

// 验证错误处理中间件
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '输入验证失败',
            errors: errors.array()
        });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    handleValidationErrors
};