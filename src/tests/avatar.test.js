/**
 * 头像上传功能测试
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// 模拟头像控制器
const avatarController = require('../controllers/avatarController');
const UserProfile = require('../models/UserProfile');

// 创建测试应用
const app = express();
app.use(express.json());
app.use('/avatar', require('../routes/avatar'));

describe('Avatar Upload Functionality', () => {
    let testUserId = 'test-user-123';
    
    beforeEach(() => {
        // 清空测试文件目录
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (fs.existsSync(uploadDir)) {
            fs.rmSync(uploadDir, { recursive: true });
        }
    });

    describe('Avatar Validation', () => {
        test('should validate valid image file', () => {
            const validFile = {
                originalname: 'avatar.jpg',
                mimetype: 'image/jpeg',
                size: 1024 * 1024 // 1MB
            };
            
            const result = avatarController.validateAvatarFile(validFile);
            expect(result.isValid).toBe(true);
        });

        test('should reject non-image file', () => {
            const invalidFile = {
                originalname: 'document.pdf',
                mimetype: 'application/pdf',
                size: 1024 * 1024
            };
            
            const result = avatarController.validateAvatarFile(invalidFile);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('只支持图片文件格式 (JPEG, PNG, GIF)');
        });

        test('should reject oversized file', () => {
            const oversizedFile = {
                originalname: 'avatar.jpg',
                mimetype: 'image/jpeg',
                size: 5 * 1024 * 1024 // 5MB
            };
            
            const result = avatarController.validateAvatarFile(oversizedFile);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('文件大小不能超过2MB');
        });
    });

    describe('Avatar Upload API', () => {
        test('should upload avatar successfully', async () => {
            // 模拟文件上传
            const response = await request(app)
                .post('/avatar/upload')
                .set('Authorization', 'Bearer test-token')
                .attach('avatar', Buffer.from('fake image data'), {
                    filename: 'test-avatar.jpg',
                    contentType: 'image/jpeg'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.avatarUrl).toBeDefined();
        });

        test('should handle upload error', async () => {
            const response = await request(app)
                .post('/avatar/upload')
                .set('Authorization', 'Bearer test-token')
                .attach('invalid-file', Buffer.from('fake data'), {
                    filename: 'test.txt',
                    contentType: 'text/plain'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Avatar Management', () => {
        test('should delete avatar successfully', async () => {
            const response = await request(app)
                .delete('/avatar')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should get avatar info successfully', async () => {
            const response = await request(app)
                .get('/avatar/info')
                .set('Authorization', 'Bearer test-token');

            expect(response.status).toBe(200);
            expect(response.body.avatarUrl).toBeDefined();
        });
    });
});