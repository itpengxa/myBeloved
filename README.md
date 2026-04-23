# 心上人 - 情侣关系维护微信小程序

一款专注于情侣关系维护与情感升温的微信小程序，通过AI智能生成情书、生活点滴记录、纪念日提醒等功能，帮助用户追求心仪对象或维系现有感情。

## 功能特性

- **AI智能情书**：基于生活点滴自动生成专属情书，每周推送
- **生活点滴记录**：图文记录美好瞬间，支持位置、天气、心情标签
- **纪念日提醒**：生日、纪念日智能提醒，支持农历转换
- **对象绑定**：邀请码/扫码绑定情侣，共享甜蜜空间
- **微信订阅消息**：重要时刻主动推送，不错过任何纪念日

## 技术架构

- **前端**：微信小程序 (WXML + WXSS + JavaScript)
- **后端**：微信云开发云函数 (Node.js)
- **数据库**：MySQL 8.0
- **存储**：阿里云OSS (图片存储)
- **AI服务**：Kimi API (Moonshot AI)

## 项目结构

```
myBeloved/
├── cloudfunctions/          # 云函数目录
│   ├── user/               # 用户模块 (登录/信息)
│   ├── partner/            # 对象绑定模块
│   ├── moment/             # 生活点滴模块
│   ├── reminder/           # 提醒模块
│   ├── letter/             # 情书模块
│   ├── notify/             # 通知设置模块
│   ├── trigger-dailyNotify/    # 每日通知触发器
│   ├── trigger-dailyReminder/  # 每日提醒触发器
│   └── trigger-weeklyLetter/   # 每周情书触发器
├── miniprogram/            # 小程序前端
│   ├── pages/              # 页面目录
│   ├── images/             # 图片资源
│   ├── app.js              # 应用入口
│   └── app.json            # 全局配置
├── cloudfunctions/init.sql # 数据库初始化脚本
└── .env.example            # 环境变量模板
```

## 快速开始

### 1. 准备工作

- 注册[微信小程序](https://mp.weixin.qq.com/)账号
- 开通微信云开发环境
- 准备 MySQL 数据库（建议使用阿里云RDS）
- 注册[阿里云OSS](https://www.aliyun.com/product/oss)并创建Bucket
- 注册[Kimi API](https://platform.moonshot.cn/)获取API Key

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入你的实际配置
```

### 3. 初始化数据库

```bash
mysql -u your_username -p < cloudfunctions/init.sql
```

### 4. 配置小程序

1. 使用微信开发者工具打开 `miniprogram/` 目录
2. 在 `project.config.json` 中修改 `appid` 为你的小程序AppID
3. 在 `miniprogram/app.js` 中修改云开发环境ID
4. 在 `miniprogram/app.json` 中申请订阅消息模板ID

### 5. 部署云函数

在微信开发者工具中：
1. 右键点击每个云函数目录，选择"创建并部署：云端安装依赖"
2. 或全选后批量部署

### 6. 配置定时触发器

在微信公众平台 - 云开发 - 云函数中，为以下云函数配置定时触发器：

| 云函数 | 触发规则 | 说明 |
|--------|---------|------|
| trigger-dailyNotify | `0 0 20 * * *` | 每天20:00发送问候 |
| trigger-dailyReminder | `0 5 0 * * *` | 每天00:05检查提醒 |
| trigger-weeklyLetter | `0 0 20 * * 0` | 每周日20:00生成情书 |

## 配置说明

### 订阅消息模板

在小程序公众平台申请以下订阅消息模板：

| 场景 | 建议关键词 |
|------|-----------|
| 每周情书 | 通知类型、内容摘要、发送时间 |
| 特别提醒 | 提醒事项、提醒时间、备注 |
| 对象绑定 | 绑定状态、对方昵称、绑定时间 |
| 每日问候 | 问候类型、内容摘要、发送时间 |

将申请到的模板ID填入对应云函数的环境变量中。

### 阿里云OSS权限配置

1. 创建RAM角色，授予OSS写入权限
2. 配置STS临时凭证策略，限制上传路径为 `moments/{userId}/*`
3. 开启CDN加速（可选）

## 开发注意事项

- 所有云函数（除登录外）均需校验JWT Token
- 图片上传使用阿里云OSS STS临时凭证，有效期1小时
- 数据库查询全部使用参数化查询防止SQL注入
- 订阅消息需用户主动授权，授权次数有限

## License

MIT
