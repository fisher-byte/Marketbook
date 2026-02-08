/**
 * MemoryStore 单元测试
 * 测试内存存储的基础 CRUD 操作
 */

const memoryStore = require('../db/memoryStore');

describe('MemoryStore', () => {
    beforeEach(() => {
        // 每次测试前清空所有数据
        memoryStore.clearAll();
    });

    describe('基础 CRUD 操作', () => {
        test('应该成功保存数据', () => {
            const testData = {
                name: 'Test User',
                email: 'test@example.com'
            };

            const saved = memoryStore.save('users', testData);

            expect(saved).toHaveProperty('id');
            expect(saved.name).toBe('Test User');
            expect(saved.email).toBe('test@example.com');
        });

        test('应该自动生成递增ID', () => {
            const user1 = memoryStore.save('users', { name: 'User 1' });
            const user2 = memoryStore.save('users', { name: 'User 2' });
            const user3 = memoryStore.save('users', { name: 'User 3' });

            expect(user1.id).toBe(1);
            expect(user2.id).toBe(2);
            expect(user3.id).toBe(3);
        });

        test('应该根据ID查找数据', () => {
            const inserted = memoryStore.save('users', { name: 'John' });
            const found = memoryStore.findById('users', inserted.id);

            expect(found).not.toBeNull();
            expect(found.name).toBe('John');
        });

        test('查找不存在的ID应返回null', () => {
            const found = memoryStore.findById('users', 9999);
            expect(found).toBeNull();
        });

        test('应该根据条件查找单条数据', () => {
            memoryStore.save('users', { email: 'alice@example.com', age: 25 });
            memoryStore.save('users', { email: 'bob@example.com', age: 30 });

            const found = memoryStore.findOne('users', { email: 'bob@example.com' });

            expect(found).not.toBeNull();
            expect(found.email).toBe('bob@example.com');
            expect(found.age).toBe(30);
        });

        test('应该根据条件查找多条数据', () => {
            memoryStore.save('users', { role: 'admin', active: true });
            memoryStore.save('users', { role: 'user', active: true });
            memoryStore.save('users', { role: 'admin', active: false });

            const admins = memoryStore.find('users', { role: 'admin' });

            expect(admins).toHaveLength(2);
            expect(admins.every(u => u.role === 'admin')).toBe(true);
        });

        test('应该查询所有数据', () => {
            memoryStore.save('users', { name: 'A' });
            memoryStore.save('users', { name: 'B' });
            memoryStore.save('users', { name: 'C' });

            const all = memoryStore.find('users');

            expect(all).toHaveLength(3);
        });

        test('应该成功更新数据', () => {
            const user = memoryStore.save('users', { name: 'Old Name', age: 25 });
            
            const updated = memoryStore.updateOne('users', { id: user.id }, { name: 'New Name', age: 26 });

            expect(updated.name).toBe('New Name');
            expect(updated.age).toBe(26);
        });

        test('更新不存在的文档应返回null', () => {
            const result = memoryStore.updateOne('users', { id: 9999 }, { name: 'Test' });
            expect(result).toBeNull();
        });

        test('应该成功删除数据', () => {
            const user = memoryStore.save('users', { name: 'To Delete' });
            
            const deleted = memoryStore.deleteOne('users', { id: user.id });

            expect(deleted).toBe(true);
            expect(memoryStore.findById('users', user.id)).toBeNull();
        });

        test('删除不存在的文档应返回false', () => {
            const result = memoryStore.deleteOne('users', { id: 9999 });
            expect(result).toBe(false);
        });
    });

    describe('高级查询', () => {
        beforeEach(() => {
            // 插入测试数据
            memoryStore.save('users', { name: 'Alice', age: 25, city: 'Beijing' });
            memoryStore.save('users', { name: 'Bob', age: 30, city: 'Shanghai' });
            memoryStore.save('users', { name: 'Charlie', age: 35, city: 'Beijing' });
        });

        test('应该支持多条件查询', () => {
            const result = memoryStore.find('users', { 
                city: 'Beijing',
                age: 25
            });

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Alice');
        });

        test('无匹配结果应返回空数组', () => {
            const result = memoryStore.find('users', { city: 'Guangzhou' });
            expect(result).toHaveLength(0);
        });
    });

    describe('数据隔离', () => {
        test('不同集合的数据应该隔离', () => {
            memoryStore.save('users', { name: 'User' });
            memoryStore.save('posts', { title: 'Post' });

            expect(memoryStore.find('users')).toHaveLength(1);
            expect(memoryStore.find('posts')).toHaveLength(1);
        });

        test('不同集合的ID应该独立计数', () => {
            const user1 = memoryStore.save('users', { name: 'User 1' });
            const post1 = memoryStore.save('posts', { title: 'Post 1' });
            const user2 = memoryStore.save('users', { name: 'User 2' });

            expect(user1.id).toBe(1);
            expect(post1.id).toBe(1);
            expect(user2.id).toBe(2);
        });
    });

    describe('清空操作', () => {
        test('应该清空指定集合', () => {
            memoryStore.save('users', { name: 'User 1' });
            memoryStore.save('users', { name: 'User 2' });
            memoryStore.save('posts', { title: 'Post 1' });

            memoryStore.clear('users');

            expect(memoryStore.find('users')).toHaveLength(0);
            expect(memoryStore.find('posts')).toHaveLength(1);
        });

        test('应该清空所有集合', () => {
            memoryStore.save('users', { name: 'User 1' });
            memoryStore.save('posts', { title: 'Post 1' });

            memoryStore.clearAll();

            expect(memoryStore.find('users')).toHaveLength(0);
            expect(memoryStore.find('posts')).toHaveLength(0);
        });
    });

    describe('边界情况', () => {
        test('应该正确处理空对象保存', () => {
            const result = memoryStore.save('users', {});
            expect(result).toHaveProperty('id');
        });

        test('应该正确处理null值', () => {
            const user = memoryStore.save('users', { name: null, age: null });
            expect(user.name).toBeNull();
            expect(user.age).toBeNull();
        });

        test('应该保留对象的所有属性', () => {
            const data = {
                string: 'text',
                number: 123,
                boolean: true,
                null: null,
                undefined: undefined,
                array: [1, 2, 3],
                object: { nested: 'value' }
            };

            const saved = memoryStore.save('users', data);

            expect(saved.string).toBe('text');
            expect(saved.number).toBe(123);
            expect(saved.boolean).toBe(true);
            expect(saved.array).toEqual([1, 2, 3]);
            expect(saved.object).toEqual({ nested: 'value' });
        });
    });
});
