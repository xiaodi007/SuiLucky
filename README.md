# SUI 红包应用

这是一个基于 **Sui 区块链** 的 Web3 红包应用，允许用户发送和领取红包。应用使用了 **Next.js** 和 **React** 构建，集成了 **Enoki** 的 zkLogin 流程。

## 功能特性

- **发送红包**：用户可以输入总金额和红包个数，生成一个红包 ID，与他人分享。
- **领取红包**：用户可以通过输入红包 ID 来领取红包，并获得相应的金额。
- **账户信息**：查看当前用户的 SUI 地址和余额，支持一键复制和跳转到区块链浏览器查看详情。
- **申请 SUI**：在测试网络上申请 SUI 代币，方便测试使用。

## 技术栈

- **前端框架**：Next.js、React
- **区块链交互**：Sui、@mysten/sui.js
- **身份认证**：Enoki zkLogin
- **样式库**：Tailwind CSS
- **UI 组件**：shadcn/ui

## 环境要求

- **Node.js** 18.x
- **npm** 或 **yarn**
- 访问 **Sui 测试网络**

## 本地开发

### 克隆仓库

```bash
git clone https://github.com/xiaodi007/SuiLucky.git
cd ./SuiLucky
```

### 安装依赖

```bash
yarn install

```

### 配置Enoki API keys 和 Google Client ID


[参考](https://github.com/sui-foundation/enoki-example-app)


### 配置环境变量

在项目根目录下创建一个 `.env.local` 文件，并添加以下内容：

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的Google客户端ID
# 添加其他需要的环境变量
```

**注意**：请确保不要将 `.env.local` 文件提交到版本控制系统中。

### 运行项目

```bash
yarn dev
```

项目将在 `http://localhost:3000` 上运行。


## 使用指南

### 登录

- 访问应用地址，点击 **“使用 Google 登录”** 按钮，通过 Enoki zkLogin 进行身份验证。

### 发红包

1. 登录后，在 **“发红包”** 卡片中：
   - 输入 **总金额（SUI）**。
   - 输入 **红包个数**。
   - 点击 **“发红包”** 按钮。
2. 生成的 **红包 ID** 将显示在下方，可以点击 **“复制”** 按钮进行复制。
3. 将 **红包 ID** 分享给他人，邀请他们领取红包。

### 抢红包

1. 在 **“抢红包”** 卡片中：
   - 输入收到的 **红包 ID**。
   - 点击 **“抢红包”** 按钮。
2. 如果领取成功，将显示领取的金额对象 ID，可点击 **“复制”** 按钮进行复制。

### 查看账户信息

- 点击导航栏右上角的账户信息，可以查看您的 **SUI 地址** 和 **余额**，并支持一键复制和跳转到区块链浏览器查看详情。

### 申请 SUI

- 如果余额不足，可以在账户信息中点击 **“申请 SUI”** 按钮，从测试网络水龙头获取 SUI。

## 智能合约

本项目依赖于在 **Sui 测试网络** 上部署的智能合约，包含以下函数：

[合约仓库](https://github.com/move-cn/lucky/blob/main/lucky/sources/lucky.move)


PACKAGE ID: 0x985e9a516e4dad0c671a176a09f160ca595c18a39a0254469281ed4526c2401f

- `send`：用于创建红包。
- `claim`：用于领取红包。


