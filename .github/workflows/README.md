# GitHub Actions 自动化工作流程

本项目配置了三个 GitHub Actions 工作流程，用于自动化测试、构建和发布。

## 工作流程概览

### 1. CI (持续集成)
**文件**: `.github/workflows/ci.yml`

**触发条件**:
- 推送到 `main`, `develop`, `feature/**` 分支
- 创建 Pull Request 到 `main` 或 `develop`

**功能**:
- ✅ 代码检查（ESLint）
- ✅ 代码格式化检查（Prettier）
- ✅ 运行测试（Node.js 18, 20, 22）
- ✅ 生成测试覆盖率报告
- ✅ 构建 TypeScript 项目
- ✅ 上传构建产物

### 2. Release & Publish (自动发布)
**文件**: `.github/workflows/release.yml`

**触发条件**:
- 推送 Git tag（格式: `v*.*.*`，例如 `v1.2.0`）

**功能**:
- ✅ 运行完整测试
- ✅ 自动发布到 npm
- ✅ 自动创建 GitHub Release
- ✅ 从 CHANGELOG.md 提取版本说明

**使用方法**:
```bash
# 1. 更新版本号和文档
npm version minor  # 或 major / patch
# 手动更新 CHANGELOG.md

# 2. 提交更改
git add .
git commit -m "chore: bump version to x.y.z"

# 3. 创建并推送 tag（自动触发发布）
git tag v1.2.0
git push origin main --tags
```

### 3. Manual Publish (手动发布)
**文件**: `.github/workflows/manual-publish.yml`

**触发条件**:
- 手动触发（GitHub Actions UI）

**功能**:
- ✅ 验证版本号格式
- ✅ 运行测试
- ✅ 可选：创建 Git tag
- ✅ 可选：发布到 npm
- ✅ 可选：创建 GitHub Release

**使用方法**:
1. 前往 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Manual Publish" workflow
4. 点击 "Run workflow"
5. 填写参数并运行

## 设置说明

### 必需的 Secrets

在 GitHub 仓库设置中添加以下 secrets：

#### 1. NPM_TOKEN (必需)
用于发布到 npm registry。

**获取方法**:
```bash
# 1. 登录 npm
npm login

# 2. 创建 automation token
npm token create --type=automation
```

**设置位置**:
1. GitHub 仓库 → Settings → Secrets and variables → Actions
2. 点击 "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: 粘贴你的 npm token
5. 点击 "Add secret"

#### 2. CODECOV_TOKEN (可选)
用于上传测试覆盖率到 Codecov。

**获取方法**:
1. 前往 https://codecov.io/
2. 使用 GitHub 登录
3. 添加你的仓库
4. 复制 token

## 发布流程最佳实践

### 标准发布流程

1. **开发完成后，更新版本号**:
   ```bash
   # Minor 版本（新功能，向下兼容）
   npm version minor

   # Patch 版本（bug 修复）
   npm version patch

   # Major 版本（破坏性变更）
   npm version major
   ```

2. **更新 CHANGELOG.md**:
   - 在顶部添加新版本条目
   - 列出所有变更（Added, Changed, Fixed 等）
   - 遵循 [Keep a Changelog](https://keepachangelog.com/) 格式

3. **提交更改**:
   ```bash
   git add package.json package-lock.json CHANGELOG.md
   git commit -m "chore: bump version to vX.Y.Z"
   git push origin main
   ```

4. **创建并推送 tag**:
   ```bash
   # 创建带注释的 tag
   git tag -a v1.2.0 -m "Release v1.2.0"

   # 推送 tag（触发自动发布）
   git push origin v1.2.0
   ```

5. **等待 GitHub Actions 完成**:
   - 查看 Actions 标签页确认状态
   - 发布成功后检查：
     - npm: https://www.npmjs.com/package/xray-manager
     - GitHub Releases: https://github.com/DanOps-1/Xray-VPN-OneClick/releases

### 紧急发布（使用 Manual Publish）

如果自动发布失败或需要更多控制：

1. 确保 package.json 版本号已更新
2. 确保 CHANGELOG.md 已更新
3. 前往 GitHub Actions → Manual Publish
4. 运行 workflow 并选择需要的选项

## 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **Major (X.0.0)**: 不兼容的 API 修改
- **Minor (0.X.0)**: 向下兼容的功能性新增
- **Patch (0.0.X)**: 向下兼容的问题修正

## 故障排查

### 发布失败常见原因

1. **npm 发布失败**:
   - 检查 NPM_TOKEN 是否正确设置
   - 确认版本号未在 npm 上存在
   - 检查 package.json 中的 name 是否正确

2. **测试失败**:
   - 本地运行 `npm test` 确保测试通过
   - 检查 CI 日志查看详细错误

3. **Release 创建失败**:
   - 确保 CHANGELOG.md 中有对应版本的条目
   - 检查 tag 格式是否正确（v1.2.0）

4. **权限错误**:
   - 确保 workflow 有正确的 permissions 设置
   - 检查仓库设置中的 Actions permissions

## 回滚发布

如果需要回滚已发布的版本：

### 回滚 npm 包
```bash
# 弃用特定版本
npm deprecate xray-manager@1.2.0 "This version has been deprecated"

# 或者删除版本（24小时内）
npm unpublish xray-manager@1.2.0
```

### 回滚 GitHub Release
1. 前往 Releases 页面
2. 编辑或删除对应的 Release
3. 删除对应的 Git tag:
   ```bash
   git tag -d v1.2.0
   git push origin :refs/tags/v1.2.0
   ```

## 监控和通知

### GitHub Actions 通知

默认情况下，workflow 失败时会通过 GitHub 通知。

可以添加其他通知方式：
- Slack 通知
- Email 通知
- Discord webhook

### npm 包统计

监控包的使用情况：
- https://www.npmjs.com/package/xray-manager
- https://npmcharts.com/compare/xray-manager

## 维护建议

1. **定期更新依赖**:
   ```bash
   npm update
   npm audit fix
   ```

2. **保持 CHANGELOG 更新**:
   - 每次合并 PR 时更新
   - 使用清晰的分类（Added, Changed, Fixed）

3. **运行本地测试**:
   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. **查看 GitHub Actions 日志**:
   - 定期检查 Actions 标签页
   - 修复失败的 workflow

## 参考链接

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [npm 发布指南](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)
