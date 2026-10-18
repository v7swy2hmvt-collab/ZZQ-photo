# 白墙影展 · 静态站

极简线上摄影展的**纯静态版本**：没有后台、没有服务端，全部内容由
`export-static.js` 从本地图展数据一键导出，托管在 GitHub Pages 上即可全球访问。

- 6 个系列 · 49 幅作品
- 主图已压缩（长边 2560）+ 缩略图 + 模糊占位，加载快
- 响应式版式，手机可看

---

## 如何发布到 GitHub Pages

### 第 1 步：创建仓库

1. 登录 GitHub → 右上角 **+** → **New repository**
2. Repository name 填 `whitewall-gallery`（或任意名字；若填 `你的用户名.github.io` 则网站直接挂在根路径）
3. 选 **Public**，**不要**勾选 "Add a README"，点 **Create repository**

### 第 2 步：上传文件

**方式 A · 网页上传（最简单）**

1. 在新仓库页面点 **uploading an existing file**（或 Add file → Upload files）
2. 把本目录里**所有文件和文件夹**（`assets/`、`data/`、`uploads/`、`index.html`、`series.html`、`404.html`、`robots.txt`）全部拖进去
3. 点 **Commit changes**，等待上传完成（约 50 MB，需几分钟）
4. 再点一次 **Add file → Create a new file**，文件名输入 `.nojekyll`，内容留空，Commit —— 这个隐藏文件网页上传传不上去，需要单独建

**方式 B · 命令行（推荐，一劳永逸）**

```bash
cd 本目录
git init
git add -A
git commit -m "白墙影展静态站"
git branch -M main
git remote add origin https://github.com/<你的用户名>/whitewall-gallery.git
git push -u origin main
```

### 第 3 步：开启 Pages

1. 仓库页面 → **Settings** → 左侧 **Pages**
2. Source 选 **Deploy from a branch**，Branch 选 **main** + **/ (root)**，点 **Save**
3. 等 1~3 分钟，刷新后页面顶部会出现地址：

   `https://<你的用户名>.github.io/whitewall-gallery/`

   这就是可以发给任何人的展览链接。

### 以后更新作品怎么办

1. 在**本地**的图展管理台（`http://127.0.0.1:4173/admin.html`）传图、改标题
2. 在本地项目目录运行 `node export-static.js`，重新生成 `dist/`
3. 用 `dist/` 内容覆盖本目录，再 `git add -A && git commit -m "更新作品" && git push`

GitHub Pages 会自动重新发布。

---

## 目录结构

```
├── index.html        首页（系列封面墙）
├── series.html       系列页（作品网格 + 灯箱）
├── 404.html          找不到页面时跳回首页
├── assets/           样式与前台脚本
├── data/             展览数据（JSON，由导出脚本生成）
├── uploads/          作品图片（主图 + 缩略图）
├── robots.txt        允许搜索引擎收录
└── .nojekyll         让 GitHub Pages 原样托管（不做 Jekyll 处理）
```

## 免费额度说明

GitHub Pages 对公开仓库免费，限制：站点 ≤ 1 GB，每月流量 ≤ 100 GB。
当前整站约 53 MB，49 幅作品完全够用；作品多到几百幅时再考虑压缩或换 Netlify。

## 自定义域名（可选）

仓库根目录加一个 `CNAME` 文件（内容为你的域名，如 `gallery.example.com`），
再在域名服务商加一条 CNAME 记录指向 `<你的用户名>.github.io` 即可。
