#!/bin/bash
# network-detect.sh - Network interface detection functions
# Feature: 009-cross-platform-support

# Global variables
NETWORK_IPS=()
SELECTED_IP=""
IS_NAT=false
PUBLIC_IP=""

# Detect all non-loopback IPv4 addresses
detect_ip_addresses() {
    NETWORK_IPS=()

    local ips
    ips=$(ip -4 addr | grep inet | grep -vE '127\.' | awk '{print $2}' | cut -d/ -f1)

    while IFS= read -r ip; do
        [[ -n "$ip" ]] && NETWORK_IPS+=("$ip")
    done <<< "$ips"
}

# Check if IP is private (NAT)
is_private_ip() {
    local ip="$1"
    if echo "$ip" | grep -qE '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)'; then
        return 0
    fi
    return 1
}

# Interactive IP selection for multiple IPs
select_ip_interactive() {
    local ip_count=${#NETWORK_IPS[@]}

    if [[ $ip_count -eq 0 ]]; then
        echo "错误: 未检测到可用的 IP 地址"
        return 1
    elif [[ $ip_count -eq 1 ]]; then
        SELECTED_IP="${NETWORK_IPS[0]}"
        echo "检测到 IP: $SELECTED_IP"
    else
        echo "检测到多个 IP 地址:"
        local i=1
        for ip in "${NETWORK_IPS[@]}"; do
            echo "  $i) $ip"
            ((i++))
        done
        echo ""
        read -p "请选择 IP [1-$ip_count]: " choice
        if [[ "$choice" =~ ^[0-9]+$ ]] && \
           [[ "$choice" -ge 1 ]] && \
           [[ "$choice" -le $ip_count ]]; then
            SELECTED_IP="${NETWORK_IPS[$((choice-1))]}"
        else
            SELECTED_IP="${NETWORK_IPS[0]}"
            echo "无效选择，使用默认: $SELECTED_IP"
        fi
    fi
}

# Check NAT and prompt for public IP
check_nat_environment() {
    IS_NAT=false
    PUBLIC_IP=""

    if is_private_ip "$SELECTED_IP"; then
        IS_NAT=true
        echo ""
        echo "检测到 NAT 环境 (私有 IP: $SELECTED_IP)"
        read -p "请输入公网 IP 地址: " PUBLIC_IP
        if [[ -z "$PUBLIC_IP" ]]; then
            echo "警告: 未提供公网 IP"
        fi
    fi
}
