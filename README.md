# 小布2.0 直播循环话术生成器

填参数 → 实时生成一整套 15 分钟循环直播话术（带微锚点、收口公式、合规红线）。
前端是一个网页，后端是一个小函数，负责带密钥去调大模型。密钥不写在代码里。

---

## 部署步骤（GitHub + Vercel + DeepSeek）

### 第 1 步：拿一个 DeepSeek 密钥
1. 打开 https://platform.deepseek.com ，注册登录（支持微信/支付宝）。
2. 充值少量额度（几块钱够用很久）。
3. 在「API Keys」里新建一个密钥，复制保存好（形如 `sk-xxxxxxxx`）。
   —— 这个密钥等下填到 Vercel，**不要**写进任何代码、不要发给别人。

### 第 2 步：把这 4 个文件放进 GitHub 仓库
仓库里要有这样的结构：
```
你的仓库/
├── index.html          ← 前端页面
├── package.json
├── api/
│   └── generate.js     ← 后端函数（注意它在 api 文件夹里）
└── README.md
```
最省事的传法：在仓库页面点 **Add file → Upload files**，把 `index.html`、`package.json`、`README.md` 拖进去；`api/generate.js` 需要保持在 `api` 文件夹下——上传时把文件名直接写成 `api/generate.js` 即可自动建文件夹。传完点 **Commit changes**。

### 第 3 步：连到 Vercel 部署
1. 打开 https://vercel.com ，用你的 **GitHub 账号**登录。
2. 点 **Add New → Project**，选中这个仓库，点 **Import**。
3. 在部署配置页，找到 **Environment Variables（环境变量）**，添加一条：
   - Name（名字）：`DEEPSEEK_API_KEY`
   - Value（值）：粘贴你第 1 步复制的密钥
4. 点 **Deploy**，等一两分钟。
5. 完成后会给你一个网址，形如 `https://你的项目名.vercel.app` —— 这就是你的在线生成器。

---

## 国内访问提醒
- DeepSeek 接口在国内可直连，没问题。
- 但 `*.vercel.app` 这个默认域名在国内有时打不开。如果团队访问不稳定，去 Vercel 的
  **Settings → Domains** 绑一个你自己的域名（备案后更稳），或改用国内的云函数平台部署后端。

## 想换模型？
后端 `api/generate.js` 里只有两处要改：
- 接口地址 `https://api.deepseek.com/chat/completions`
- 模型名 `deepseek-chat`
换成通义千问、豆包、Kimi、智谱 GLM 等的对应地址和模型名即可（它们多数兼容这种 OpenAI 格式），
环境变量名记得同步改。
