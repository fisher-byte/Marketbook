#!/bin/bash

# 测试交易记录和持仓聚合功能
API_BASE="http://localhost:3000/api"

echo "🚀 开始测试交易记录和持仓聚合功能..."
echo ""

# 1. 注册用户
echo "============================================================"
echo "1️⃣  注册新用户"
echo "============================================================"
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser_${TIMESTAMP}\",
    \"email\": \"test_${TIMESTAMP}@example.com\",
    \"password\": \"Test123\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ 注册失败，退出测试"
  exit 1
fi

echo "✅ 注册成功，Token: ${TOKEN:0:20}..."
echo ""
sleep 1

# 2. 创建模拟盘账户
echo "============================================================"
echo "2️⃣  创建模拟盘账户"
echo "============================================================"
ACCOUNT_RESPONSE=$(curl -s -X POST "${API_BASE}/trading/accounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "initialBalance": 100000 }')

echo "$ACCOUNT_RESPONSE" | jq '.'
ACCOUNT_ID=$(echo "$ACCOUNT_RESPONSE" | jq -r '.data.accountId')

if [ "$ACCOUNT_ID" = "null" ] || [ -z "$ACCOUNT_ID" ]; then
  echo "❌ 创建账户失败，退出测试"
  exit 1
fi

echo "✅ 账户创建成功，ID: $ACCOUNT_ID"
echo ""
sleep 1

# 3. 执行多笔买入交易
echo "============================================================"
echo "3️⃣  执行多笔买入交易"
echo "============================================================"

echo "买入 AAPL x10 @ \$150"
curl -s -X POST "${API_BASE}/trading/orders/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"symbol\": \"AAPL\",
    \"quantity\": 10,
    \"price\": 150
  }" | jq '.data.account.availableBalance as $bal | "余额: $\($bal)"'

sleep 0.5

echo "买入 GOOGL x5 @ \$120"
curl -s -X POST "${API_BASE}/trading/orders/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"symbol\": \"GOOGL\",
    \"quantity\": 5,
    \"price\": 120
  }" | jq '.data.account.availableBalance as $bal | "余额: $\($bal)"'

sleep 0.5

echo "买入 AAPL x5 @ \$155"
curl -s -X POST "${API_BASE}/trading/orders/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"symbol\": \"AAPL\",
    \"quantity\": 5,
    \"price\": 155
  }" | jq '.data.account.availableBalance as $bal | "余额: $\($bal)"'

sleep 0.5

echo "买入 TSLA x8 @ \$200"
curl -s -X POST "${API_BASE}/trading/orders/buy" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"symbol\": \"TSLA\",
    \"quantity\": 8,
    \"price\": 200
  }" | jq '.data.account.availableBalance as $bal | "余额: $\($bal)"'

echo "✅ 买入交易完成"
echo ""
sleep 1

# 4. 卖出部分股票
echo "============================================================"
echo "4️⃣  卖出部分股票"
echo "============================================================"
echo "卖出 AAPL x5 @ \$160"
SELL_RESPONSE=$(curl -s -X POST "${API_BASE}/trading/orders/sell" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"accountId\": \"$ACCOUNT_ID\",
    \"symbol\": \"AAPL\",
    \"quantity\": 5,
    \"price\": 160
  }")

echo "$SELL_RESPONSE" | jq '.'
echo "✅ 卖出交易完成"
echo ""
sleep 1

# 5. 查看持仓信息（重点）
echo "============================================================"
echo "5️⃣  查看持仓信息 (重点测试)"
echo "============================================================"
POSITIONS=$(curl -s -X GET "${API_BASE}/trading/accounts/${ACCOUNT_ID}/positions" \
  -H "Authorization: Bearer $TOKEN")

echo "$POSITIONS" | jq '.'

echo ""
echo "📊 持仓摘要:"
echo "$POSITIONS" | jq -r '.data[] | "  \(.symbol): \(.quantity)股 | 成本:\(.avgCost) | 盈亏:\(.profitLoss) (\(.profitLossPercentage)%)"'
echo ""
sleep 1

# 6. 查看交易历史（重点）
echo "============================================================"
echo "6️⃣  查看交易历史 (重点测试)"
echo "============================================================"
HISTORY=$(curl -s -X GET "${API_BASE}/trading/accounts/${ACCOUNT_ID}/history?limit=20" \
  -H "Authorization: Bearer $TOKEN")

echo "$HISTORY" | jq '.'

echo ""
echo "📋 交易记录摘要:"
echo "$HISTORY" | jq -r '.data.trades[] | "\(.action | if . == "buy" then "买入" else "卖出" end) \(.symbol) x\(.quantity) @ $\(.price) = $\(.totalAmount)"'
echo ""
sleep 1

# 7. 查看账户信息
echo "============================================================"
echo "7️⃣  查看账户信息 (验证余额)"
echo "============================================================"
ACCOUNT_INFO=$(curl -s -X GET "${API_BASE}/trading/accounts/${ACCOUNT_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo "$ACCOUNT_INFO" | jq '.'

echo ""
echo "💰 余额信息:"
echo "$ACCOUNT_INFO" | jq -r '.data | "  初始资金: $\(.initialBalance)\n  当前余额: $\(.currentBalance)\n  可用余额: $\(.availableBalance)"'
echo ""

echo "============================================================"
echo "✨ 测试完成！"
echo "============================================================"
