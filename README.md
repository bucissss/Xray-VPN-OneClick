# Xray 服务端一键配置脚本

[![GitHub Stars](https://img.shields.io/github/stars/DanOps-1/X-ray?style=flat-square)](https://github.com/DanOps-1/X-ray/stargazers)
[![License](https://img.shields.io/github/license/DanOps-1/X-ray?style=flat-square)](https://github.com/DanOps-1/X-ray/blob/main/LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/DanOps-1/X-ray?style=flat-square)](https://github.com/DanOps-1/X-ray/commits/main)
[![Platform](https://img.shields.io/badge/platform-Linux-blue?style=flat-square)](https://github.com/DanOps-1/X-ray)

[**English**](README.md) | [**中文文档**](docs/README-zh.md)

**快速部署 Xray-core VLESS + XTLS-Reality 代理服务器**

本项目提供完全自动化的 Xray 服务端配置脚本和详细教程，支持一键部署，无需手动配置。

---

## ✨ 主要特性

- ✅ **完全自动化** - 一键安装，无需用户输入
- 🔒 **安全可靠** - 使用最新的 VLESS + XTLS-Reality 协议
- 📱 **客户端支持** - 兼容 Windows、macOS、Linux、Android、iOS
- 🚀 **性能优化** - 内置 BBR、TCP Fast Open 等优化
- 📚 **详细文档** - 完整的安装、配置和故障排查指南
- 🛠️ **管理工具** - 用户管理、服务更新、配置备份等工具
- 🌍 **多语言** - 支持中英文文档
- 🐳 **Docker 支持** - 提供 Docker 部署方案

---

## 🚀 快速开始

### 方式一：一键安装（推荐）

```bash
# 下载并运行自动安装脚本
wget https://raw.githubusercontent.com/DanOps-1/X-ray/main/scripts/install.sh -O xray-install.sh
sudo bash xray-install.sh
```

安装完成后，脚本会自动：
- ✅ 安装 Xray-core 最新版本
- ✅ 生成配置参数（UUID、密钥、Short ID）
- ✅ 创建并启用服务
- ✅ 输出客户端配置信息和分享链接

### 方式二：手动安装

查看 **[完整安装教程](docs/installation-guide.md)** 了解详细步骤。

---

## 📱 客户端配置

### 支持的客户端

| 平台 | 推荐客户端 | 下载链接 |
|------|-----------|---------|
| **Windows** | v2rayN | [GitHub](https://github.com/2dust/v2rayN/releases) |
| **macOS** | V2rayU / V2RayXS | [V2rayU](https://github.com/yanue/V2rayU/releases) / [V2RayXS](https://github.com/tzmax/V2RayXS/releases) |
| **Linux** | v2ray-core / Qv2ray | [v2ray](https://github.com/v2fly/v2ray-core/releases) / [Qv2ray](https://github.com/Qv2ray/Qv2ray/releases) |
| **Android** | v2rayNG | [GitHub](https://github.com/2dust/v2rayNG/releases) |
| **iOS** | Shadowrocket / Quantumult X | App Store |

### 快速导入

安装脚本会生成 VLESS 分享链接，直接在客户端中：
1. 复制分享链接
2. 打开客户端 → "从剪贴板导入"
3. 连接即可使用

详细配置指南：[客户端配置说明](docs/client-setup.md)

---

## 📂 项目结构

```
X-ray/
├── README.md                           # 项目说明（英文）
├── docs/
│   ├── README-zh.md                    # 项目说明（中文）
│   ├── installation-guide.md           # 完整安装教程
│   ├── client-setup.md                 # 客户端配置指南
│   ├── user-management.md              # 用户管理指南
│   └── docker-setup.md                 # Docker 部署指南
├── examples/
│   ├── config.json                     # 基础配置模板
│   └── config-multiple-users.json      # 多用户配置
└── scripts/
    ├── install.sh                      # 一键安装脚本
    ├── add-user.sh                     # 添加用户
    ├── del-user.sh                     # 删除用户
    ├── show-config.sh                  # 显示配置
    ├── update.sh                       # 更新 Xray
    ├── uninstall.sh                    # 卸载 Xray
    ├── backup.sh                       # 备份配置
    └── generate-link.py                # 生成分享链接
```

---

## 🛠️ 管理工具

### 用户管理

```bash
# 添加新用户
sudo bash scripts/add-user.sh <用户邮箱>

# 删除用户
sudo bash scripts/del-user.sh <用户邮箱>

# 列出所有用户
sudo bash scripts/show-config.sh users
```

### 服务管理

```bash
# 启动/停止/重启服务
sudo systemctl start xray
sudo systemctl stop xray
sudo systemctl restart xray

# 查看服务状态
sudo systemctl status xray

# 查看实时日志
sudo journalctl -u xray -f
```

### 更新和维护

```bash
# 更新 Xray 到最新版本
sudo bash scripts/update.sh

# 备份当前配置
sudo bash scripts/backup.sh

# 卸载 Xray
sudo bash scripts/uninstall.sh
```

---

## 📖 文档

- [完整安装教程](docs/installation-guide.md) - 详细的安装和配置步骤
- [客户端配置指南](docs/client-setup.md) - 各平台客户端配置方法
- [用户管理指南](docs/user-management.md) - 添加、删除、管理用户
- [Docker 部署指南](docs/docker-setup.md) - 使用 Docker 部署 Xray
- [常见问题](docs/installation-guide.md#常见问题) - 故障排查和解决方案
- [性能优化](docs/installation-guide.md#性能优化) - 提升服务性能的建议

---

## 🔒 安全建议

1. ✅ 定期更换 UUID 和密钥（建议 3-6 个月）
2. ✅ 使用强密码和非标准端口
3. ✅ 启用防火墙限制访问来源
4. ✅ 定期更新 Xray 到最新版本
5. ✅ 监控日志发现异常访问
6. ✅ 定期备份配置文件

---

## 📊 系统要求

### 最低要求
- **操作系统**: Linux（Debian、Ubuntu、CentOS、Kali 等）
- **内存**: 512 MB RAM
- **存储**: 100 MB 可用空间
- **网络**: 公网 IP 地址

### 推荐配置
- **操作系统**: Ubuntu 22.04 LTS / Debian 12
- **内存**: 1 GB RAM
- **CPU**: 1 核心
- **网络**: 10 Mbps 以上带宽

### 支持的云平台
- ✅ AWS EC2
- ✅ Google Cloud Platform
- ✅ Microsoft Azure
- ✅ DigitalOcean
- ✅ Vultr
- ✅ Linode
- ✅ 阿里云、腾讯云等国内云平台

---

## 🐳 Docker 部署

```bash
# 使用 Docker 部署（开发中）
docker pull danops/xray-reality
docker run -d --name xray -p 443:443 danops/xray-reality
```

详细说明：[Docker 部署指南](docs/docker-setup.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📚 参考资源

- [Xray 官方文档](https://xtls.github.io/)
- [VLESS 协议说明](https://xtls.github.io/config/features/vless.html)
- [Reality 协议详解](https://github.com/XTLS/REALITY)
- [Xray-core GitHub](https://github.com/XTLS/Xray-core)

---

## 📝 更新日志

### v1.0.0 (2026-01-07)
- ✅ 初始版本发布
- ✅ 完整的 VLESS + XTLS-Reality 配置教程
- ✅ 一键安装脚本
- ✅ 用户管理工具
- ✅ 详细的文档和示例

---

## 📄 许可证

[MIT License](LICENSE)

---

## ⚠️ 免责声明

本项目仅供学习和研究使用。使用代理技术需遵守当地法律法规，请勿用于非法用途。作者不对使用本项目造成的任何后果负责。

---

## 💬 支持

如有问题或建议：
- 📧 提交 [Issue](https://github.com/DanOps-1/X-ray/issues)
- 💡 查看 [常见问题](docs/installation-guide.md#常见问题)
- 📖 阅读 [完整文档](docs/installation-guide.md)

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**
