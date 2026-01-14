#!/bin/bash
# package-manager.sh - Package manager abstraction functions
# Feature: 009-cross-platform-support

# Source OS detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/detect-os.sh"

# Install packages using the appropriate package manager
pkg_install() {
    local packages=("$@")

    case "$OS_PKG_MANAGER" in
        apt)
            apt-get update
            apt-get install -y "${packages[@]}"
            ;;
        dnf)
            dnf install -y "${packages[@]}"
            ;;
        *)
            echo "错误: 未知的包管理器: $OS_PKG_MANAGER"
            return 1
            ;;
    esac
}

# Update package cache
pkg_update() {
    case "$OS_PKG_MANAGER" in
        apt)
            apt-get update
            ;;
        dnf)
            dnf check-update || true
            ;;
    esac
}

# Check if a package is installed
pkg_is_installed() {
    local package="$1"

    case "$OS_PKG_MANAGER" in
        apt)
            dpkg -l "$package" 2>/dev/null | grep -q "^ii"
            ;;
        dnf)
            rpm -q "$package" &>/dev/null
            ;;
    esac
}

# Enable EPEL repository for RHEL-based systems
enable_epel() {
    if [[ "$OS_FAMILY_TYPE" != "rhel" ]]; then
        return 0
    fi

    # Fedora doesn't need EPEL
    if [[ "$OS_ID" == "fedora" ]]; then
        return 0
    fi

    echo "正在启用 EPEL 仓库..."
    if ! pkg_is_installed "epel-release"; then
        dnf install -y epel-release
    fi
}

# Install with retry mechanism (max 3 attempts)
pkg_install_with_retry() {
    local max_attempts=3
    local attempt=1
    local packages=("$@")

    while [[ $attempt -le $max_attempts ]]; do
        echo "安装尝试 $attempt/$max_attempts..."
        if pkg_install "${packages[@]}"; then
            return 0
        fi
        echo "安装失败，等待 5 秒后重试..."
        sleep 5
        ((attempt++))
    done

    echo "错误: 安装失败，已达到最大重试次数 ($max_attempts)"
    return 1
}
