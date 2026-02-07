/**
 * Leaderboard 模型 - 交易排行榜系统
 * 提供用户交易表现排名和竞争功能
 */

class Leaderboard {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.name = data.name || '默认排行榜';
        this.type = data.type || 'total_profit'; // 排名类型: total_profit, win_rate, sharpe_ratio, etc.
        this.period = data.period || 'all_time'; // 时间周期: daily, weekly, monthly, all_time
        this.startDate = data.startDate || new Date();
        this.endDate = data.endDate || null;
        this.isActive = data.isActive !== undefined ? data.isActive : true;
        this.maxParticipants = data.maxParticipants || 1000;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        
        // 排行榜数据
        this.entries = data.entries || [];
        this.totalEntries = data.totalEntries || 0;
        this.lastUpdateTime = data.lastUpdateTime || new Date();
    }
    
    /**
     * 生成唯一ID
     */
    generateId() {
        return 'LB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * 添加或更新排行榜条目
     * @param {Object} entry 用户交易数据
     */
    addEntry(entry) {
        const existingIndex = this.entries.findIndex(e => e.userId === entry.userId);
        
        if (existingIndex >= 0) {
            // 更新现有条目
            this.entries[existingIndex] = {
                ...this.entries[existingIndex],
                ...entry,
                updatedAt: new Date()
            };
        } else {
            // 添加新条目
            this.entries.push({
                ...entry,
                rank: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            this.totalEntries++;
        }
        
        this.updatedAt = new Date();
        this.lastUpdateTime = new Date();
    }
    
    /**
     * 根据排名类型排序排行榜
     */
    sortByType() {
        const sortFunctions = {
            'total_profit': (a, b) => b.totalProfit - a.totalProfit,
            'win_rate': (a, b) => b.winRate - a.winRate,
            'sharpe_ratio': (a, b) => b.sharpeRatio - a.sharpeRatio,
            'total_trades': (a, b) => b.totalTrades - a.totalTrades,
            'account_growth': (a, b) => b.accountGrowth - a.accountGrowth
        };
        
        const sortFunction = sortFunctions[this.type] || sortFunctions.total_profit;
        this.entries.sort(sortFunction);
        
        // 更新排名
        this.entries.forEach((entry, index) => {
            entry.rank = index + 1;
        });
    }
    
    /**
     * 获取排行榜前N名
     * @param {number} limit 限制数量
     * @returns {Array} 排名列表
     */
    getTopRankings(limit = 10) {
        this.sortByType();
        return this.entries.slice(0, limit);
    }
    
    /**
     * 获取用户排名
     * @param {string} userId 用户ID
     * @returns {Object} 用户排名信息
     */
    getUserRank(userId) {
        this.sortByType();
        const entry = this.entries.find(e => e.userId === userId);
        return entry ? {
            rank: entry.rank,
            totalRankings: this.entries.length,
            data: entry
        } : null;
    }
    
    /**
     * 过滤特定时间周期的数据
     * @param {Date} startDate 开始时间
     * @param {Date} endDate 结束时间
     */
    filterByPeriod(startDate, endDate) {
        return this.entries.filter(entry => {
            const entryDate = new Date(entry.updatedAt);
            return entryDate >= startDate && entryDate <= endDate;
        });
    }
    
    /**
     * 计算排行榜统计信息
     */
    getStatistics() {
        if (this.entries.length === 0) {
            return null;
        }
        
        const values = this.entries.map(entry => {
            switch (this.type) {
                case 'total_profit': return entry.totalProfit;
                case 'win_rate': return entry.winRate;
                case 'sharpe_ratio': return entry.sharpeRatio;
                case 'total_trades': return entry.totalTrades;
                case 'account_growth': return entry.accountGrowth;
                default: return entry.totalProfit;
            }
        });
        
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        
        return {
            average: avg,
            maximum: max,
            minimum: min,
            totalParticipants: this.entries.length,
            lastUpdate: this.lastUpdateTime
        };
    }
    
    /**
     * 清理过期数据
     * @param {number} maxAgeDays 最大保留天数
     */
    cleanupOldData(maxAgeDays = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
        
        this.entries = this.entries.filter(entry => 
            new Date(entry.updatedAt) > cutoffDate
        );
        
        this.totalEntries = this.entries.length;
        this.updatedAt = new Date();
    }
    
    /**
     * 导出排行榜数据
     */
    exportData() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            period: this.period,
            startDate: this.startDate,
            endDate: this.endDate,
            isActive: this.isActive,
            totalEntries: this.totalEntries,
            lastUpdateTime: this.lastUpdateTime,
            entries: this.entries,
            statistics: this.getStatistics()
        };
    }
    
    /**
     * 转换为JSON格式
     */
    toJSON() {
        return this.exportData();
    }
}

module.exports = Leaderboard;