# Quickstart: 跨平台系统适配增强

**Feature**: 009-cross-platform-support
**Date**: 2026-01-14

## 概述

本指南帮助开发者快速理解和实现跨平台系统适配功能。

## 支持的系统

| 发行版 | 最低版本 | 包管理器 |
|--------|----------|----------|
| Ubuntu | 22.04 | apt |
| Debian | 11 | apt |
| Kali | Rolling | apt |
| CentOS | 9 | dnf |
| AlmaLinux | 9 | dnf |
| Rocky Linux | 9 | dnf |
| Fedora | 39 | dnf |

## 核心模块

### 1. 系统检测模块

```bash
# scripts/lib/detect-os.sh
detect_os() {
    if [[ -e /etc/os-release ]]; then
        source /etc/os-release
        echo "$ID:$VERSION_ID"
    fi
}
```

### 2. 防火墙配置模块

```bash
# scripts/lib/firewall-config.sh
configure_firewall() {
    local port=$1
    if systemctl is-active --quiet firewalld; then
        firewall-cmd --add-port=$port/tcp --permanent
        firewall-cmd --reload
    else
        iptables -I INPUT -p tcp --dport $port -j ACCEPT
    fi
}
```

### 3. 网络检测模块

```bash
# scripts/lib/network-detect.sh
detect_ip() {
    ip -4 addr | grep inet | grep -vE '127\.' | awk '{print $2}' | cut -d/ -f1
}
```

## 开发流程

1. **实现系统检测** - `src/utils/os-detection.ts`
2. **实现防火墙适配** - `src/utils/firewall.ts`
3. **实现网络检测** - `src/utils/network.ts`
4. **更新安装脚本** - `scripts/install.sh`
5. **编写单元测试** - `tests/unit/`

## 测试验证

```bash
# 运行单元测试
npm test

# 在各发行版上手动测试
# Ubuntu: docker run -it ubuntu:22.04 bash
# CentOS: docker run -it centos:stream9 bash
```

## 关键文件

- `src/services/platform-detector.ts` - 平台检测服务
- `src/constants/supported-distros.ts` - 支持的发行版
- `scripts/install.sh` - 主安装脚本
- `scripts/lib/*.sh` - Bash 函数库
