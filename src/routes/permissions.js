/**
 * 权限管理路由
 * 负责用户角色和权限的分配管理
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// 获取用户角色列表
router.get('/roles', auth.authenticate, auth.requireAdmin, async (req, res) => {
    try {
        const roles = await Role.find().select('-__v');
        res.json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取角色列表失败',
            error: error.message
        });
    }
});

// 为用户分配角色
router.post('/users/:userId/roles', auth.authenticate, auth.requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { roleId } = req.body;
        
        // 检查用户和角色是否存在
        const user = await User.findById(userId);
        const role = await Role.findById(roleId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }
        
        if (!role) {
            return res.status(404).json({
                success: false,
                message: '角色不存在'
            });
        }
        
        // 检查是否已分配该角色
        const existingAssignment = await UserRole.findOne({ userId, roleId });
        if (existingAssignment) {
            return res.status(400).json({
                success: false,
                message: '用户已拥有该角色'
            });
        }
        
        // 分配角色
        const userRole = new UserRole({
            userId,
            roleId,
            assignedBy: req.user.id,
            assignedAt: new Date()
        });
        
        await userRole.save();
        
        res.json({
            success: true,
            message: '角色分配成功',
            data: userRole
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '角色分配失败',
            error: error.message
        });
    }
});

// 获取用户的角色列表
router.get('/users/:userId/roles', auth.authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // 检查权限：用户只能查看自己的角色，管理员可以查看所有
        if (req.user.id !== userId && !req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: '无权查看该用户的角色信息'
            });
        }
        
        const userRoles = await UserRole.find({ userId })
            .populate('roleId', 'name description permissions')
            .select('-__v');
        
        res.json({
            success: true,
            data: userRoles.map(ur => ({
                id: ur._id,
                role: ur.roleId,
                assignedAt: ur.assignedAt,
                assignedBy: ur.assignedBy
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取用户角色失败',
            error: error.message
        });
    }
});

// 移除用户的角色
router.delete('/users/:userId/roles/:roleId', auth.authenticate, auth.requireAdmin, async (req, res) => {
    try {
        const { userId, roleId } = req.params;
        
        const result = await UserRole.findOneAndDelete({ userId, roleId });
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: '未找到对应的角色分配记录'
            });
        }
        
        res.json({
            success: true,
            message: '角色移除成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '角色移除失败',
            error: error.message
        });
    }
});

module.exports = router;