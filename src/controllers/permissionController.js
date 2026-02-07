/**
 * 权限管理控制器
 * 负责用户角色和权限的分配与管理
 */

const UserRole = require('../models/UserRole');
const Role = require('../models/Role');

class PermissionController {
    
    /**
     * 为用户分配角色
     */
    static async assignRole(req, res) {
        try {
            const { userId, roleId } = req.body;
            
            // 验证角色是否存在
            const role = await Role.findById(roleId);
            if (!role) {
                return res.status(404).json({
                    success: false,
                    message: '角色不存在'
                });
            }
            
            // 检查是否已分配该角色
            const existingRole = await UserRole.findOne({ userId, roleId });
            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    message: '用户已拥有该角色'
                });
            }
            
            // 创建用户角色关联
            const userRole = new UserRole({
                userId,
                roleId,
                assignedBy: req.user.id,
                assignedAt: new Date()
            });
            
            await userRole.save();
            
            res.status(201).json({
                success: true,
                message: '角色分配成功',
                data: userRole
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '分配角色失败',
                error: error.message
            });
        }
    }
    
    /**
     * 移除用户角色
     */
    static async removeRole(req, res) {
        try {
            const { userId, roleId } = req.body;
            
            const result = await UserRole.findOneAndDelete({ userId, roleId });
            
            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: '未找到该角色分配记录'
                });
            }
            
            res.json({
                success: true,
                message: '角色移除成功'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '移除角色失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取用户所有角色
     */
    static async getUserRoles(req, res) {
        try {
            const { userId } = req.params;
            
            const userRoles = await UserRole.find({ userId })
                .populate('roleId', 'name permissions description');
            
            res.json({
                success: true,
                data: userRoles.map(ur => ({
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
    }
    
    /**
     * 检查用户权限
     */
    static async checkPermission(req, res) {
        try {
            const { userId, permission } = req.body;
            
            const userRoles = await UserRole.find({ userId }).populate('roleId');
            const hasPermission = userRoles.some(ur => 
                ur.roleId.permissions.includes(permission)
            );
            
            res.json({
                success: true,
                data: {
                    hasPermission,
                    userId,
                    permission
                }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '检查权限失败',
                error: error.message
            });
        }
    }
    
    /**
     * 创建新角色
     */
    static async createRole(req, res) {
        try {
            const { name, permissions, description } = req.body;
            
            // 检查角色名是否已存在
            const existingRole = await Role.findOne({ name });
            if (existingRole) {
                return res.status(400).json({
                    success: false,
                    message: '角色名已存在'
                });
            }
            
            const role = new Role({
                name,
                permissions: permissions || [],
                description: description || ''
            });
            
            await role.save();
            
            res.status(201).json({
                success: true,
                message: '角色创建成功',
                data: role
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '创建角色失败',
                error: error.message
            });
        }
    }
    
    /**
     * 获取所有角色列表
     */
    static async getAllRoles(req, res) {
        try {
            const roles = await Role.find({}, 'name permissions description createdAt');
            
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
    }
}

module.exports = PermissionController;