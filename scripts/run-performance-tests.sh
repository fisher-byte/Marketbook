#!/bin/bash

# MarketBook 性能测试运行脚本
# 使用 Artillery 进行负载测试、压力测试和耐久性测试

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
SERVER_URL="${SERVER_URL:-http://localhost:3000}"
RESULTS_DIR="./tests/performance/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 创建结果目录
mkdir -p "$RESULTS_DIR"

# 打印彩色消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查服务器是否运行
check_server() {
    print_info "检查服务器状态: $SERVER_URL"
    
    if ! curl -s -f "$SERVER_URL/health" > /dev/null 2>&1; then
        print_error "服务器未运行或不可访问: $SERVER_URL"
        print_info "请先启动服务器: npm start"
        exit 1
    fi
    
    print_success "服务器正在运行"
}

# 运行负载测试
run_load_test() {
    print_info "=========================================="
    print_info "运行负载测试（Load Test）"
    print_info "=========================================="
    
    local config="./tests/performance/load-test.yml"
    local output="$RESULTS_DIR/load-test-$TIMESTAMP"
    
    artillery run "$config" \
        --target "$SERVER_URL" \
        --output "$output.json" \
        | tee "$output.log"
    
    # 生成HTML报告
    if [ -f "$output.json" ]; then
        artillery report "$output.json" --output "$output.html"
        print_success "负载测试完成"
        print_info "JSON结果: $output.json"
        print_info "日志文件: $output.log"
        print_info "HTML报告: $output.html"
    else
        print_error "负载测试失败"
        return 1
    fi
}

# 运行压力测试
run_stress_test() {
    print_info "=========================================="
    print_info "运行压力测试（Stress Test）"
    print_info "=========================================="
    
    local config="./tests/performance/stress-test.yml"
    local output="$RESULTS_DIR/stress-test-$TIMESTAMP"
    
    artillery run "$config" \
        --target "$SERVER_URL" \
        --output "$output.json" \
        | tee "$output.log"
    
    # 生成HTML报告
    if [ -f "$output.json" ]; then
        artillery report "$output.json" --output "$output.html"
        print_success "压力测试完成"
        print_info "JSON结果: $output.json"
        print_info "日志文件: $output.log"
        print_info "HTML报告: $output.html"
    else
        print_error "压力测试失败"
        return 1
    fi
}

# 运行耐久性测试
run_endurance_test() {
    print_info "=========================================="
    print_info "运行耐久性测试（Endurance Test）"
    print_info "=========================================="
    print_warning "耐久性测试将持续1小时，请确保有足够时间"
    
    local config="./tests/performance/endurance-test.yml"
    local output="$RESULTS_DIR/endurance-test-$TIMESTAMP"
    
    artillery run "$config" \
        --target "$SERVER_URL" \
        --output "$output.json" \
        | tee "$output.log"
    
    # 生成HTML报告
    if [ -f "$output.json" ]; then
        artillery report "$output.json" --output "$output.html"
        print_success "耐久性测试完成"
        print_info "JSON结果: $output.json"
        print_info "日志文件: $output.log"
        print_info "HTML报告: $output.html"
    else
        print_error "耐久性测试失败"
        return 1
    fi
}

# 运行快速测试（仅负载测试）
run_quick_test() {
    print_info "=========================================="
    print_info "运行快速测试（仅负载测试，简化版）"
    print_info "=========================================="
    
    local output="$RESULTS_DIR/quick-test-$TIMESTAMP"
    
    artillery quick \
        --count 10 \
        --num 20 \
        "$SERVER_URL/health" \
        | tee "$output.log"
    
    print_success "快速测试完成"
}

# 生成性能报告摘要
generate_summary() {
    print_info "=========================================="
    print_info "生成性能报告摘要"
    print_info "=========================================="
    
    local summary_file="$RESULTS_DIR/summary-$TIMESTAMP.txt"
    
    {
        echo "MarketBook 性能测试摘要"
        echo "========================"
        echo "测试时间: $(date)"
        echo "服务器地址: $SERVER_URL"
        echo ""
        echo "测试结果:"
        echo "--------"
        
        for log in "$RESULTS_DIR"/*-"$TIMESTAMP".log; do
            if [ -f "$log" ]; then
                echo ""
                echo "测试: $(basename "$log" .log)"
                echo "---"
                
                # 提取关键指标
                grep -E "(http.response_time|scenarios.completed|http.request_rate)" "$log" || echo "无可用指标"
            fi
        done
    } | tee "$summary_file"
    
    print_success "摘要已保存到: $summary_file"
}

# 清理旧结果
cleanup_old_results() {
    print_info "清理7天前的测试结果..."
    
    find "$RESULTS_DIR" -type f -mtime +7 -delete
    
    print_success "清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
MarketBook 性能测试脚本

用法: $0 [选项]

选项:
    -l, --load          运行负载测试（默认）
    -s, --stress        运行压力测试
    -e, --endurance     运行耐久性测试（1小时）
    -q, --quick         运行快速测试
    -a, --all           运行所有测试（不包括耐久性测试）
    -f, --full          运行完整测试（包括耐久性测试）
    -c, --cleanup       清理旧测试结果
    -h, --help          显示此帮助信息

环境变量:
    SERVER_URL          服务器地址（默认: http://localhost:3000）

示例:
    # 运行负载测试
    $0 --load
    
    # 运行压力测试
    $0 --stress
    
    # 运行所有测试（不包括耐久性测试）
    $0 --all
    
    # 使用自定义服务器地址
    SERVER_URL=http://example.com:3000 $0 --load
    
    # 清理旧结果
    $0 --cleanup

结果位置:
    $RESULTS_DIR/
    
    每次测试生成:
    - JSON结果文件（.json）
    - 日志文件（.log）
    - HTML报告（.html）

EOF
}

# 主逻辑
main() {
    # 解析参数
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    case "$1" in
        -l|--load)
            check_server
            run_load_test
            generate_summary
            ;;
        -s|--stress)
            check_server
            run_stress_test
            generate_summary
            ;;
        -e|--endurance)
            check_server
            run_endurance_test
            generate_summary
            ;;
        -q|--quick)
            check_server
            run_quick_test
            ;;
        -a|--all)
            check_server
            run_load_test
            echo ""
            run_stress_test
            generate_summary
            ;;
        -f|--full)
            check_server
            run_load_test
            echo ""
            run_stress_test
            echo ""
            run_endurance_test
            generate_summary
            ;;
        -c|--cleanup)
            cleanup_old_results
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"
