# Feature Specification: 跨平台系统适配增强

**Feature Branch**: `009-cross-platform-support`
**Created**: 2026-01-14
**Status**: Draft
**Input**: 增强跨平台系统适配性，借鉴 Nyr/openvpn-install 项目的精华，支持多种 Linux 发行版

## Clarifications

### Session 2026-01-14

- Q: 容器环境支持策略？ → A: 警告继续 - 显示警告信息但允许用户选择继续安装
- Q: Xray 安装脚本失败处理？ → A: 重试选项 - 提示用户可选择重试（最多3次）或退出

## 概述

当前 Xray-VPN-OneClick 项目仅支持 Debian/Ubuntu/Kali Linux 系统。本功能将借鉴 Nyr/openvpn-install 项目的跨平台适配技术，扩展支持更多 Linux 发行版，包括 CentOS、AlmaLinux、Rocky Linux、Fedora 等 RHEL 系列系统。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - RHEL 系列系统安装 (Priority: P1)

作为使用 CentOS/AlmaLinux/Rocky Linux 服务器的系统管理员，我希望能够一键安装 Xray VPN 服务，就像在 Ubuntu 上一样简单。

**Why this priority**: RHEL 系列是企业服务器最常用的 Linux 发行版，支持这些系统将大幅扩展项目的用户群体。

**Independent Test**: 在全新的 CentOS 9 系统上运行安装脚本，验证 Xray 服务成功安装并运行。

**Acceptance Scenarios**:

1. **Given** 一台全新的 CentOS 9 服务器，**When** 用户以 root 权限运行安装脚本，**Then** 系统自动检测为 CentOS，使用 dnf 安装依赖，成功部署 Xray 服务
2. **Given** 一台 AlmaLinux 9 服务器，**When** 用户运行安装脚本，**Then** 系统正确识别为 RHEL 兼容系统并完成安装
3. **Given** 一台 Rocky Linux 9 服务器，**When** 用户运行安装脚本，**Then** 系统正确识别并完成安装

---

### User Story 2 - 智能系统检测与错误提示 (Priority: P1)

作为用户，当我在不支持的系统上运行安装脚本时，我希望得到清晰的错误提示，告诉我哪些系统是支持的。

**Why this priority**: 良好的错误处理是用户体验的基础，避免用户在不兼容系统上浪费时间。

**Independent Test**: 在不支持的系统（如 Arch Linux）上运行脚本，验证显示友好的错误信息。

**Acceptance Scenarios**:

1. **Given** 一台不支持的 Linux 发行版，**When** 用户运行安装脚本，**Then** 显示清晰的错误信息，列出所有支持的系统
2. **Given** 一台支持但版本过低的系统，**When** 用户运行安装脚本，**Then** 提示最低版本要求

---

### User Story 3 - Fedora 系统安装 (Priority: P2)

作为 Fedora 用户，我希望能够在我的 Fedora 服务器上安装 Xray VPN。

**Why this priority**: Fedora 是流行的前沿 Linux 发行版，支持它可以覆盖追求新技术的用户群体。

**Independent Test**: 在 Fedora 最新版本上运行安装脚本，验证服务正常工作。

**Acceptance Scenarios**:

1. **Given** 一台 Fedora 39+ 服务器，**When** 用户运行安装脚本，**Then** 系统检测为 Fedora 并使用 dnf 完成安装

---

### User Story 4 - 防火墙自动配置 (Priority: P2)

作为系统管理员，我希望安装脚本能够自动配置防火墙规则，无论系统使用 iptables 还是 firewalld。

**Why this priority**: 防火墙配置是 VPN 部署的关键步骤，自动化可以减少配置错误。

**Independent Test**: 在使用 firewalld 的 CentOS 和使用 iptables 的 Ubuntu 上分别测试。

**Acceptance Scenarios**:

