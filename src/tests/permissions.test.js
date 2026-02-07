/**
 * 权限管理功能测试
 */

const request = require('supertest');
const express = require('express');
const permissionRoutes = require('../routes/permissions');

const app = express();
app.use(express.json());
app.use('/api/permissions', permissionRoutes);

describe('权限管理功能测试', () => {
    
    describe('角色管理', () => {
        it('应该能够创建新角色', async () => {
            const response = await request(app)
                .post('/api/permissions/roles')
                .send({
                    name: 'moderator',
                    description: '论坛版主',
                    permissions: ['post:create', 'post:delete', 'user:ban']
                });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('moderator');
        });

        it('应该能够获取角色列表', async () => {
            const response = await request(app)
                .get('/api/permissions/roles');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('用户角色分配', () => {
        it('应该能够为用户分配角色', async () => {
            const response = await request(app)
                .post('/api/permissions/user-roles')
                .send({
                    userId: 'user123',
                    roleId: 'role456'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
        });

        it('应该能够获取用户的角色列表', async () => {
            const response = await request(app)
                .get('/api/permissions/user-roles/user123');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('权限验证中间件', () => {
        it('应该验证用户权限', async () => {
            const response = await request(app)
                .get('/api/permissions/check')
                .set('Authorization', 'Bearer valid-token')
                .query({
                    permission: 'post:create'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(typeof response.body.data.hasPermission).toBe('boolean');
        });
    });

    describe('错误处理', () => {
        it('应该处理无效的角色创建请求', async () => {
            const response = await request(app)
                .post('/api/permissions/roles')
                .send({
                    // 缺少必填字段
                    description: '测试角色'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('应该处理无效的用户角色分配', async () => {
            const response = await request(app)
                .post('/api/permissions/user-roles')
                .send({
                    // 缺少必填字段
                    roleId: 'role456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
});