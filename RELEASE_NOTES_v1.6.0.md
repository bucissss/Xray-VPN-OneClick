# 🚀 v1.6.0 - Stats API 自动配置 & 社区优化

> **一键启用流量统计，告别手动配置的痛苦！**

---

## ✨ 亮点功能

### 📊 Stats API 自动配置（Feature 011）

还在为配置 Xray 流量统计而头疼吗？v1.6.0 带来了**全自动 Stats API 配置**功能！

```bash
xray-manager
# 选择「配置 Stats API」即可一键启用
```

**核心能力：**

| 功能 | 说明 |
|------|------|
| 🔍 **智能检测** | 自动检测当前配置状态，识别缺失组件 |
| ⚡ **一键配置** | 自动添加 stats、api、policy、routing 配置 |
| 🔌 **端口智能选择** | 自动检测可用端口，避免冲突 |
| 💾 **安全备份** | 配置前自动备份，失败自动回滚 |
| ✅ **配置验证** | 配置后自动验证服务状态 |

**自动配置的组件：**

```json
{
  "stats": {},
  "api": {
    "tag": "api",
    "services": ["StatsService", "HandlerService", "LoggerService"]
  },
  "policy": {
    "levels": { "0": { "statsUserUplink": true, "statsUserDownlink": true } },
    "system": { "statsInboundUplink": true, "statsInboundDownlink": true, "statsOutboundUplink": true, "statsOutboundDownlink": true }
  }
}
```

---

### 🌐 社区优化

本次更新还带来了全面的社区体验优化：

- **📋 Issue 模板** - Bug 报告 & 功能建议标准化模板
- **📝 PR 模板** - 规范化贡献流程
- **💬 Discussions** - 启用 GitHub 讨论区
- **🏷️ Good First Issues** - 4 个新手友好任务等你认领！

---

## 📦 安装 / 升级

```bash
# 全新安装
npm install -g xray-manager

# 升级到最新版
npm update -g xray-manager

# 验证版本
xray-manager --version
```

---

## 🎯 使用场景

<table>
<tr>
<td>🤖 <b>AI 服务</b><br/>ChatGPT / Claude / Gemini</td>
<td>🔒 <b>隐私安全</b><br/>公共 WiFi 防护</td>
<td>💼 <b>远程办公</b><br/>安全访问内网</td>
</tr>
<tr>
<td>🎓 <b>学术研究</b><br/>Google Scholar</td>
<td>👨‍💻 <b>开发者</b><br/>GitHub / npm</td>
<td>🌍 <b>内容访问</b><br/>YouTube / Twitter</td>
</tr>
</table>

---

## 📋 完整更新日志

### Added - 新增功能

- **Stats API 自动配置**
  - `StatsConfigManager` 服务类
  - 智能端口检测与分配
  - 配置备份与回滚机制
  - 服务状态验证

- **社区优化**
  - Issue 模板 (Bug Report / Feature Request)
  - PR 模板
  - GitHub Discussions
  - Good First Issues (#9, #10, #11, #12)

- **README 增强**
  - 新增「使用场景」章节
  - SEO 关键词优化

### Changed - 改进

- 交互式菜单新增「配置 Stats API」选项
- 流量统计显示功能默认启用

### Technical - 技术细节

- 新增 `src/services/stats-config-manager.ts`
- 新增 `src/types/config.ts` Stats 相关类型
- 端口范围：10085-10185（可配置）
- 配置超时：5000ms
- 服务重启等待：2000ms

---

## 🙏 致谢

感谢所有贡献者和用户的支持！

**欢迎 Star ⭐ | Fork 🍴 | 提 Issue 📝 | 参与贡献 🤝**

---

## 📊 项目统计

![GitHub Stars](https://img.shields.io/github/stars/DanOps-1/Xray-VPN-OneClick?style=social)
![GitHub Forks](https://img.shields.io/github/forks/DanOps-1/Xray-VPN-OneClick?style=social)
![npm](https://img.shields.io/npm/v/xray-manager)
![License](https://img.shields.io/github/license/DanOps-1/Xray-VPN-OneClick)

---

**Full Changelog**: https://github.com/DanOps-1/Xray-VPN-OneClick/compare/v1.5.0...v1.6.0
