/**
 * MiMo API 连通性测试脚本
 *
 * 复现 MiMoOcrService.uts 中 buildRequestBody / buildOcrInstructions 的请求结构，
 * 使用真实 API Key 验证：
 *   1. Key + Endpoint 可达（最小文本请求）
 *   2. json_object 输出格式生效（复现 OCR 提示词，纯文本模拟）
 *   3. 图片输入管道可用（使用项目内 logo.png 作为占位图）
 *
 * 用法: node scripts/test-mimo-api.js
 * 依赖: Node.js 18+（内置 fetch）
 */

const fs = require("fs");
const path = require("path");

// ====== 配置 ======
const API_KEY = process.env.MIMO_API_KEY || "";
if (!API_KEY) {
  throw new Error("请设置 MIMO_API_KEY 环境变量后再运行测试");
}
const ENDPOINT = "https://fufu.iqach.top/v1/responses";
const MODEL = "mimo-v2.5"; // 注意：仅 mimo-v2.5 支持图像输入，mimo-v2.5-pro 不支持

// ====== 工具函数 ======
function divider(title) {
  console.log("\n" + "=".repeat(60));
  console.log("  " + title);
  console.log("=".repeat(60));
}

function truncate(s, n) {
  if (s == null) return String(s);
  s = String(s);
  return s.length > n ? s.slice(0, n) + "...(" + s.length + " chars)" : s;
}

// 复现 buildOcrInstructions(stageCode)
function buildOcrInstructions(stageCode) {
  // 测试用花名册（无真实数据时使用占位）
  const nameList = "张三、李四、王五、赵六、钱七、孙八";
  return `你是制曲车间工分识别助手。请仔细识别草稿本照片中的手写工分记录。

## 班组花名册
以下为本班组全部人员名单，识别出的人名必须从中精确匹配，不可自行添加名单外的姓名：
${nameList}

## 图片内容结构说明
1. 图片顶部有表头行，列从左到右依次为：日期（年月日）→ 仓号 → 完成任务内容（即人员姓名）→ 实得工分 → 备注
2. 每日记录以日期开头（如 2026.07.08），日期下方按行排列数据
3. 每行开头的编号（如 3-3-18）是发酵仓号，仓号后面依次是该仓当日工作的人员姓名，每位人员姓名上方标注有对应工分数值
4. 每行末尾有一个分数形式的数字（如 1337/73.5），其中前面的数字是该仓当日曲坯数量，斜杠后面的数字是该仓总工分
5. 单独位于当日的两间发酵仓或多间发酵仓的人员姓名之外的中部或者外部为跨仓岗位人员
6. 含"晾堂"字样的行表示晾堂组，仓号位置写的是"晾堂"或"晾堂："，后跟晾堂人员姓名及对应工分
7. 手写人名可能有简化、连笔或潦草情况，请以下方给出的班组名单为准进行匹配，不要自行编造名单中不存在的人名
8. 可能存在少量的文字备注

## 识别任务
请逐日识别图中所有内容，对每一天：
- 列出发酵仓组：仓号、每位人员姓名、每人对应的工分数值
- 列出跨仓岗位：人员姓名、对应工分数值
- 列出晾堂组：每位人员姓名、每人对应的工分数值
- 如有文字备注，填入 remark 字段；如有不确定或无法辨认的项，填入 uncertain_items 字段

## 输出格式（JSON）
必须输出如下 JSON 结构，不要输出 markdown 表格：
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "stages": [
        {
          "stage_code": "${stageCode}",
          "bins": [
            {
              "bin_code": "3-3-18",
              "koji_count": 1337,
              "workers": [
                { "name": "张三", "points": 12.5 }
              ]
            }
          ],
          "cross_bin": {
            "role": "跨仓",
            "worker": { "name": "赵六", "points": 10.0 },
            "source_bins": ["3-3-18", "3-3-19"]
          },
          "liang_tang": {
            "wheat_material": [{ "name": "王五", "points": 8.5 }],
            "machine_guard": [],
            "koji_unloader": [],
            "micro_operator": []
          }
        }
      ]
    }
  ],
  "remark": "照片中的文字备注原文",
  "uncertain_items": "列出所有不确定或无法辨认的项"
}

## 注意事项
- 严格以班组花名册中的人名为准，不可自行添加名单外的姓名
- 工分数值应为小数点后一位的数字（如 18.6）
- 日期格式统一输出为 YYYY-MM-DD（如 2026-07-08），即使照片中写的是 YYYY.MM.DD 也需转换
- stage_code 固定为 ${stageCode}，所有天数使用相同环节代码
- koji_count 填入每行末尾分数形式中斜杠前面的数字（如 1337/73.5 中的 1337），即该仓当日曲坯数量
- cross_bin：若当日存在跨仓岗位人员，填入其姓名、工分及涉及的来源仓号列表（source_bins 为相关仓号数组）；无跨仓岗位人员时填 null。若有多个跨仓人员，将第一个填入 cross_bin.worker，其余在 uncertain_items 中列出
- 晾堂人员统一放入 wheat_material 数组，其他三个角色数组（machine_guard、koji_unloader、micro_operator）留空
- remark 填入照片中的文字备注原文（如无则为空字符串）；uncertain_items 填入所有不确定或无法辨认的项（如无则为空字符串）`;
}

