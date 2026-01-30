# 自由学社 (Liberal Academy)

一个为中国休学自学生社区设计的网站，使用 Next.js、Tailwind CSS、shadcn/ui 和 Supabase 构建。

## 功能特性

- 🗺️ **地图页面**: 全屏地图显示用户位置（按城市）
- 🔐 **登录系统**: 支持手机号和邮箱登录（Magic Link）
- 👤 **个人资料**: 用户可以设置所在城市或位置
- 👥 **社群列表**: 显示微信兴趣群组列表

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS 4
- **UI 组件**: shadcn/ui
- **后端**: Supabase (MemFire Cloud)
- **地图**: 高德地图 (AMap) JS API

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local` 文件并填入您的密钥：

```env
# Supabase Configuration (MemFire Cloud)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gaode Map (AMap) API Key
NEXT_PUBLIC_AMAP_KEY=your_amap_api_key
```

### 3. 设置 Supabase 数据库

在 Supabase 中创建一个 `profiles` 表：

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read all profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看网站。

## 项目结构

```
├── app/
│   ├── login/          # 登录页面
│   ├── profile/        # 个人资料页面
│   ├── communities/    # 社群列表页面
│   ├── layout.tsx      # 根布局
│   └── page.tsx        # 首页（地图）
├── components/
│   ├── ui/             # shadcn/ui 组件
│   └── map.tsx         # 地图组件
├── lib/
│   ├── supabase/       # Supabase 客户端配置
│   └── utils.ts        # 工具函数
└── .env.local          # 环境变量（需要创建）
```

## 获取 API 密钥

### 高德地图 API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 创建应用并获取 Web 端 (JS API) 的 Key

### Supabase 配置

1. 访问 [MemFire Cloud](https://memfiredb.com/) 或 [Supabase](https://supabase.com/)
2. 创建新项目
3. 在项目设置中找到 API URL 和 Anon Key

## 开发说明

- 地图组件使用高德地图 JS API，需要有效的 API Key
- 用户数据目前使用模拟数据，后续可以连接到 Supabase 数据库
- 登录功能使用 Supabase Auth，支持手机号和邮箱 Magic Link
- 个人资料页面需要用户登录后才能访问

## 许可证

MIT
