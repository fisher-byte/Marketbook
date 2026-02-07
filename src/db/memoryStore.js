/**
 * 内存存储 - Memory Store
 * 用于开发阶段的数据持久化，无需依赖数据库
 * 
 * @module memoryStore
 */

class MemoryStore {
    constructor() {
        // 各个集合的内存存储
        this.collections = {
            users: new Map(),
            userProfiles: new Map(),
            tradingAccounts: new Map(),
            tradingRecords: new Map(),
            // 可扩展其他集合
        };
        
        // 自增ID计数器
        this.idCounters = {
            users: 1,
            userProfiles: 1,
            tradingAccounts: 1,
            tradingRecords: 1,
        };
    }

    /**
     * 获取集合
     * @param {string} collectionName 集合名称
     * @returns {Map} 集合Map对象
     */
    getCollection(collectionName) {
        if (!this.collections[collectionName]) {
            this.collections[collectionName] = new Map();
            this.idCounters[collectionName] = 1;
        }
        return this.collections[collectionName];
    }

    /**
     * 生成新ID
     * @param {string} collectionName 集合名称
     * @returns {number} 新ID
     */
    generateId(collectionName) {
        if (!this.idCounters[collectionName]) {
            this.idCounters[collectionName] = 1;
        }
        return this.idCounters[collectionName]++;
    }

    /**
     * 保存文档
     * @param {string} collectionName 集合名称
     * @param {object} document 文档对象
     * @returns {object} 保存后的文档（包含ID）
     */
    save(collectionName, document) {
        const collection = this.getCollection(collectionName);
        
        // 如果没有ID，生成一个
        if (!document.id) {
            document.id = this.generateId(collectionName);
        }
        
        // 添加/更新时间戳
        const now = new Date();
        if (!document.createdAt) {
            document.createdAt = now;
        }
        document.updatedAt = now;
        
        // 保存到Map
        collection.set(document.id, { ...document });
        
        return { ...document };
    }

    /**
     * 根据ID查找文档
     * @param {string} collectionName 集合名称
     * @param {number} id 文档ID
     * @returns {object|null} 找到的文档或null
     */
    findById(collectionName, id) {
        const collection = this.getCollection(collectionName);
        const document = collection.get(id);
        return document ? { ...document } : null;
    }

    /**
     * 根据条件查找单个文档
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @returns {object|null} 找到的文档或null
     */
    findOne(collectionName, query) {
        const collection = this.getCollection(collectionName);
        
        for (const [id, document] of collection.entries()) {
            // 检查是否匹配所有查询条件
            const matches = Object.keys(query).every(key => {
                // 支持深度比较
                if (typeof query[key] === 'object' && query[key] !== null) {
                    return JSON.stringify(document[key]) === JSON.stringify(query[key]);
                }
                return document[key] === query[key];
            });
            
            if (matches) {
                return { ...document };
            }
        }
        
        return null;
    }

    /**
     * 根据条件查找多个文档
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @param {object} options 查询选项 {limit, skip, sort}
     * @returns {array} 找到的文档数组
     */
    find(collectionName, query = {}, options = {}) {
        const collection = this.getCollection(collectionName);
        let results = [];
        
        for (const [id, document] of collection.entries()) {
            // 如果没有查询条件，返回所有
            if (Object.keys(query).length === 0) {
                results.push({ ...document });
                continue;
            }
            
            // 检查是否匹配所有查询条件
            const matches = Object.keys(query).every(key => {
                if (typeof query[key] === 'object' && query[key] !== null) {
                    return JSON.stringify(document[key]) === JSON.stringify(query[key]);
                }
                return document[key] === query[key];
            });
            
            if (matches) {
                results.push({ ...document });
            }
        }
        
        // 排序
        if (options.sort) {
            const sortKey = Object.keys(options.sort)[0];
            const sortOrder = options.sort[sortKey]; // 1 for asc, -1 for desc
            results.sort((a, b) => {
                if (a[sortKey] < b[sortKey]) return sortOrder === 1 ? -1 : 1;
                if (a[sortKey] > b[sortKey]) return sortOrder === 1 ? 1 : -1;
                return 0;
            });
        }
        
        // 跳过
        if (options.skip) {
            results = results.slice(options.skip);
        }
        
        // 限制
        if (options.limit) {
            results = results.slice(0, options.limit);
        }
        
        return results;
    }

    /**
     * 更新文档
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @param {object} update 更新内容
     * @returns {object|null} 更新后的文档或null
     */
    updateOne(collectionName, query, update) {
        const document = this.findOne(collectionName, query);
        if (!document) {
            return null;
        }
        
        // 合并更新
        const updated = {
            ...document,
            ...update,
            updatedAt: new Date(),
        };
        
        // 保存更新
        const collection = this.getCollection(collectionName);
        collection.set(document.id, updated);
        
        return { ...updated };
    }

    /**
     * 删除文档
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @returns {boolean} 是否删除成功
     */
    deleteOne(collectionName, query) {
        const document = this.findOne(collectionName, query);
        if (!document) {
            return false;
        }
        
        const collection = this.getCollection(collectionName);
        return collection.delete(document.id);
    }

    /**
     * 删除多个文档
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @returns {number} 删除的文档数量
     */
    deleteMany(collectionName, query) {
        const documents = this.find(collectionName, query);
        const collection = this.getCollection(collectionName);
        
        let deletedCount = 0;
        documents.forEach(doc => {
            if (collection.delete(doc.id)) {
                deletedCount++;
            }
        });
        
        return deletedCount;
    }

    /**
     * 统计文档数量
     * @param {string} collectionName 集合名称
     * @param {object} query 查询条件
     * @returns {number} 文档数量
     */
    count(collectionName, query = {}) {
        return this.find(collectionName, query).length;
    }

    /**
     * 清空集合
     * @param {string} collectionName 集合名称
     */
    clear(collectionName) {
        const collection = this.getCollection(collectionName);
        collection.clear();
        this.idCounters[collectionName] = 1;
    }

    /**
     * 清空所有集合
     */
    clearAll() {
        Object.keys(this.collections).forEach(collectionName => {
            this.clear(collectionName);
        });
    }
}

// 创建单例实例
const memoryStore = new MemoryStore();

module.exports = memoryStore;
