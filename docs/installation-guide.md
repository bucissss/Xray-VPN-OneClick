# Xray-core 服务端完整配置教程

> 本教程详细记录在 Linux 服务器上配置 Xray-core VLESS + XTLS-Reality 代理节点的完整过程

## 目录

- [系统环境](#系统环境)
- [安装 Xray-core](#安装-xray-core)
- [生成配置参数](#生成配置参数)
- [配置 Xray 服务](#配置-xray-服务)
- [启动并验证服务](#启动并验证服务)
- [客户端配置](#客户端配置)
- [常见问题](#常见问题)
- [服务管理](#服务管理)

---

## 系统环境

### 服务器信息
- **操作系统**: Kali GNU/Linux Rolling 2025.4 (基于 Debian)
- **架构**: x86_64
- **内核**: Linux 6.16.8+kali-cloud-amd64
- **推荐配置**: 1核1GB 内存以上

### 检查系统环境

```bash
# 查看系统架构和版本
uname -m
cat /etc/os-release

# 查看内网 IP
ip addr show | grep 'inet '

# 查看公网 IP
curl -s ifconfig.me
```

**示例输出**:
```
x86_64
内网 IP: 172.31.44.89
公网 IP: 3.139.134.188
```

---

## 安装 Xray-core

### 使用官方安装脚本

Xray-core 提供了官方的一键安装脚本，会自动下载最新版本并配置 systemd 服务。

```bash
# 使用官方安装脚本（需要 root 权限）
sudo bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
```

### 安装过程说明

脚本会自动完成以下操作：

1. **下载最新版本**: 从 GitHub Releases 下载适合系统架构的 Xray 二进制文件
2. **安装文件到系统目录**:
   - 主程序: `/usr/local/bin/xray`
   - 配置文件: `/usr/local/etc/xray/config.json`
   - 地理位置数据: `/usr/local/share/xray/geoip.dat` 和 `geosite.dat`
   - 日志目录: `/var/log/xray/`
3. **创建 systemd 服务**: `/etc/systemd/system/xray.service`
4. **设置开机自启**: 自动 enable 服务

### 验证安装

```bash
# 查看 Xray 版本
/usr/local/bin/xray version

# 检查服务文件
ls -la /etc/systemd/system/xray.service

# 查看配置文件
cat /usr/local/etc/xray/config.json
```

**预期输出**:
```
Xray 25.12.8 (Xray, Penetrates Everything.)
```

---

## 生成配置参数

VLESS + XTLS-Reality 需要几个关键参数：UUID、x25519 密钥对、Short ID。

### 1. 生成 UUID

UUID 是客户端的唯一标识符。

```bash
# 生成随机 UUID
cat /proc/sys/kernel/random/uuid
```

**示例输出**:
```
5b6ec5d1-93a1-4056-b90f-9be61021144d
```

### 2. 生成 x25519 密钥对

Reality 协议使用 x25519 密钥对进行加密。

```bash
# 使用 Xray 生成密钥对
/usr/local/bin/xray x25519
```

**示例输出**:
```
PrivateKey: mNFnuEMXo8fDEZKB_eYdHmQ0ic5Qr2vuZwHCeEJGakM
Password: gsQazazvUOLxdcwhenIxf0rIQzanJI48HROjezdWq2Y
Hash32: 74LQhM8Tz2wCz7LJ9tOVaFYljoPlicUV3NrxPoKw9ec
```

**重要**:
- `PrivateKey` 用于服务端配置
- `Password`（也叫 PublicKey）用于客户端配置

### 3. 生成 Short ID

Short ID 是一个 16 位十六进制字符串。

```bash
# 生成随机 Short ID
openssl rand -hex 8
```

**示例输出**:
```
f611741eea195fcf
```

### 参数汇总

将生成的参数记录下来，后续配置会用到：

| 参数 | 值 | 用途 |
|------|-----|------|
| UUID | `5b6ec5d1-93a1-4056-b90f-9be61021144d` | 客户端认证 |
| PrivateKey | `mNFnuEMXo8fDEZKB_eYdHmQ0ic5Qr2vuZwHCeEJGakM` | 服务端 Reality |
| PublicKey | `gsQazazvUOLxdcwhenIxf0rIQzanJI48HROjezdWq2Y` | 客户端 Reality |
| Short ID | `f611741eea195fcf` | Reality 额外认证 |

---

## 配置 Xray 服务

### 创建配置文件

使用生成的参数创建 Xray 配置文件。

```bash
# 备份默认配置（如果存在）
sudo cp /usr/local/etc/xray/config.json /usr/local/etc/xray/config.json.bak

# 创建新配置
sudo nano /usr/local/etc/xray/config.json
```

### 配置文件内容

将以下内容复制到配置文件中，**替换相应参数**：

```json
{
  "log": {
    "loglevel": "warning"
  },
  "inbounds": [
    {
      "port": 443,
      "protocol": "vless",
      "tag": "vless_tls",
      "settings": {
        "clients": [
          {
            "id": "5b6ec5d1-93a1-4056-b90f-9be61021144d",
            "flow": "xtls-rprx-vision",
            "email": "user@example.com"
          }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "www.microsoft.com:443",
          "xver": 0,
          "serverNames": [
            "www.microsoft.com"
          ],
          "privateKey": "mNFnuEMXo8fDEZKB_eYdHmQ0ic5Qr2vuZwHCeEJGakM",
          "shortIds": [
            "f611741eea195fcf",
            ""
          ]
        }
      },
      "sniffing": {
        "enabled": true,
        "destOverride": [
          "http",
          "tls"
        ]
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "tag": "block"
    }
  ],
  "routing": {
    "domainStrategy": "AsIs",
    "rules": [
      {
        "type": "field",
        "ip": [
          "geoip:private"
        ],
        "outboundTag": "block"
      }
    ]
  }
}
```

### 配置参数说明

#### Inbound 配置

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `port` | 监听端口 | `443` (HTTPS 标准端口，更难被检测) |
| `protocol` | 协议类型 | `vless` |
| `clients.id` | 客户端 UUID | 替换为你生成的 UUID |
| `flow` | 流控模式 | `xtls-rprx-vision` (推荐) |

#### Reality 配置

| 参数 | 说明 | 示例值 |
|------|------|--------|
| `dest` | 伪装目标网站 | `www.microsoft.com:443` |
| `serverNames` | SNI 服务器名称 | `["www.microsoft.com"]` |
| `privateKey` | 服务端私钥 | 替换为你生成的 PrivateKey |
| `shortIds` | Short ID 列表 | 替换为你生成的 Short ID |

#### 伪装目标选择建议

- 选择国际知名、稳定的 HTTPS 网站
- 推荐: `www.microsoft.com`, `www.apple.com`, `www.cloudflare.com`
- 确保目标网站支持 TLS 1.3

### 测试配置文件

在启动服务前，测试配置文件是否正确：

```bash
sudo /usr/local/bin/xray run -test -config /usr/local/etc/xray/config.json
```

**正确输出**:
```
Xray 25.12.8 (Xray, Penetrates Everything.)
Reading config: /usr/local/etc/xray/config.json
Configuration OK.
```

如果显示 "Configuration OK."，说明配置文件格式正确。

---

## 启动并验证服务

### 修改 systemd 服务配置

默认情况下，Xray 以 `nobody` 用户运行，可能没有权限监听 443 端口。需要修改为 `root` 用户。

```bash
# 修改服务文件中的用户
sudo sed -i 's/User=nobody/User=root/' /etc/systemd/system/xray.service

# 重新加载 systemd 配置
sudo systemctl daemon-reload
```

### 启动 Xray 服务

```bash
# 启动服务
sudo systemctl start xray

# 设置开机自启
sudo systemctl enable xray

# 查看服务状态
sudo systemctl status xray
```

**预期输出**:
```
● xray.service - Xray Service
     Loaded: loaded (/etc/systemd/system/xray.service; enabled)
     Active: active (running) since Wed 2026-01-07 07:29:40 UTC
   Main PID: 19566 (xray)

Jan 07 07:29:40 kali xray[19566]: Xray 25.12.8 started
```

状态应该显示 **Active: active (running)**。

### 验证端口监听

```bash
# 检查 443 端口是否被 Xray 监听
sudo ss -tlnp | grep 443
```

**预期输出**:
```
LISTEN 0 4096 *:443 *:* users:(("xray",pid=19566,fd=3))
```

### 查看日志

```bash
# 查看实时日志
sudo journalctl -u xray -f

# 查看最近 50 行日志
sudo journalctl -u xray -n 50 --no-pager

# 查看错误日志文件
sudo tail -f /var/log/xray/error.log

# 查看访问日志文件
sudo tail -f /var/log/xray/access.log
```

---

## 客户端配置

### 方式一：使用分享链接（推荐）

#### 生成分享链接

使用 Python 脚本生成 VLESS 分享链接：

```bash
python3 << 'EOF'
import urllib.parse

# 替换为你的实际参数
UUID = "5b6ec5d1-93a1-4056-b90f-9be61021144d"
SERVER = "3.139.134.188"  # 服务器公网 IP
PORT = "443"
PUBLIC_KEY = "gsQazazvUOLxdcwhenIxf0rIQzanJI48HROjezdWq2Y"
SHORT_ID = "f611741eea195fcf"
SNI = "www.microsoft.com"
FLOW = "xtls-rprx-vision"
REMARK = "Xray-Reality-Server"

pbk_encoded = urllib.parse.quote(PUBLIC_KEY, safe='')
vless_link = f"vless://{UUID}@{SERVER}:{PORT}?encryption=none&flow={FLOW}&security=reality&sni={SNI}&fp=chrome&pbk={pbk_encoded}&sid={SHORT_ID}&type=tcp&headerType=none#{REMARK}"

print(vless_link)
EOF
```

#### 分享链接示例

```
vless://5b6ec5d1-93a1-4056-b90f-9be61021144d@3.139.134.188:443?encryption=none&flow=xtls-rprx-vision&security=reality&sni=www.microsoft.com&fp=chrome&pbk=gsQazazvUOLxdcwhenIxf0rIQzanJI48HROjezdWq2Y&sid=f611741eea195fcf&type=tcp&headerType=none#Xray-Reality-Server
```

#### 客户端导入步骤

**v2rayN (Windows)**
1. 复制完整的 VLESS 链接
2. 打开 v2rayN
3. 点击菜单栏 "服务器" → "从剪贴板导入批量URL"
4. 选择导入的节点，按 Enter 键连接

**v2rayNG (Android)**
1. 复制完整的 VLESS 链接
2. 打开 v2rayNG
3. 点击右上角 "+" → "从剪贴板导入"
4. 选择节点，点击右下角连接按钮

**Shadowrocket (iOS)**
1. 复制完整的 VLESS 链接
2. 打开 Shadowrocket
3. 点击右上角 "+" → "类型" → "粘贴"
4. 自动识别并添加节点

### 方式二：手动配置

如果客户端不支持分享链接导入，可以手动填写配置：

#### 基本信息

| 配置项 | 值 |
|--------|-----|
| 协议 | VLESS |
| 地址 | `3.139.134.188` |
| 端口 | `443` |
| UUID | `5b6ec5d1-93a1-4056-b90f-9be61021144d` |
| 加密 | none |
| 流控 | xtls-rprx-vision |

#### 传输配置

| 配置项 | 值 |
|--------|-----|
| 传输协议 | TCP |
| 传输层安全 | Reality |

#### Reality 配置

| 配置项 | 值 |
|--------|-----|
| 公钥 (PublicKey) | `gsQazazvUOLxdcwhenIxf0rIQzanJI48HROjezdWq2Y` |
| Short ID | `f611741eea195fcf` (或留空) |
| 服务器名称 (SNI) | `www.microsoft.com` |
| 指纹 (Fingerprint) | `chrome` |

### 测试连接

配置完成后：
1. 连接节点
2. 访问 https://www.google.com 测试
3. 访问 https://ip.sb 查看出口 IP

**出口 IP 应该显示为服务器的公网 IP**: `3.139.134.188`

---

## 常见问题

### 1. 端口 443 无法监听

**现象**: `sudo ss -tlnp | grep 443` 没有输出

**原因**:
- nobody 用户权限不足
- 端口被其他程序占用

**解决方案**:

```bash
# 方案1: 修改服务运行用户为 root
sudo sed -i 's/User=nobody/User=root/' /etc/systemd/system/xray.service
sudo systemctl daemon-reload
sudo systemctl restart xray

# 方案2: 检查端口占用
sudo lsof -i :443
# 如果有其他程序占用，停止该程序或更换端口
```

### 2. 服务启动失败

**查看错误日志**:

```bash
# 查看 systemd 日志
sudo journalctl -u xray -n 100 --no-pager

# 查看 Xray 错误日志
sudo cat /var/log/xray/error.log

# 手动运行测试
sudo /usr/local/bin/xray run -config /usr/local/etc/xray/config.json
```

**常见错误**:
- JSON 格式错误：检查配置文件语法
- 参数缺失：确保所有必需参数都已填写
- 权限问题：确保配置文件可读

### 3. 客户端连接失败

**排查步骤**:

```bash
# 1. 确认服务正在运行
sudo systemctl status xray

# 2. 确认端口监听
sudo ss -tlnp | grep 443

# 3. 检查防火墙
sudo iptables -L -n | grep 443
# 如果端口被阻止，添加规则：
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# 4. 检查云服务商安全组
# 登录云服务商控制台，确保 443 端口在安全组规则中开放

# 5. 查看实时日志
sudo journalctl -u xray -f
```

**客户端配置检查**:
- UUID 是否正确
- 服务器 IP 地址是否正确
- PublicKey 是否匹配（不是 PrivateKey）
- SNI 是否与服务端一致
- Flow 设置为 `xtls-rprx-vision`

### 4. 连接速度慢

**优化建议**:

1. **更换伪装目标网站**: 选择延迟更低的网站
   ```json
   "dest": "www.cloudflare.com:443",
   "serverNames": ["www.cloudflare.com"]
   ```

2. **启用 TCP Fast Open**:
   ```bash
   # 检查是否支持
   cat /proc/sys/net/ipv4/tcp_fastopen

   # 启用（0=关闭，1=客户端，2=服务端，3=全部）
   sudo sysctl -w net.ipv4.tcp_fastopen=3

   # 永久生效
   echo "net.ipv4.tcp_fastopen=3" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **调整 BBR 拥塞控制**:
   ```bash
   # 启用 BBR
   echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.conf
   echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p

   # 验证
   sysctl net.ipv4.tcp_congestion_control
   ```

### 5. 添加多个用户

在配置文件的 `clients` 数组中添加多个客户端：

```json
"clients": [
  {
    "id": "5b6ec5d1-93a1-4056-b90f-9be61021144d",
    "flow": "xtls-rprx-vision",
    "email": "user1@example.com"
  },
  {
    "id": "新的UUID",
    "flow": "xtls-rprx-vision",
    "email": "user2@example.com"
  }
]
```

生成新的 UUID:
```bash
cat /proc/sys/kernel/random/uuid
```

修改后重启服务:
```bash
sudo systemctl restart xray
```

---

## 服务管理

### 常用命令

```bash
# 启动服务
sudo systemctl start xray

# 停止服务
sudo systemctl stop xray

# 重启服务
sudo systemctl restart xray

# 重新加载配置（无需重启）
sudo systemctl reload xray

# 查看服务状态
sudo systemctl status xray

# 设置开机自启
sudo systemctl enable xray

# 取消开机自启
sudo systemctl disable xray

# 查看实时日志
sudo journalctl -u xray -f

# 查看最近日志
sudo journalctl -u xray -n 100
```

### 更新 Xray

```bash
# 使用官方脚本更新到最新版本
sudo bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install

# 重启服务使新版本生效
sudo systemctl restart xray

# 查看版本
/usr/local/bin/xray version
```

### 卸载 Xray

```bash
# 停止并禁用服务
sudo systemctl stop xray
sudo systemctl disable xray

# 使用官方脚本卸载
sudo bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ remove --purge

# 手动删除残留文件（可选）
sudo rm -rf /usr/local/etc/xray
sudo rm -rf /var/log/xray
```

### 备份配置

```bash
# 备份配置文件
sudo cp /usr/local/etc/xray/config.json ~/xray-config-backup-$(date +%Y%m%d).json

# 打包整个配置目录
sudo tar -czf ~/xray-backup-$(date +%Y%m%d).tar.gz /usr/local/etc/xray/
```

---

## 安全建议

### 1. 使用非标准端口

虽然 443 更难被检测，但也可以使用其他端口：

```json
"port": 8443,  // 或其他端口
```

修改后记得在防火墙和安全组中开放相应端口。

### 2. 定期更换密钥

建议每 3-6 个月更换一次 UUID 和密钥：

```bash
# 生成新参数
cat /proc/sys/kernel/random/uuid
/usr/local/bin/xray x25519
openssl rand -hex 8

# 更新配置文件
sudo nano /usr/local/etc/xray/config.json

# 重启服务
sudo systemctl restart xray
```

### 3. 限制访问来源（可选）

如果你的客户端 IP 相对固定，可以配置防火墙限制：

```bash
# 只允许特定 IP 访问 443 端口
sudo iptables -A INPUT -p tcp --dport 443 -s 客户端IP -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j DROP

# 保存规则
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

### 4. 启用访问日志监控

修改日志级别以记录更多信息：

```json
"log": {
  "loglevel": "info",
  "access": "/var/log/xray/access.log",
  "error": "/var/log/xray/error.log"
}
```

定期检查日志：
```bash
# 查看连接记录
sudo tail -100 /var/log/xray/access.log

# 查看错误信息
sudo tail -100 /var/log/xray/error.log
```

---

## 性能优化

### 系统参数优化

```bash
# 编辑系统参数
sudo nano /etc/sysctl.conf
```

添加以下内容：

```bash
# TCP 优化
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_mtu_probing = 1

# BBR 拥塞控制
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# 连接队列
net.core.somaxconn = 4096
net.ipv4.tcp_max_syn_backlog = 8192

# 内存优化
net.core.rmem_max = 67108864
net.core.wmem_max = 67108864
net.ipv4.tcp_rmem = 4096 87380 67108864
net.ipv4.tcp_wmem = 4096 65536 67108864

# 文件描述符
fs.file-max = 1000000
```

应用配置：
```bash
sudo sysctl -p
```

### Xray 服务优化

修改 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/xray.service
```

调整资源限制：

```ini
[Service]
LimitNPROC=500000
LimitNOFILE=1000000
```

重新加载并重启：
```bash
sudo systemctl daemon-reload
sudo systemctl restart xray
```

---

## 故障排查流程图

```
连接失败？
  ├─ 服务运行正常？
  │   ├─ No → sudo systemctl start xray
  │   └─ Yes → 继续
  │
  ├─ 端口监听正常？
  │   ├─ No → 检查 User 配置、端口占用
  │   └─ Yes → 继续
  │
  ├─ 防火墙开放？
  │   ├─ No → iptables/云安全组开放端口
  │   └─ Yes → 继续
  │
  ├─ 客户端配置正确？
  │   ├─ No → 核对 UUID、PublicKey、SNI
  │   └─ Yes → 继续
  │
  └─ 查看日志找具体原因
      sudo journalctl -u xray -f
```

---

## 附录

### A. 完整配置文件示例

参见本文 [配置 Xray 服务](#配置-xray-服务) 章节。

### B. 客户端配置参数对照表

| 服务端配置 | 客户端配置 | 说明 |
|-----------|-----------|------|
| `clients.id` | UUID | 必须完全一致 |
| `privateKey` | publicKey | 服务端用私钥，客户端用公钥 |
| `shortIds` | Short ID | 可选，留空或填写其中之一 |
| `serverNames` | SNI | 必须一致 |
| `dest` | - | 服务端独有 |
| `flow` | Flow | 必须一致 |

### C. 推荐伪装目标列表

| 网站 | 地址 | 特点 |
|------|------|------|
| Microsoft | `www.microsoft.com:443` | 稳定、全球可达 |
| Apple | `www.apple.com:443` | 稳定、流量大 |
| Cloudflare | `www.cloudflare.com:443` | 低延迟、CDN |
| Amazon | `www.amazon.com:443` | 流量大、多地区 |
| Google | `www.google.com:443` | 需要确保服务器可访问 |

### D. 参考资源

- [Xray 官方文档](https://xtls.github.io/)
- [VLESS 协议说明](https://xtls.github.io/config/features/vless.html)
- [Reality 协议详解](https://github.com/XTLS/REALITY)
- [Xray-core GitHub](https://github.com/XTLS/Xray-core)

---

## 更新日志

- **2026-01-07**: 初始版本，基于 Xray 25.12.8
- 记录完整的 VLESS + XTLS-Reality 配置流程
- 包含详细的故障排查和优化建议

---

## 许可证

本教程基于实际配置操作记录编写，遵循 MIT License。

## 免责声明

本教程仅供学习和研究使用。使用代理技术需遵守当地法律法规，请勿用于非法用途。

---

**配置完成！如有问题请查看日志或参考常见问题章节。**
