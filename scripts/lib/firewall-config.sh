#!/bin/bash
# firewall-config.sh - Firewall configuration functions
# Feature: 009-cross-platform-support

# Global variables
FIREWALL_TYPE=""
FIREWALL_ACTIVE=false

# Detect firewall type
detect_firewall() {
    FIREWALL_TYPE="none"
    FIREWALL_ACTIVE=false

    # Check firewalld first (RHEL default)
    if command -v firewall-cmd &>/dev/null; then
        if systemctl is-active --quiet firewalld; then
            FIREWALL_TYPE="firewalld"
            FIREWALL_ACTIVE=true
            return
        fi
    fi

    # Check iptables
    if command -v iptables &>/dev/null; then
        FIREWALL_TYPE="iptables"
        FIREWALL_ACTIVE=true
    fi
}

# Configure firewalld
configure_firewalld() {
    local port="$1"
    local protocol="${2:-tcp}"

    echo "配置 firewalld 端口 $port/$protocol..."
    firewall-cmd --add-port="$port/$protocol" --permanent
    firewall-cmd --reload
}

# Configure iptables
configure_iptables() {
    local port="$1"
    local protocol="${2:-tcp}"

    echo "配置 iptables 端口 $port/$protocol..."
    iptables -I INPUT -p "$protocol" --dport "$port" -j ACCEPT

    # Save rules
    if command -v iptables-save &>/dev/null; then
        if [[ -d /etc/iptables ]]; then
            iptables-save > /etc/iptables/rules.v4
        elif [[ -f /etc/sysconfig/iptables ]]; then
            iptables-save > /etc/sysconfig/iptables
        fi
    fi
}

# Configure SELinux port policy
configure_selinux_port() {
    local port="$1"
    local protocol="${2:-tcp}"

    if command -v semanage &>/dev/null; then
        if sestatus 2>/dev/null | grep -q "SELinux status.*enabled"; then
            echo "配置 SELinux 端口策略..."
            semanage port -a -t http_port_t -p "$protocol" "$port" 2>/dev/null || true
        fi
    fi
}

# Main firewall configuration function
configure_firewall() {
    local port="$1"
    local protocol="${2:-tcp}"

    detect_firewall

    case "$FIREWALL_TYPE" in
        firewalld)
            configure_firewalld "$port" "$protocol"
            ;;
        iptables)
            configure_iptables "$port" "$protocol"
            ;;
        none)
            echo "未检测到防火墙，跳过配置"
            ;;
    esac

    # Configure SELinux if needed
    configure_selinux_port "$port" "$protocol"
}
