# Xray 服务端配置项目

本仓库提供完整的 Xray-core VLESS + XTLS-Reality 服务端配置教程和相关资源。

## 📚 目录

- [快速开始](#快速开始)
- [完整教程](docs/installation-guide.md)
- [配置示例](#配置示例)
- [常见问题](#常见问题)
- [参考资源](#参考资源)

## 🚀 快速开始

### 一键安装

```bash
# 安装 Xray-core
sudo bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 生成配置参数
cat /proc/sys/kernel/random/uuid              # UUID
/usr/local/bin/xray x25519                    # 密钥对
openssl rand -hex 8                           # Short ID

# 配置并启动
sudo nano /usr/local/etc/xray/config.json     # 编辑配置
sudo systemctl start xray                      # 启动服务
```

### 验证服务

```bash
sudo systemctl status xray
sudo ss -tlnp | grep 443
```

## 📖 完整教程

详细的安装和配置教程请查看：**[安装配置指南](docs/installation-guide.md)**

教程包含以下内容：
- ✅ 系统环境准备
- ✅ Xray-core 安装步骤
- ✅ 配置参数生成
- ✅ 服务配置和启动
- ✅ 客户端连接配置
- ✅ 故障排查指南
- ✅ 性能优化建议
- ✅ 安全加固方案

## 📋 配置示例

### 服务端配置模板

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "YOUR-UUID-HERE",
            "flow": "xtls-rprx-vision"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "dest": "www.microsoft.com:443",
          "serverNames": ["www.microsoft.com"],
          "privateKey": "YOUR-PRIVATE-KEY",
          "shortIds": ["YOUR-SHORT-ID"]
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    }
  ]
}
```

完整配置请参考 [配置示例目录](examples/)。

## 📱 客户端配置

### 分享链接格式

```
vless://[UUID]@[SERVER]:[PORT]?encryption=none&flow=xtls-rprx-vision&security=reality&sni=[SNI]&fp=chrome&pbk=[PUBLIC-KEY]&sid=[SHORT-ID]&type=tcp#[REMARK]
```

### 支持的客户端

- **Windows**: v2rayN
- **macOS**: V2rayU, V2RayXS
- **Linux**: v2ray-core, Qv2ray
- **Android**: v2rayNG
- **iOS**: Shadowrocket, Quantumult X

详细配置方法请查看[完整教程](docs/installation-guide.md#客户端配置)。

## ❓ 常见问题

### 端口无法监听

```bash
# 修改服务运行用户
sudo sed -i 's/User=nobody/User=root/' /etc/systemd/system/xray.service
sudo systemctl daemon-reload
sudo systemctl restart xray
```

### 客户端连接失败

1. 检查服务状态: `sudo systemctl status xray`
2. 检查端口监听: `sudo ss -tlnp | grep 443`
3. 检查防火墙规则
4. 查看实时日志: `sudo journalctl -u xray -f`

更多问题请参考[完整教程的常见问题章节](docs/installation-guide.md#常见问题)。

## 🛠️ 服务管理

```bash
# 启动/停止/重启
sudo systemctl start xray
sudo systemctl stop xray
sudo systemctl restart xray

# 查看状态
sudo systemctl status xray

# 查看日志
sudo journalctl -u xray -f

# 测试配置
sudo /usr/local/bin/xray run -test -config /usr/local/etc/xray/config.json
```

## 🔒 安全建议

1. 定期更换 UUID 和密钥（建议 3-6 个月）
2. 使用强密码和非标准端口
3. 启用防火墙限制访问来源
4. 定期更新 Xray 到最新版本
5. 监控日志发现异常访问

## 📊 性能优化

- 启用 TCP BBR 拥塞控制
- 启用 TCP Fast Open
- 调整系统文件描述符限制
- 选择低延迟的伪装目标网站

详细优化步骤请查看[性能优化章节](docs/installation-guide.md#性能优化)。

## 📚 参考资源

- [Xray 官方文档](https://xtls.github.io/)
- [VLESS 协议说明](https://xtls.github.io/config/features/vless.html)
- [Reality 协议详解](https://github.com/XTLS/REALITY)
- [Xray-core GitHub](https://github.com/XTLS/Xray-core)

## 📝 更新日志

- **2026-01-07**: 初始版本
  - 完整的 VLESS + XTLS-Reality 配置教程
  - 详细的故障排查指南
  - 性能优化和安全加固建议

## 📄 许可证

MIT License

## ⚠️ 免责声明

本项目仅供学习和研究使用。使用代理技术需遵守当地法律法规，请勿用于非法用途。

---

**如有问题或建议，欢迎提交 Issue。**
