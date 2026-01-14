# Implementation Plan: 跨平台系统适配增强

**Branch**: `009-cross-platform-support` | **Date**: 2026-01-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-cross-platform-support/spec.md`

## Summary

扩展 Xray-VPN-OneClick 项目的系统兼容性，借鉴 Nyr/openvpn-install 的跨平台适配技术，支持 RHEL 系列（CentOS 9+、AlmaLinux 9+、Rocky Linux 9+）和 Fedora 39+ 系统。核心技术方案包括：智能系统检测、包管理器适配（apt/dnf）、防火墙自动配置（iptables/firewalld）、网络接口检测、容器环境适配。

## Technical Context

**Language/Version**: TypeScript 5.x (CLI), Bash 4.0+ (安装脚本)
**Primary Dependencies**: Node.js 18+, @inquirer/prompts, commander, chalk
**Storage**: 文件系统 (/etc/xray/, /usr/local/etc/xray/)
**Testing**: Vitest (单元测试), 手动测试 (多发行版验证)
**Target Platform**: Linux x86_64 (Ubuntu 22.04+, Debian 11+, CentOS 9+, AlmaLinux 9+, Rocky Linux 9+, Fedora 39+, Kali)
**Project Type**: CLI 工具 + Bash 安装脚本
**Performance Goals**: 系统检测 <10秒, 完整安装 <5分钟
**Constraints**: 需要 root 权限, 需要 systemd, 需要网络连接
**Scale/Scope**: 单服务器部署, 支持 7 种 Linux 发行版

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 模块化设计 | ✅ Pass | 系统检测、防火墙配置、网络检测作为独立模块 |
| 测试优先 | ✅ Pass | 每个发行版需独立测试验证 |
| 简洁性 | ✅ Pass | 借鉴成熟方案，避免过度工程 |
| 可观测性 | ✅ Pass | 清晰的错误信息和日志输出 |

**Gate Result**: ✅ PASS - 无违规项，可继续规划

## Project Structure

### Documentation (this feature)

```text
specs/009-cross-platform-support/
├── spec.md              # 功能规范
├── plan.md              # 本文件
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
└── tasks.md             # Phase 2 任务列表
```

### Source Code (repository root)

```text
src/
├── services/
│   └── platform-detector.ts    # 新增：平台检测服务
├── utils/
│   ├── os-detection.ts         # 新增：操作系统检测
│   ├── firewall.ts             # 新增：防火墙配置
│   └── network.ts              # 新增：网络接口检测
├── types/
│   └── platform.ts             # 新增：平台相关类型定义
└── constants/
    └── supported-distros.ts    # 新增：支持的发行版常量

scripts/
├── install.sh                  # 修改：增强跨平台支持
└── lib/
    ├── detect-os.sh            # 新增：系统检测函数
    ├── firewall-config.sh      # 新增：防火墙配置函数
    └── network-detect.sh       # 新增：网络检测函数

tests/
├── unit/
│   ├── os-detection.test.ts    # 新增：系统检测测试
│   └── firewall.test.ts        # 新增：防火墙配置测试
└── fixtures/
    └── os-release-samples/     # 新增：各发行版样本文件
```

**Structure Decision**: 采用单项目结构，新增平台检测模块和 Bash 脚本库

## Complexity Tracking

> 无违规项，无需记录复杂性权衡。
