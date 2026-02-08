/**
 * errorHandler 中间件单元测试
 * 测试统一错误处理中间件
 */

const { ApiError, asyncHandler, validate, createError } = require('../../src/middlewares/errorHandler');

describe('errorHandler Middleware', () => {
  describe('ApiError Class', () => {
    test('应能创建标准API错误', () => {
      const error = new ApiError(400, '输入验证失败', 'VALIDATION_ERROR');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('输入验证失败');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    test('应设置默认type为general', () => {
      const error = new ApiError(500, '内部错误');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('general'); // 默认type
    });

    test('应正确设置所有字段', () => {
      const error1 = new ApiError(400, 'Message 1', 'type1');
      const error2 = new ApiError(500, 'Message 2', 'type2');
      
      expect(error1.statusCode).toBe(400);
      expect(error1.message).toBe('Message 1');
      expect(error1.type).toBe('type1');
      
      expect(error2.statusCode).toBe(500);
      expect(error2.message).toBe('Message 2');
      expect(error2.type).toBe('type2');
    });

    test('应支持details参数', () => {
      const error = new ApiError(400, 'Test', 'validation', { field: 'email' });
      
      expect(error.details).toEqual({ field: 'email' });
      expect(error.isOperational).toBe(true);
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
  });

  describe('validate Utility', () => {
    describe('validate.required', () => {
      test('非空值应通过验证', () => {
        expect(() => validate.required({ field: 'test' }, ['field'])).not.toThrow();
        expect(() => validate.required({ num: 123 }, ['num'])).not.toThrow();
        expect(() => validate.required({ bool: true }, ['bool'])).not.toThrow();
        expect(() => validate.required({ arr: [] }, ['arr'])).not.toThrow();
      });

      test('空值应抛出错误', () => {
        expect(() => validate.required({}, ['field'])).toThrow(ApiError);
        expect(() => validate.required({ field: null }, ['field'])).toThrow(ApiError);
        expect(() => validate.required({ field: undefined }, ['field'])).toThrow(ApiError);
        expect(() => validate.required({ field: '' }, ['field'])).toThrow(ApiError);
      });

      test('错误应包含缺失字段列表', () => {
        try {
          validate.required({}, ['username', 'email']);
        } catch (error) {
          expect(error.message).toContain('缺少必需参数');
          expect(error.type).toBe('validation');
          expect(error.statusCode).toBe(400);
          expect(error.details.missingFields).toEqual(['username', 'email']);
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
        expect(() => validate.number(NaN, 'field')).toThrow(ApiError);
        expect(() => validate.number({}, 'field')).toThrow(ApiError);
      });

      test('字符串数字应通过验证', () => {
        expect(() => validate.number('123', 'field')).not.toThrow();
        expect(() => validate.number('3.14', 'field')).not.toThrow();
      });

      test('应验证最小值', () => {
        expect(() => validate.number(5, 'field', { min: 10 })).toThrow(ApiError);
        expect(() => validate.number(10, 'field', { min: 10 })).not.toThrow();
      });

      test('应验证最大值', () => {
        expect(() => validate.number(15, 'field', { max: 10 })).toThrow(ApiError);
        expect(() => validate.number(10, 'field', { max: 10 })).not.toThrow();
      });
    });

    describe('validate.string', () => {
      test('有效字符串应通过验证', () => {
        expect(() => validate.string('hello', 'field')).not.toThrow();
        expect(() => validate.string('a', 'field')).not.toThrow();
      });

      test('非字符串应抛出错误', () => {
        expect(() => validate.string(123, 'field')).toThrow(ApiError);
        expect(() => validate.string(null, 'field')).toThrow(ApiError);
        expect(() => validate.string(undefined, 'field')).toThrow(ApiError);
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

      test('错误信息应包含允许的值（details中）', () => {
        try {
          validate.enum('yellow', 'color', ['red', 'green', 'blue']);
        } catch (error) {
          expect(error.message).toContain('color值无效');
          expect(error.type).toBe('validation');
          expect(error.details.allowedValues).toEqual(['red', 'green', 'blue']);
        }
      });
    });
  });

  describe('createError Factory', () => {
    test('应创建badRequest错误', () => {
      const error = createError.badRequest('无效输入');
      expect(error.statusCode).toBe(400);
      expect(error.type).toBe('validation');
      expect(error.message).toBe('无效输入');
    });

    test('应创建unauthorized错误', () => {
      const error = createError.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe('authentication');
    });

    test('应创建forbidden错误', () => {
      const error = createError.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.type).toBe('authorization');
    });

    test('应创建notFound错误', () => {
      const error = createError.notFound('用户');
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe('not_found');
      expect(error.message).toBe('用户不存在');
    });

    test('应创建conflict错误', () => {
      const error = createError.conflict('资源冲突');
      expect(error.statusCode).toBe(409);
      expect(error.type).toBe('conflict');
    });

    test('应创建tooManyRequests错误', () => {
      const error = createError.tooManyRequests();
      expect(error.statusCode).toBe(429);
      expect(error.type).toBe('rate_limit');
    });

    test('应创建internal错误', () => {
      const error = createError.internal();
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('internal');
    });
  });

  describe('Integration', () => {
    test('asyncHandler + validate应正确协作', async () => {
      const mockReq = { body: {} };
      const mockRes = {};
      const mockNext = jest.fn();
      
      const handler = asyncHandler(async (req, res) => {
        validate.required(req.body, ['username']);
      });
      
      await handler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(ApiError);
      expect(mockNext.mock.calls[0][0].type).toBe('validation');
    });

    test('validate + createError应正确协作', () => {
      const data = { email: 'test@example.com' };
      
      expect(() => {
        validate.required(data, ['username']);
      }).toThrow(ApiError);
      
      expect(() => {
        validate.required(data, ['email']);
      }).not.toThrow();
    });
  });
});