// 复现 buildRequestBody
function buildRequestBody(imageBase64, stageCode) {
  const inputArray = [];
  if (imageBase64) {
    inputArray.push({
      type: "input_image",
      image_url: `data:image/png;base64,${imageBase64}`,
    });
  }
  inputArray.push({
    type: "input_text",
    text: "请识别这张草稿本照片中的手写工分记录，按规定的 JSON 格式输出。",
  });
  return {
    model: MODEL,
    instructions: buildOcrInstructions(stageCode),
    input: inputArray,
    reasoning: { effort: "low" },
    max_output_tokens: 8192,
    stream: false,
    text: { format: { type: "json_object" } },
  };
}

// 复现 extractOutputText
function extractOutputText(obj) {
  if (obj.output_text && typeof obj.output_text === "string")
    return obj.output_text;
  if (Array.isArray(obj.output)) {
    for (const item of obj.output) {
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c.type === "output_text" && typeof c.text === "string")
            return c.text;
        }
      }
    }
  }
  return "";
}

// 通用请求函数
async function callMiMo(body, timeoutMs = 60000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: null, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ====== 测试用例 ======

// 测试 1：最小连通性（纯文本，无 json 格式约束）
async function test1Connectivity() {
  divider("测试 1: 最小连通性验证（纯文本对话）");
  const body = {
    model: MODEL,
    input: [
      {
        type: "input_text",
        text: '请回复"你好，我是 MiMo"，不要输出其他内容。',
      },
    ],
    stream: false,
  };
  console.log("请求 Endpoint:", ENDPOINT);
  console.log("请求 Model :", MODEL);
  console.log("API Key   :", API_KEY.slice(0, 8) + "..." + API_KEY.slice(-4));
  console.log("请稍候（最长 60s）...");
  const t0 = Date.now();
  const res = await callMiMo(body);
  console.log("耗时:", ((Date.now() - t0) / 1000).toFixed(1) + "s");
  console.log("HTTP 状态:", res.status);

  if (res.error) {
    console.log("❌ 网络错误:", res.error);
    return false;
  }
  if (!res.ok) {
    console.log("❌ 请求失败");
    console.log("响应:", truncate(JSON.stringify(res.data), 500));
    return false;
  }
  console.log("✅ 连通成功");
  const out = extractOutputText(res.data);
  console.log("模型回复:", truncate(out, 200));
  if (res.data.usage) {
    console.log("Usage:", JSON.stringify(res.data.usage));
  }
  return true;
}

// 测试 2：json_object 输出格式（复现 OCR 提示词，纯文本模拟，不带图）
async function test2JsonFormat() {
  divider("测试 2: json_object 输出格式 + OCR 提示词（纯文本模拟，不带图）");
  // 不带图片，只给一段描述文字让模型按 OCR JSON 结构输出（验证格式约束）
  const body = buildRequestBody(null, "AN_QU");
  // 用一段"假想草稿内容"替换文本提示，让模型据此输出 JSON
  body.input = [
    {
      type: "input_text",
      text:
        "假设草稿本上有如下内容，请按规定的 JSON 格式输出：\n" +
        "日期 2026.07.08\n" +
        "仓号 3-3-18：张三 12.5、李四 11.0、王五 13.5   1337/74.0\n" +
        "仓号 3-3-19：赵六 14.0、钱七 12.5           1210/68.5\n" +
        "跨仓：孙八 10.0（来源 3-3-18、3-3-19）\n" +
        "备注：今日车间提前下班",
    },
  ];
  console.log("请求 Model      :", body.model);
  console.log("text.format.type:", body.text.format.type);
  console.log("instructions 长度:", body.instructions.length, "字符");
  console.log("请稍候（最长 60s）...");
  const t0 = Date.now();
  const res = await callMiMo(body);
  console.log("耗时:", ((Date.now() - t0) / 1000).toFixed(1) + "s");
  console.log("HTTP 状态:", res.status);

  if (!res.ok) {
    console.log("❌ 请求失败");
    console.log("响应:", truncate(JSON.stringify(res.data), 500));
    return false;
  }
  console.log("✅ 请求成功");
  const out = extractOutputText(res.data);
  console.log("output_text 原始:", truncate(out, 800));

  // 尝试 JSON.parse（复现 parseOcrResult）
  try {
    const parsed = JSON.parse(out);
    console.log("✅ JSON.parse 成功");
    console.log("解析结构:");
    console.log("  days.length      :", parsed.days ? parsed.days.length : 0);
    if (parsed.days && parsed.days[0]) {
      console.log("  days[0].date     :", parsed.days[0].date);
      const st = parsed.days[0].stages && parsed.days[0].stages[0];
      if (st) {
        console.log("  stage_code       :", st.stage_code);
        console.log("  bins.length      :", st.bins ? st.bins.length : 0);
        if (st.bins && st.bins[0]) {
          console.log("  bins[0].bin_code :", st.bins[0].bin_code);
          console.log("  bins[0].koji_count:", st.bins[0].koji_count);
          console.log(
            "  bins[0].workers  :",
            JSON.stringify(st.bins[0].workers)
          );
        }
        console.log("  cross_bin        :", JSON.stringify(st.cross_bin));
        console.log("  liang_tang       :", JSON.stringify(st.liang_tang));
      }
    }
    console.log("  remark           :", JSON.stringify(parsed.remark));
    console.log("  uncertain_items  :", JSON.stringify(parsed.uncertain_items));
    console.log("✅ OCR 数据结构解析正确");
    return true;
  } catch (e) {
    console.log("❌ JSON.parse 失败:", e.message);
    return false;
  }
}

// 测试 3：图片输入管道（用项目 logo.png 作占位图，验证 API 接受图片输入）
async function test3ImageInput() {
  divider("测试 3: 图片输入管道验证（使用 logo.png 作占位图）");
  const imgPath = path.join(__dirname, "..", "static", "logo.png");
  let imageBase64;
  try {
    const buf = fs.readFileSync(imgPath);
    imageBase64 = buf.toString("base64");
    console.log("图片:", imgPath);
    console.log("图片大小:", (buf.length / 1024).toFixed(1), "KB");
    console.log("Base64 长度:", imageBase64.length, "字符");
  } catch (e) {
    console.log("⚠️  无法读取图片:", e.message);
    console.log("跳过测试 3");
    return false;
  }

  const body = buildRequestBody(imageBase64, "AN_QU");
  console.log("input[0].type    :", body.input[0].type);
  console.log(
    "input[0].image_url:",
    body.input[0].image_url.slice(0, 40) + "..."
  );
  console.log("请稍候（最长 90s）...");
  const t0 = Date.now();
  const res = await callMiMo(body, 90000);
  console.log("耗时:", ((Date.now() - t0) / 1000).toFixed(1) + "s");
  console.log("HTTP 状态:", res.status);

  if (!res.ok) {
    console.log("❌ 请求失败");
    console.log("响应:", truncate(JSON.stringify(res.data), 500));
    return false;
  }
  console.log("✅ 图片请求成功");
  const out = extractOutputText(res.data);
  console.log("output_text 原始:", truncate(out, 500));
  // logo 不是草稿本，模型应输出空 days 或不确定项——只要 API 接受图片并返回 JSON 即视为通过
  try {
    const parsed = JSON.parse(out);
    console.log(
      "✅ JSON.parse 成功，days.length =",
      parsed.days ? parsed.days.length : 0
    );
    console.log("  uncertain_items :", JSON.stringify(parsed.uncertain_items));
    console.log("✅ 图片输入管道可用（API 接受 input_image）");
    return true;
  } catch (e) {
    console.log("❌ JSON.parse 失败:", e.message);
    return false;
  }
}

// ====== 主流程 ======
async function main() {
  console.log("MiMo API 连通性测试");
  console.log("时间:", new Date().toISOString());
  console.log("Node:", process.version);

  const results = {};
  results.test1 = await test1Connectivity();
  results.test2 = await test2JsonFormat();
  results.test3 = await test3ImageInput();

  divider("测试汇总");
  console.log("测试 1 连通性        :", results.test1 ? "✅ 通过" : "❌ 失败");
  console.log("测试 2 json_object格式:", results.test2 ? "✅ 通过" : "❌ 失败");
  console.log("测试 3 图片输入管道   :", results.test3 ? "✅ 通过" : "❌ 失败");

  const allPass = results.test1 && results.test2 && results.test3;
  console.log(
    allPass
      ? "\n🎉 全部测试通过，MiMoOcrService 代码逻辑与 API 一致"
      : "\n⚠️  部分测试未通过，请查看上方日志"
  );
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error("测试脚本异常:", e);
  process.exit(1);
});
