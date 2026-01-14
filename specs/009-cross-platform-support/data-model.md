# Data Model: 跨平台系统适配增强

**Feature**: 009-cross-platform-support
**Date**: 2026-01-14

## 实体定义

### 1. OperatingSystem (操作系统信息)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | ✓ | 发行版标识 (ubuntu/debian/centos/...) |
| name | string | ✓ | 发行版名称 |
| version | string | ✓ | 版本号 |
| versionId | string | ✓ | 数字版本标识 |
| family | enum | ✓ | 系统家族: debian \| rhel |
| packageManager | enum | ✓ | 包管理器: apt \| dnf |
| isSupported | boolean | ✓ | 是否支持 |
| minVersion | string | ✓ | 最低支持版本 |

### 2. FirewallConfig (防火墙配置)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | enum | ✓ | 防火墙类型: iptables \| firewalld \| none |
| isActive | boolean | ✓ | 是否运行中 |
| port | number | ✓ | VPN 端口 |
| protocol | enum | ✓ | 协议: tcp \| udp \| both |

### 3. NetworkConfig (网络配置)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| interfaces | Interface[] | ✓ | 网络接口列表 |
| selectedIp | string | ✓ | 选中的 IP 地址 |
| isNat | boolean | ✓ | 是否 NAT 环境 |
| publicIp | string | - | 公网 IP (NAT 时需要) |

### 4. Interface (网络接口)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✓ | 接口名称 (eth0/ens3/...) |
| ipv4 | string | - | IPv4 地址 |
| ipv6 | string | - | IPv6 地址 |
| isLoopback | boolean | ✓ | 是否回环接口 |

### 5. EnvironmentInfo (环境信息)

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| shell | string | ✓ | 当前 shell 类型 |
| isCompatibleShell | boolean | ✓ | shell 是否兼容 |
| containerType | enum | - | 容器类型: docker \| lxc \| openvz \| none |
| isContainer | boolean | ✓ | 是否容器环境 |
| selinuxStatus | enum | ✓ | SELinux: enforcing \| permissive \| disabled |
| virtualization | string | - | 虚拟化类型 |
| hasSystemd | boolean | ✓ | 是否有 systemd |

---

## 枚举定义

```typescript
enum OsFamily {
  DEBIAN = 'debian',
  RHEL = 'rhel'
}

enum PackageManager {
  APT = 'apt',
  DNF = 'dnf'
}

enum FirewallType {
  IPTABLES = 'iptables',
  FIREWALLD = 'firewalld',
  NONE = 'none'
}

enum ContainerType {
  DOCKER = 'docker',
  LXC = 'lxc',
  OPENVZ = 'openvz',
  NONE = 'none'
}

enum SelinuxStatus {
  ENFORCING = 'enforcing',
  PERMISSIVE = 'permissive',
  DISABLED = 'disabled'
}
```

---

## 常量定义

### 支持的发行版

```typescript
const SUPPORTED_DISTROS = {
  ubuntu: { family: 'debian', minVersion: '22.04', pkgManager: 'apt' },
  debian: { family: 'debian', minVersion: '11', pkgManager: 'apt' },
  kali: { family: 'debian', minVersion: '2023', pkgManager: 'apt' },
  centos: { family: 'rhel', minVersion: '9', pkgManager: 'dnf' },
  almalinux: { family: 'rhel', minVersion: '9', pkgManager: 'dnf' },
  rocky: { family: 'rhel', minVersion: '9', pkgManager: 'dnf' },
  fedora: { family: 'rhel', minVersion: '39', pkgManager: 'dnf' }
}
```

### 私有 IP 范围

```typescript
const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./
]
```

---

## 实体关系

```
┌─────────────────┐
│ EnvironmentInfo │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐     1:1     ┌─────────────────┐
│ OperatingSystem │◄───────────►│  FirewallConfig │
└────────┬────────┘             └─────────────────┘
         │ 1:1
         ▼
┌─────────────────┐     1:N     ┌─────────────────┐
│  NetworkConfig  │◄───────────►│    Interface    │
└─────────────────┘             └─────────────────┘
```

---

## 状态转换

### 安装流程状态

```
[初始化] → [环境检测] → [系统验证] → [网络配置] → [防火墙配置] → [安装完成]
    │           │            │            │             │
    ▼           ▼            ▼            ▼             ▼
  失败:      失败:        失败:        失败:         失败:
  退出      不兼容shell   不支持系统   无可用IP     配置错误
```
