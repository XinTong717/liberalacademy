import express from "express";

const app = express();
app.use(express.json());

// 云托管里用“环境变量”注入，不要写死在代码里
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/profiles", async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Missing SUPABASE_URL / SUPABASE_ANON_KEY" });
    }

    const url = `${SUPABASE_URL}/rest/v1/profiles?select=*`;

    const r = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const text = await r.text(); // 先拿文本，避免 JSON 解析报错吞信息
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

// 端口：CloudBase 示例常用 8080（文档示例也是 8080 监听）:contentReference[oaicite:3]{index=3}
// 同时兼容平台注入 PORT
const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`la-api listening on ${port}`));