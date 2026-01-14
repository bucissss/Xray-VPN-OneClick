# Research: 跨平台系统适配增强

**Feature**: 009-cross-platform-support
**Date**: 2026-01-14

## 研究概述

本研究基于 [Nyr/openvpn-install](https://github.com/Nyr/openvpn-install) 项目的跨平台适配技术，分析其核心实现方案并确定本项目的技术选型。

---

## 1. 操作系统检测机制

### Decision: 分层文件检测 + /etc/os-release 解析

### Rationale
Nyr/openvpn-install 采用分层检测策略，按优先级检查系统文件：
1. `/etc/os-release` - 标准化的发行版信息文件（优先）
2. `/etc/debian_version` - Debian 系特有
3. `/etc/almalinux-release`, `/etc/rocky-release`, `/etc/centos-release` - RHEL 系特有
4. `/etc/fedora-release` - Fedora 特有

这种方法可靠处理发行版重叠（如 AlmaLinux/Rocky 替代 CentOS）。

### Alternatives Considered
| 方案 | 优点 | 缺点 |
|------|------|------|
| 仅 /etc/os-release | 简单统一 | 部分旧系统不支持 |
| lsb_release 命令 | 标准化 | 需额外安装，不可靠 |
| uname 命令 | 通用 | 只能获取内核信息，无发行版详情 |

### Implementation Notes
```bash
# 检测优先级
if [[ -e /etc/os-release ]]; then
    source /etc/os-release
    os=$ID
    os_version=$VERSION_ID
elif [[ -e /etc/almalinux-release ]]; then
    os="almalinux"
elif [[ -e /etc/rocky-release ]]; then
    os="rocky"
elif [[ -e /etc/centos-release ]]; then
    os="centos"
fi
```

---

## 2. 包管理器适配

### Decision: 基于发行版自动选择 apt/dnf

### Rationale
- Debian/Ubuntu/Kali → `apt-get`
- CentOS/AlmaLinux/Rocky/Fedora → `dnf`

Nyr 脚本根据检测到的 `$os` 变量自动选择包管理器，���需用户干预。

### Alternatives Considered
| 方案 | 优点 | 缺点 |
|------|------|------|
| 检测可用命令 | 更灵活 | 可能误判（如同时存在 apt 和 dnf） |
| 用户手动选择 | 最准确 | 用户体验差 |
| 基于发行版映射 | 可靠、简单 | 需维护映射表 |

### Implementation Notes
```bash
case $os in
    ubuntu|debian|kali)
        pkg_manager="apt-get"
        pkg_install="apt-get install -y"
        ;;
    centos|almalinux|rocky|fedora)
        pkg_manager="dnf"
        pkg_install="dnf install -y"
        ;;
esac
```

---

## 3. 防火墙配置策略

### Decision: 检测 firewalld/iptables 并分别配置

### Rationale
- RHEL 系默认使用 `firewalld`
- Debian 系默认使用 `iptables`
- 需要检测实际运行的防火墙服务，而非仅检测安装

### Alternatives Considered
| 方案 | 优点 | 缺点 |
|------|------|------|
| 仅支持 iptables | 实现简单 | RHEL 系需额外配置 |
| 仅支持 firewalld | 现代化 | Debian 系不默认安装 |
| 双重支持 + 自动检测 | 最佳兼容性 | 实现复杂度增加 |

### Implementation Notes
```bash
# firewalld 配置
if systemctl is-active --quiet firewalld; then
    firewall-cmd --add-port=$port/tcp --permanent
    firewall-cmd --add-port=$port/udp --permanent
    firewall-cmd --reload
fi

# iptables 配置
if ! systemctl is-active --quiet firewalld; then
    iptables -I INPUT -p tcp --dport $port -j ACCEPT
    iptables -I INPUT -p udp --dport $port -j ACCEPT
fi
```

---

## 4. 网络接口检测

### Decision: 使用 ip 命令检测，支持多 IP 选择

### Rationale
Nyr 脚本使用 `ip -4 addr` 获取 IPv4 地址列表，过滤本地回环，单 IP 自动选择，多 IP 提示用户。

### Alternatives Considered
| 方案 | 优点 | 缺点 |
|------|------|------|
| ifconfig | 传统兼容 | 已废弃，部分系统未安装 |
| ip 命令 | 现代标准 | 输出解析稍复杂 |
| hostname -I | 简单 | 不提供接口信息 |

### Implementation Notes
```bash
# 获取非回环 IPv4 地址
ip_list=$(ip -4 addr | grep inet | grep -vE '127\.' | awk '{print $2}' | cut -d/ -f1)
ip_count=$(echo "$ip_list" | wc -l)

if [[ $ip_count -eq 1 ]]; then
    server_ip=$ip_list
else
    # 提示用户选择
    select ip in $ip_list; do
        server_ip=$ip
        break
    done
fi
```

---

## 5. NAT 环境检测

### Decision: 检测私有 IP 范围，提示输入公网 IP

### Rationale
当检测到服务器 IP 为私有地址（10.x, 172.16-31.x, 192.168.x）时，说明服务器位于 NAT 后，需要用户提供公网 IP。

### Implementation Notes
```bash
# 检测 NAT 环境
if echo "$server_ip" | grep -qE '^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)'; then
    echo "检测到 NAT 环境，请输入公网 IP："
    read -r public_ip
fi
```

---

## 6. 容器环境检测与适配

### Decision: 检测容器类型，警告但允许继续，应用特定配置

### Rationale
- 检测 `/proc/1/environ` 或 `/.dockerenv` 判断 Docker
- 检测 `/proc/1/cgroup` 判断 LXC/OpenVZ
- OpenVZ 环境需使用 `iptables-legacy`

### Implementation Notes
```bash
# 容器检测
if [[ -f /.dockerenv ]] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    container="docker"
elif grep -q lxc /proc/1/cgroup 2>/dev/null; then
    container="lxc"
elif [[ -d /proc/vz ]]; then
    container="openvz"
fi

if [[ -n $container ]]; then
    echo "警告：检测到容器环境 ($container)，VPN 功能可能受限"
    read -p "是否继续？[y/N] " continue_install
fi
```

---

## 7. SELinux 处理

### Decision: 检测 SELinux 状态，必要时配置端口策略

### Rationale
RHEL 系默认启用 SELinux，自定义端口需要 `semanage` 配置。

### Implementation Notes
```bash
if sestatus 2>/dev/null | grep -q "SELinux status.*enabled"; then
    if [[ $port != 443 ]]; then
        semanage port -a -t http_port_t -p tcp $port 2>/dev/null || true
    fi
fi
```

---

## 8. Shell 兼容性

### Decision: 强制 Bash，拒绝 dash 等不兼容 shell

### Rationale
脚本使用 Bash 特性（数组、`[[`、`source` 等），dash 不支持。

### Implementation Notes
```bash
if readlink /proc/$$/exe | grep -q "dash"; then
    echo "错误：请使用 bash 运行此脚本"
    echo "使用命令: bash $0"
    exit 1
fi
```

---

## 9. PATH 环境变量修复

### Decision: 自动添加 sbin 目录到 PATH

### Rationale
部分系统（尤其是非 root 用户 sudo 时）PATH 不包含 `/sbin` 和 `/usr/sbin`，导致命令找不到。

### Implementation Notes
```bash
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

---

## 10. EPEL 仓库启用

### Decision: CentOS/AlmaLinux/Rocky 自动启用 EPEL

### Rationale
部分依赖包（如 openvpn）在 RHEL 系需要 EPEL 仓库。

### Implementation Notes
```bash
if [[ $os == "centos" || $os == "almalinux" || $os == "rocky" ]]; then
    dnf install -y epel-release
fi
```

---

## 支持的发行版矩阵

| 发行版 | 最低版本 | 包管理器 | 默认防火墙 | 特殊处理 |
|--------|----------|----------|------------|----------|
| Ubuntu | 22.04 | apt | iptables | - |
| Debian | 11 | apt | iptables | - |
| Kali | Rolling | apt | iptables | - |
| CentOS | 9 | dnf | firewalld | EPEL |
| AlmaLinux | 9 | dnf | firewalld | EPEL |
| Rocky Linux | 9 | dnf | firewalld | EPEL |
| Fedora | 39 | dnf | firewalld | - |

---

## 参考资料

- [Nyr/openvpn-install](https://github.com/Nyr/openvpn-install) - 主要参考项目
- [XTLS/Xray-install](https://github.com/XTLS/Xray-install) - Xray 官方安装脚本
- [Freedesktop os-release 规范](https://www.freedesktop.org/software/systemd/man/os-release.html)
