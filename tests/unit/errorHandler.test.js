/**
 * errorHandler 中间件单元测试
 * 测试统一错误处理中间件
 */

const { ApiError, asyncHandler, validate } = require('../../src/middlewares/errorHandler');

describe('errorHandler Middleware', () => {
  describe('ApiError Class', () => {
    test('应能创建标准API错误', () => {
      const error = new ApiError('VALIDATION_ERROR', '输入验证失败', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('输入验证失败');
      expect(error.statusCode).toBe(400);
      expect(error.errorId).toMatch(/^err_[a-z0-9]{16}$/);
    });

    test('应设置默认状态码为500', () => {
      const error = new ApiError('INTERNAL_ERROR', '内部错误');
      expect(error.statusCode).toBe(500);
    });

    test('应自动生成唯一errorId', () => {
      const error1 = new ApiError('ERROR_1', 'Message 1');
      const error2 = new ApiError('ERROR_2', 'Message 2');
      
      expect(error1.errorId).not.toBe(error2.errorId);
      expect(error1.errorId.length).toBe(20); // "err_" + 16 chars
    });

    test('errorId应为16位随机字符串', () => {
      const error = new ApiError('TEST_ERROR', 'Test');
      const idPart = error.errorId.replace('err_', '');
      
      expect(idPart.length).toBe(16);
      expect(idPart).toMatch(/^[a-z0-9]{16}$/);
    });
  });

  describe('asyncHandler Wrapper', () => {
    test('应正确处理成功的异步函数', async () => {
      const mockReq = {};
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();
      
      const handler = asyncHandler(async (req, res) => {
        res.json({ success: true });
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('应捕获异步函数中的错误并传递给next', async () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const testError = new Error('Test error');
      
      const handler = asyncHandler(async (req, res) => {
        throw testError;
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    test('应捕获Promise rejection', async () => {
      const mockReq = {};
      const mockRes = {};
      const mockNext = jest.fn();
      
      const handler = asyncHandler(async (req, res) => {
        await Promise.reject(new Error('Promise rejected'));
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0].message).toBe('Promise rejected');
    });
  });

  describe('validate Utility', () => {
    describe('validate.required', () => {
      test('非空值应通过验证', () => {
        expect(() => validate.required('test', 'field')).not.toThrow();
        expect(() => validate.required(123, 'number')).not.toThrow();
        expect(() => validate.required(true, 'boolean')).not.toThrow();
        expect(() => validate.required([], 'array')).not.toThrow();
      });

      test('空值应抛出错误', () => {
        expect(() => validate.required(null, 'field')).toThrow(ApiError);
        expect(() => validate.required(undefined, 'field')).toThrow(ApiError);
        expect(() => validate.required('', 'field')).toThrow(ApiError);
      });

      test('错误应包含字段名', () => {
        try {
          validate.required(null, 'username');
        } catch (error) {
          expect(error.message).toContain('username');
          expect(error.type).toBe('VALIDATION_ERROR');
          expect(error.statusCode).toBe(400);
        }
      });
    });

    describe('validate.number', () => {
      test('有效数字应通过验证', () => {
        expect(() => validate.number(123, 'field')).not.toThrow();
        expect(() => validate.number(0, 'field')).not.toThrow();
        expect(() => validate.number(-5, 'field')).not.toThrow();
        expect(() => validate.number(3.14, 'field')).not.toThrow();
      });

      test('非数字应抛出错误', () => {
        expect(() => validate.number('abc', 'field')).toThrow(ApiError);
        expect(() => validate.number(null, 'field')).toThrow(ApiError);
        expect(() => validate.number(undefined, 'field')).toThrow(ApiError);
        expect(() => validate.number(NaN, 'field')).toThrow(ApiError);
      });

      test('字符串数字应通过验证', () => {
        expect(() => validate.number('123', 'field')).not.toThrow();
        expect(() => validate.number('3.14', 'field')).not.toThrow();
      });
    });

    describe('validate.string', () => {
      test('有效字符串应通过验证', () => {
        expect(() => validate.string('hello', 'field')).not.toThrow();
        expect(() => validate.string('', 'field', { allowEmpty: true })).not.toThrow();
      });

      test('非字符串应抛出错误', () => {
        expect(() => validate.string(123, 'field')).toThrow(ApiError);
        expect(() => validate.string(null, 'field')).toThrow(ApiError);
        expect(() => validate.string(undefined, 'field')).toThrow(ApiError);
      });

      test('空字符串默认不通过验证', () => {
        expect(() => validate.string('', 'field')).toThrow(ApiError);
      });

      test('应验证最小长度', () => {
        expect(() => validate.string('ab', 'field', { minLength: 3 })).toThrow(ApiError);
        expect(() => validate.string('abc', 'field', { minLength: 3 })).not.toThrow();
      });

      test('应验证最大长度', () => {
        expect(() => validate.string('12345', 'field', { maxLength: 4 })).toThrow(ApiError);
        expect(() => validate.string('1234', 'field', { maxLength: 4 })).not.toThrow();
      });
    });

    describe('validate.enum', () => {
      test('有效枚举值应通过验证', () => {
        expect(() => validate.enum('red', 'color', ['red', 'green', 'blue'])).not.toThrow();
      });

      test('无效枚举值应抛出错误', () => {
        expect(() => validate.enum('yellow', 'color', ['red', 'green', 'blue'])).toThrow(ApiError);
      });

      test('错误信息应包含允许的值', () => {
        try {
          validate.enum('yellow', 'color', ['red', 'green', 'blue']);
        } catch (error) {
          expect(error.message).toContain('red');
          expect(error.message).toContain('green');
          expect(error.message).toContain('blue');
        }
      });
    });

    describe('validate.email', () => {
      test('有效邮箱应通过验证', () => {
        expect(() => validate.email('test@example.com', 'email')).not.toThrow();
        expect(() => validate.email('user.name+tag@example.co.uk', 'email')).not.toThrow();
      });

      test('无效邮箱应抛出错误', () => {
        expect(() => validate.email('invalid', 'email')).toThrow(ApiError);
        expect(() => validate.email('test@', 'email')).toThrow(ApiError);
        expect(() => validate.email('@example.com', 'email')).toThrow(ApiError);
        expect(() => validate.email('test @example.com', 'email')).toThrow(ApiError);
      });
    });

    describe('validate.positive', () => {
      test('正数应通过验证', () => {
        expect(() => validate.positive(1, 'field')).not.toThrow();
        expect(() => validate.positive(100.5, 'field')).not.toThrow();
      });

      test('零和负数应抛出错误', () => {
        expect(() => validate.positive(0, 'field')).toThrow(ApiError);
        expect(() => validate.positive(-1, 'field')).toThrow(ApiError);
      });
    });

    describe('validate.array', () => {
      test('数组应通过验证', () => {
        expect(() => validate.array([], 'field')).not.toThrow();
        expect(() => validate.array([1, 2, 3], 'field')).not.toThrow();
      });

      test('非数组应抛出错误', () => {
        expect(() => validate.array('not array', 'field')).toThrow(ApiError);
        expect(() => validate.array(123, 'field')).toThrow(ApiError);
        expect(() => validate.array(null, 'field')).toThrow(ApiError);
      });

      test('应验证最小长度', () => {
        expect(() => validate.array([1], 'field', { minLength: 2 })).toThrow(ApiError);
        expect(() => validate.array([1, 2], 'field', { minLength: 2 })).not.toThrow();
      });

      test('应验证最大长度', () => {
        expect(() => validate.array([1, 2, 3], 'field', { maxLength: 2 })).toThrow(ApiError);
        expect(() => validate.array([1, 2], 'field', { maxLength: 2 })).not.toThrow();
      });
    });
  });

  describe('Error ID Generation', () => {
    test('每个错误应有唯一ID', () => {
      const ids = new Set();
      
      for (let i = 0; i < 100; i++) {
        const error = new ApiError('TEST_ERROR', 'Test');
        ids.add(error.errorId);
      }
      
      expect(ids.size).toBe(100); // 所有ID应唯一
    });
  });

  describe('Integration', () => {
    test('asyncHandler + validate应正确协作', async () => {
      const mockReq = { body: { username: null } };
      const mockRes = {};
      const mockNext = jest.fn();
      
      const handler = asyncHandler(async (req, res) => {
        validate.required(req.body.username, 'username');
        res.json({ success: true });
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ApiError);
      expect(mockNext.mock.calls[0][0].type).toBe('VALIDATION_ERROR');
    });
  });
});
