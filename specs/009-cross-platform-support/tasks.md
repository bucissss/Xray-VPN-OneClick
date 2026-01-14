# Tasks: 跨平台系统适配增强

**Input**: Design documents from `/specs/009-cross-platform-support/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: 未明确要求 TDD，测试任务为可选。

**Organization**: 任务按用户故事组织，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事 (US1, US2, US3, US4, US5)
- 描述中包含确切文件路径

---

## Phase 1: Setup (项目初始化)

**Purpose**: 创建基础项目结构和类型定义

- [x] T001 创建 Bash 脚本库目录结构 `scripts/lib/`
- [x] T002 [P] 创建平台相关类型定义 `src/types/platform.ts`
- [x] T003 [P] 创建支持的发行版常量 `src/constants/supported-distros.ts`
- [x] T004 [P] 创建测试 fixtures 目录 `tests/fixtures/os-release-samples/`

**Checkpoint**: ✅ 基础结构就绪，可开始基础模块开发

---

## Phase 2: Foundational (核心基础模块)

**Purpose**: 所有用户故事依赖的核心检测模块

**⚠️ CRITICAL**: 用户故事实现前必须完成此阶段

- [x] T005 实现操作系统检测函数 `scripts/lib/detect-os.sh`
- [x] T006 [P] 实现 TypeScript 系统检测工具 `src/utils/os-detection.ts`
- [x] T007 [P] 创建各发行版 os-release 样本文件 `tests/fixtures/os-release-samples/*.txt`
- [x] T008 实现环境检测（shell/容器/SELinux）`scripts/lib/detect-env.sh`
- [x] T009 实现 PATH 环境变量修复逻辑 `scripts/lib/detect-os.sh`

**Checkpoint**: ✅ 基础检测模块就绪，用户故事可并行开始

---

## Phase 3: User Story 1 - RHEL 系列系统安装 (Priority: P1) 🎯 MVP

**Goal**: 支持 CentOS 9+、AlmaLinux 9+、Rocky Linux 9+ 一键安装

**Independent Test**: 在 CentOS 9 系统上运行安装脚本，验证 Xray 服务成功部署

### Implementation for User Story 1

- [x] T010 [P] [US1] 添加 RHEL 系列发行版检测逻辑 `scripts/lib/detect-os.sh`
- [x] T011 [P] [US1] 实现 dnf 包管理器安装函数 `scripts/lib/package-manager.sh`
- [x] T012 [US1] 实现 EPEL 仓库自动启用 `scripts/lib/package-manager.sh`
- [x] T013 [US1] 更新安装脚本支持 RHEL 系列 `scripts/install.sh`
- [x] T014 [US1] 实现安装失败重试机制（最多3次）`scripts/install.sh`
- [x] T015 [US1] 添加 RHEL 系列到 TypeScript 常量 `src/constants/supported-distros.ts`

**Checkpoint**: ✅ RHEL 系列系统可成功安装 Xray

---

## Phase 4: User Story 2 - 智能系统检测与错误提示 (Priority: P1)

**Goal**: 不支持的系统显示清晰错误信息，列出支持的发行版

**Independent Test**: 在 Arch Linux 上运行脚本，验证显示友好错误信息

### Implementation for User Story 2

- [x] T016 [P] [US2] 实现版本比较函数 `scripts/lib/detect-os.sh`
- [x] T017 [US2] 实现不支持系统的错误提示 `scripts/lib/detect-os.sh`
- [x] T018 [US2] 实现版本过低的错误提示 `scripts/lib/detect-os.sh`
- [x] T019 [US2] 添加 shell 不兼容检测和提示 `scripts/install.sh`
- [x] T020 [US2] 实现容器环境警告提示 `scripts/install.sh`

**Checkpoint**: ✅ 错误提示清晰，用户体验良好

---

## Phase 5: User Story 3 - Fedora 系统安装 (Priority: P2)

**Goal**: 支持 Fedora 39+ 一键安装

**Independent Test**: 在 Fedora 39 上运行安装脚本，验证服务正常工作

### Implementation for User Story 3

- [x] T021 [P] [US3] 添加 Fedora 发行版检测逻辑 `scripts/lib/detect-os.sh`
- [x] T022 [US3] 更新安装脚本支持 Fedora `scripts/install.sh`
- [x] T023 [US3] 添加 Fedora 到 TypeScript 常量 `src/constants/supported-distros.ts`

**Checkpoint**: ✅ Fedora 系统可成功安装 Xray

---

## Phase 6: User Story 4 - 防火墙自动配置 (Priority: P2)

**Goal**: 自动检测并配置 iptables 或 firewalld

**Independent Test**: 在 CentOS (firewalld) 和 Ubuntu (iptables) 上验证端口正确开放

### Implementation for User Story 4

- [x] T024 [P] [US4] 实现防火墙类型检测函数 `scripts/lib/firewall-config.sh`
- [x] T025 [P] [US4] 实现 firewalld 配置函数 `scripts/lib/firewall-config.sh`
- [x] T026 [P] [US4] 实现 iptables 配置函数 `scripts/lib/firewall-config.sh`
- [x] T027 [US4] 实现 SELinux 端口策略配置 `scripts/lib/firewall-config.sh`
- [x] T028 [US4] 集成防火墙配置到安装脚本 `scripts/install.sh`
- [x] T029 [P] [US4] 实现 TypeScript 防火墙工具 `src/utils/firewall.ts`

**Checkpoint**: ✅ 防火墙自动配置正常工作

---

## Phase 7: User Story 5 - 网络接口智能检测 (Priority: P3)

**Goal**: 智能检测 IP 地址，多 IP 时提供选择界面

**Independent Test**: 在多网卡服务器上验证 IP 选择功能

### Implementation for User Story 5

- [x] T030 [P] [US5] 实现 IP 地址检测函数 `scripts/lib/network-detect.sh`
- [x] T031 [US5] 实现多 IP 交互选择界面 `scripts/lib/network-detect.sh`
- [x] T032 [US5] 实现 NAT 环境检测和公网 IP 输入 `scripts/lib/network-detect.sh`
- [x] T033 [US5] 集成网络检测到安装脚本 `scripts/install.sh`
- [x] T034 [P] [US5] 实现 TypeScript 网络检测工具 `src/utils/network.ts`

**Checkpoint**: ✅ 网络接口检测和选择正常工作

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 整合、优化和文档更新

- [x] T035 [P] 实现平台检测服务整合 `src/services/platform-detector.ts`
- [x] T036 [P] 更新 README 添加支持的系统列表 `README.md`
- [x] T037 代码清理和注释完善 `scripts/install.sh`
- [x] T038 [P] 添加单元测试 `tests/unit/os-detection.test.ts`
- [x] T039 运行 quickstart.md 验证流程

**Checkpoint**: ✅ 所有任务完成

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - 阻塞所有用户故事
- **User Stories (Phase 3-7)**: 依赖 Foundational 完成后可并行开始
- **Polish (Phase 8)**: 依赖所有用户故事完成

### User Story Dependencies

| User Story | 依赖 | 可并行 |
|------------|------|--------|
| US1 (RHEL 安装) | Phase 2 | ✅ 可独立开始 |
| US2 (错误提示) | Phase 2 | ✅ 可独立开始 |
| US3 (Fedora) | Phase 2, 复用 US1 的 dnf 逻辑 | ⚠️ 建议在 US1 后 |
| US4 (防火墙) | Phase 2 | ✅ 可独立开始 |
| US5 (网络检测) | Phase 2 | ✅ 可独立开始 |

### Within Each User Story

1. Bash 脚本函数先于集成
2. 集成到 install.sh 最后
3. TypeScript 工具可并行开发

---

## Parallel Opportunities

### Phase 1 并行任务
```
T002, T003, T004 可同时执行（不同文件）
```

### Phase 2 并行任务
```
T006, T007 可同时执行（不同文件）
```

### User Story 并行
```
US1, US2, US4, US5 可同时由不同开发者执行
US3 建议在 US1 完成后执行（复用 dnf 逻辑）
```

---

## Implementation Strategy

### MVP First (仅 User Story 1)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: Foundational (关键阻塞)
3. 完成 Phase 3: User Story 1 (RHEL 支持)
4. **停止并验证**: 在 CentOS 9 上测试安装
5. 可部署/演示 MVP

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. + US1 (RHEL) → 测试 → 部署 (MVP!)
3. + US2 (错误提示) → 测试 → 部署
4. + US3 (Fedora) → 测试 → 部署
5. + US4 (防火墙) → 测试 → 部署
6. + US5 (网络检测) → 测试 → 部署
7. Polish → 最终发布

### Parallel Team Strategy

多开发者场景：

1. 团队共同完成 Setup + Foundational
2. Foundational 完成后：
   - 开发者 A: US1 (RHEL) + US3 (Fedora)
   - 开发者 B: US2 (错误提示) + US4 (防火墙)
   - 开发者 C: US5 (网络检测)
3. 各故事独立完成和集成

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射到具体用户故事
- 每个用户故事可独立完成和测试
- 每个任务或逻辑组完成后提交
- 在任何 Checkpoint 停止验证故事独立性
- 避免：模糊任务、同文件冲突、破坏独立性的跨故事依赖
