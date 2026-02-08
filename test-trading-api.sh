#!/bin/bash

echo "=== 阶段4.2: 测试下单API ==="
echo ""

BASE_URL="http://localhost:3000/api"

# 1. 注册并登录获取token
echo "1. 注册新用户..."
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"trader_${TIMESTAMP}\",\"email\":\"trader${TIMESTAMP}@test.com\",\"password\":\"Test123\"}")

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "❌ 注册失败: $REGISTER_RESPONSE"
  exit 1
fi
echo "✅ 注册成功，获得token"
echo ""

# 2. 创建模拟盘账户
echo "2. 创建模拟盘账户..."
ACCOUNT_RESPONSE=$(curl -s -X POST "${BASE_URL}/trading/accounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{"initialBalance":100000}')

ACCOUNT_ID=$(echo $ACCOUNT_RESPONSE | grep -o '"accountId":"[^"]*' | cut -d'"' -f4)
if [ -z "$ACCOUNT_ID" ]; then
  echo "❌ 创建账户失败: $ACCOUNT_RESPONSE"
  exit 1
fi
echo "✅ 账户创建成功: $ACCOUNT_ID"
echo "$ACCOUNT_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$ACCOUNT_RESPONSE"
echo ""

# 3. 测试买入（做多）
echo "3. 测试买入（做多）AAPL 10股..."
BUY_RESPONSE=$(curl -s -X POST "${BASE_URL}/trading/orders/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"accountId\":\"${ACCOUNT_ID}\",\"symbol\":\"AAPL\",\"quantity\":10,\"orderType\":\"market\"}")

echo "$BUY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$BUY_RESPONSE"
if echo "$BUY_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 买入成功"
else
  echo "❌ 买入失败"
fi
echo ""

# 4. 测试卖出（做空）
echo "4. 测试卖出（做空）TSLA 5股..."
SELL_RESPONSE=$(curl -s -X POST "${BASE_URL}/trading/orders/sell" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"accountId\":\"${ACCOUNT_ID}\",\"symbol\":\"TSLA\",\"quantity\":5,\"orderType\":\"market\"}")

echo "$SELL_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SELL_RESPONSE"
if echo "$SELL_RESPONSE" | grep -q '"success":true'; then
  echo "✅ 卖出成功"
else
  echo "❌ 卖出失败"
fi
echo ""

# 5. 查询账户信息
echo "5. 查询账户信息..."
ACCOUNT_INFO=$(curl -s -X GET "${BASE_URL}/trading/accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$ACCOUNT_INFO" | python3 -m json.tool 2>/dev/null || echo "$ACCOUNT_INFO"
echo ""

# 6. 查询持仓
echo "6. 查询持仓..."
POSITIONS=$(curl -s -X GET "${BASE_URL}/trading/accounts/${ACCOUNT_ID}/positions" \
  -H "Authorization: Bearer ${TOKEN}")

echo "$POSITIONS" | python3 -m json.tool 2>/dev/null || echo "$POSITIONS"
echo ""

echo "========================================"
echo "✅ 阶段4.2 测试完成：下单API全面测试"
echo "========================================"
