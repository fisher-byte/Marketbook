/**
 * memoryStore 单元测试
 * 
 * 测试内存存储的基础CRUD操作
 */

const memoryStore = require('../../src/db/memoryStore');

describe('MemoryStore', () => {
  const collectionName = 'test_collection';

  beforeEach(() => {
    // 清空测试集合
    memoryStore.clear(collectionName);
  });

  describe('save()', () => {
    test('应该成功保存并返回带id的文档', () => {
      const doc = memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      
      expect(doc).toHaveProperty('id');
      expect(doc.name).toBe('Alice');
      expect(doc.age).toBe(25);
      expect(typeof doc.id).toBe('number');
    });

    test('应该自动生成唯一ID', () => {
      const doc1 = memoryStore.save(collectionName, { name: 'Alice' });
      const doc2 = memoryStore.save(collectionName, { name: 'Bob' });
      
      expect(doc1.id).not.toBe(doc2.id);
      expect(doc2.id).toBe(doc1.id + 1); // 自增ID
    });

    test('有id时应该更新文档', () => {
      const doc = memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      
      // 更新
      const updated = memoryStore.save(collectionName, { ...doc, age: 26 });
      
      expect(updated.id).toBe(doc.id);
      expect(updated.age).toBe(26);
      expect(memoryStore.count(collectionName)).toBe(1); // 只有一条记录
    });
  });

  describe('findOne()', () => {
    test('应该根据条件找到匹配文档', () => {
      memoryStore.save(collectionName, { name: 'Alice', email: 'alice@example.com' });
      memoryStore.save(collectionName, { name: 'Bob', email: 'bob@example.com' });
      
      const result = memoryStore.findOne(collectionName, { email: 'alice@example.com' });
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Alice');
    });

    test('未找到时应该返回null', () => {
      const result = memoryStore.findOne(collectionName, { email: 'nonexist@example.com' });
      expect(result).toBeNull();
    });

    test('应该支持多条件查询', () => {
      memoryStore.save(collectionName, { name: 'Alice', age: 25, city: 'NY' });
      memoryStore.save(collectionName, { name: 'Bob', age: 25, city: 'LA' });
      
      const result = memoryStore.findOne(collectionName, { age: 25, city: 'NY' });
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Alice');
    });
  });

  describe('find()', () => {
    test('应该返回所有匹配文档', () => {
      memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      memoryStore.save(collectionName, { name: 'Bob', age: 30 });
      memoryStore.save(collectionName, { name: 'Charlie', age: 25 });
      
      const results = memoryStore.find(collectionName, { age: 25 });
      
      expect(results).toHaveLength(2);
      expect(results.some(doc => doc.name === 'Alice')).toBe(true);
      expect(results.some(doc => doc.name === 'Charlie')).toBe(true);
    });

    test('无匹配时应该返回空数组', () => {
      const results = memoryStore.find(collectionName, { age: 99 });
      expect(results).toEqual([]);
    });

    test('应该支持排序（sort）', () => {
      memoryStore.save(collectionName, { name: 'Charlie', age: 30 });
      memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      memoryStore.save(collectionName, { name: 'Bob', age: 28 });
      
      const results = memoryStore.find(collectionName, {}, { sort: { age: 1 } });
      
      expect(results[0].name).toBe('Alice'); // age 25
      expect(results[1].name).toBe('Bob');   // age 28
      expect(results[2].name).toBe('Charlie'); // age 30
    });

    test('应该支持限制数量（limit）', () => {
      memoryStore.save(collectionName, { name: 'Alice' });
      memoryStore.save(collectionName, { name: 'Bob' });
      memoryStore.save(collectionName, { name: 'Charlie' });
      
      const results = memoryStore.find(collectionName, {}, { limit: 2 });
      
      expect(results).toHaveLength(2);
    });
  });

  describe('findById()', () => {
    test('应该根据id找到文档', () => {
      const doc = memoryStore.save(collectionName, { name: 'Alice' });
      const result = memoryStore.findById(collectionName, doc.id);
      
      expect(result).not.toBeNull();
      expect(result.name).toBe('Alice');
      expect(result.id).toBe(doc.id);
    });

    test('无效ID应该返回null', () => {
      const result = memoryStore.findById(collectionName, 9999);
      expect(result).toBeNull();
    });
  });

  describe('updateOne()', () => {
    test('应该更新文档并返回更新后的对象', () => {
      const doc = memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      
      const updated = memoryStore.updateOne(
        collectionName,
        { id: doc.id },
        { age: 26, city: 'NY' }
      );
      
      expect(updated).not.toBeNull();
      expect(updated.name).toBe('Alice'); // 旧字段保留
      expect(updated.age).toBe(26); // 更新字段
      expect(updated.city).toBe('NY'); // 新增字段
    });

    test('未找到文档时应该返回null', () => {
      const updated = memoryStore.updateOne(collectionName, { email: 'nonexist@example.com' }, { age: 30 });
      expect(updated).toBeNull();
    });
  });

  describe('deleteOne()', () => {
    test('应该删除匹配文档并返回true', () => {
      const doc = memoryStore.save(collectionName, { name: 'Alice' });
      
      const result = memoryStore.deleteOne(collectionName, { id: doc.id });
      
      expect(result).toBe(true);
      expect(memoryStore.findById(collectionName, doc.id)).toBeNull();
    });

    test('未找到文档时应该返回false', () => {
      const result = memoryStore.deleteOne(collectionName, { email: 'nonexist@example.com' });
      expect(result).toBe(false);
    });
  });

  describe('deleteMany()', () => {
    test('应该删除所有匹配文档并返回删除数量', () => {
      memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      memoryStore.save(collectionName, { name: 'Bob', age: 30 });
      memoryStore.save(collectionName, { name: 'Charlie', age: 25 });
      
      const deletedCount = memoryStore.deleteMany(collectionName, { age: 25 });
      
      expect(deletedCount).toBe(2);
      expect(memoryStore.count(collectionName)).toBe(1);
    });
  });

  describe('count()', () => {
    test('应该返回匹配文档数量', () => {
      memoryStore.save(collectionName, { name: 'Alice', age: 25 });
      memoryStore.save(collectionName, { name: 'Bob', age: 30 });
      memoryStore.save(collectionName, { name: 'Charlie', age: 25 });
      
      expect(memoryStore.count(collectionName, { age: 25 })).toBe(2);
      expect(memoryStore.count(collectionName, { age: 30 })).toBe(1);
      expect(memoryStore.count(collectionName, {})).toBe(3); // 全部
    });
  });

  describe('clear()', () => {
    test('应该清空集合', () => {
      memoryStore.save(collectionName, { name: 'Alice' });
      memoryStore.save(collectionName, { name: 'Bob' });
      
      memoryStore.clear(collectionName);
      
      expect(memoryStore.count(collectionName, {})).toBe(0);
    });

    test('清空后应该重置ID计数器', () => {
      memoryStore.save(collectionName, { name: 'Alice' });
      memoryStore.save(collectionName, { name: 'Bob' });
      memoryStore.clear(collectionName);
      
      const newDoc = memoryStore.save(collectionName, { name: 'Charlie' });
      expect(newDoc.id).toBe(1); // ID重新从1开始
    });
  });

  describe('clearAll()', () => {
    test('应该清空所有集合', () => {
      memoryStore.save('collection1', { name: 'Alice' });
      memoryStore.save('collection2', { name: 'Bob' });
      
      memoryStore.clearAll();
      
      expect(memoryStore.count('collection1')).toBe(0);
      expect(memoryStore.count('collection2')).toBe(0);
    });
  });
});