1. **Given** 一台使用 firewalld 的 CentOS 服务器，**When** 安装完成，**Then** VPN 端口在 firewalld 中正确开放
2. **Given** 一台使用 iptables 的 Ubuntu 服务器，**When** 安装完成，**Then** iptables 规则正确配置

---

### User Story 5 - 网络接口智能检测 (Priority: P3)

作为拥有多个网络接口的服务器管理员，我希望安装脚本能够智能检测并让我选择正确的网络接口。

**Why this priority**: 多网卡服务器场景常见，正确的接口选择确保 VPN 可访问性。

**Independent Test**: 在多网卡服务器上运行安装，验证能够列出并选择网络接口。

**Acceptance Scenarios**:

1. **Given** 一台只有单个公网 IP 的服务器，**When** 运行安装脚本，**Then** 自动使用该 IP 地址
2. **Given** 一台有多个 IP 地址的服务器，**When** 运行安装脚本，**Then** 提示用户选择要使用的 IP 地址

---

### Edge Cases

- 系统使用非标准 shell（如 dash）时如何处理？
- 在容器环境（Docker/LXC）中运行时如何检测并适配？
- SELinux 启用时如何处理权限问题？
- 系统 PATH 环境变量不包含 sbin 目录时如何处理？
- 在 OpenVZ 虚拟化环境中如何适配 iptables？

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须支持检测以下 Linux 发行版：Ubuntu 22.04+、Debian 11+、Kali Linux、CentOS 9+、AlmaLinux 9+、Rocky Linux 9+、Fedora 39+
- **FR-002**: 系统必须通过读取 `/etc/os-release` 等系统文件自动识别操作系统类型和版本
- **FR-003**: 系统必须根据检测到的发行版自动选择正确的包管理器（apt/dnf）
- **FR-004**: 系统必须在不支持的系统上显示清晰的错误信息，列出所有支持的发行版
- **FR-005**: 系统必须检测并适配不同的防火墙系统（iptables/firewalld）
- **FR-006**: 系统必须自动检测服务器的公网 IP 地址
- **FR-007**: 当服务器有多个 IP 地址时，系统必须提供交互式选择界面
- **FR-008**: 系统必须检测 shell 类型，拒绝在不兼容的 shell（如 dash）中运行
- **FR-009**: 系统必须检测容器环境，显示警告信息但允许用户选择继续安装，并自动应用容器特定配置（如 iptables-legacy）
- **FR-010**: 系统必须处理 SELinux 启用时的权限配置
- **FR-011**: 系统必须确保 PATH 环境变量包含必要的 sbin 目录
- **FR-012**: 对于 RHEL 系列系统，必须自动启用 EPEL 仓库（如需要）
- **FR-013**: 当 Xray 安装脚本下载或执行失败时，系统必须提供重试选项（最多3次），用户可选择重试或退出

### Key Entities

- **操作系统配置**: 发行版名称、版本号、包管理器类型、防火墙类型
- **网络配置**: IP 地址列表、选中的 IP、是否为 NAT 环境
- **环境检测结果**: shell 类型、是否容器环境、SELinux 状态、虚拟化类型

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在 6 种主要 Linux 发行版上成功完成一键安装
- **SC-002**: 系统检测和环境适配过程在 10 秒内完成
- **SC-003**: 95% 的用户在首次尝试时成功完成安装
- **SC-004**: 不支持的系统上显示的错误信息清晰度达到用户可理解标准
- **SC-005**: 防火墙自动配置成功率达到 99%
- **SC-006**: 多网卡环境下 IP 选择界面响应时间小于 2 秒

## Assumptions

- 目标服务器具有稳定的互联网连接
- 用户具有 root 或 sudo 权限
- 系统已安装基本的网络工具（curl 或 wget）
- 服务器使用 systemd 作为服务管理器
- 目标系统为 64 位架构

## Out of Scope

- macOS 和 Windows 系统支持
- 非 systemd 的 init 系统（如 SysVinit、OpenRC）
- ARM 架构支持（可作为后续功能）
- 图形界面安装程序
