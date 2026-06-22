// /api/generate  —— Vercel Serverless 函数（Node）
// 作用：前端把参数发到这里，由它带着密钥去调大模型，再把话术返回。
// 密钥从环境变量读取，绝不写进代码。

const PHASES = {
  p1:{name:"开场 · 锁低年级", tc:"0:00–2:30", hint:"6~8句", brief:"开场前30秒就要让任何刚进来的人知道这是什么、给谁的、多少钱。先锁住学前到2年级的低年级家庭，强调门槛低、好上手、越早接触越好。"},
  p2:{name:"痛点 · 情绪唤起", tc:"2:30–5:30", hint:"7~9句", brief:"用主打情绪入口唤起家长的紧迫感与向往，落点是孩子的未来能力与可能性，不是机器人功能。"},
  p3:{name:"产品讲解 · 课程为核", tc:"5:30–8:30", hint:"8~10句", brief:"讲清楚买的到底是什么：课程体系是主体，机器人是孩子动手实践的载体。说清课程怎么循序渐进、孩子能学到什么。"},
  p4:{name:"信任 · 体系与服务", tc:"8:30–11:00", hint:"7~9句", brief:"建立信任：课程研发、配套服务、售后与陪伴式学习。可举普遍性的学习场景，但不得虚假承诺或保证结果。"},
  p5:{name:"价格 · 福利拆解", tc:"11:00–13:00", hint:"7~9句", brief:"把199元拆解出价值感，说清套装含什么、今日福利是什么（仅用真实福利）。这一段微锚点要密。"},
  p6:{name:"催单 · 收口", tc:"13:00–15:00", hint:"6~8句", brief:"收口规律：先即时正面回答一个具体的物流/到货顾虑（如发货时效、什么时候到、外地能不能发），紧接着给一句直接的、点名式的下单指令。不要把成交藏在软话里。"}
};

function sysPrompt(){
  return `你是核桃编程「小布2.0」抖音直播间的资深话术策划，精通15分钟循环直播打法。

【产品事实】
- 小布2.0，199元，编程机器人套装 + 少儿编程课程。
- 定位铁律：课程才是产品，机器人是交付载体与孩子动手实践的入口；讲解必须回到课程价值，不能把机器人当玩具卖。

【情绪入口】
- 卖的是孩子的未来能力与可能性，不是机器人功能堆砌。

【硬性红线 — 绝不触碰】
- 不讲「防手机沉迷 / 减少屏幕时间 / 戒手机」这类话术。
- 产品名称里「AI」和「编程」不能同时出现。
- 不得编造库存、虚假限量、假倒计时；催单只能基于提供的真实库存/活动状态，未提供则不制造任何紧迫感。
- 不用绝对化用语（最、第一、100%、唯一等），不承诺升学结果或保证录取，不做虚假对比与疗效式承诺。

【15分钟循环结构】
- 观众平均停留约53秒，所以核心信息（价格199、套装含什么、今日福利）要以「微锚点」形式约每60秒复述一次，让任何时间进来的人都能在1分钟内听全关键信息。
- 开场先锁低年级家庭。
- 收口规律：先即时正面回答一个具体的物流/到货顾虑，再给一句直接的、点名式的下单指令；不要把成交藏在长独白的软话里。

【输出格式 — 严格遵守】
- 只输出该阶段主播口播的中文话术，口语化、可直接念。
- 每句单独成行，不加序号、不加项目符号、不加引号。
- 凡是复述核心信息（价格199 / 套装含什么 / 今日福利）的微锚点句子，在该行最前面加标记：[锚]（后面紧跟一个空格再写话术）。
- 不要写旁白、不写括号舞台提示、不写任何标题或解释、不用markdown。`;
}

function userPrompt(phaseId, p){
  const ph = PHASES[phaseId];
  const stock = (p.stock||"").trim();
  const benefit = (p.benefit||"").trim();
  return `本场参数：
- 目标年级段：${p.grade||"混合人群（开场先锁学前~2年级）"}
- 主打情绪入口：${p.emotion||"AI时代不掉队的家长焦虑"}
- 主播风格：${p.style||"通用、清晰可念"}
- 真实库存/活动状态：${stock || "未提供 —— 本场不要出现任何限量、倒计时、紧迫感或催单施压话术"}
- 福利钩子：${benefit || "未提供 —— 不要编造具体赠品，如提及福利只做泛化引导"}

现在只写【${ph.name}】这一阶段（${ph.tc}）的主播口播话术，约${ph.hint}。
该阶段重点：${ph.brief}
记得按规则把复述核心信息的句子标成 [锚]。`;
}

export default async function handler(req, res){
  if(req.method !== "POST"){
    res.status(405).json({error:"只支持 POST"});
    return;
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if(!key){
    res.status(500).json({error:"服务器还没配置 DEEPSEEK_API_KEY，请到 Vercel 的环境变量里添加。"});
    return;
  }
  try{
    const { phase, params } = req.body || {};
    if(!PHASES[phase]){
      res.status(400).json({error:"未知阶段："+phase});
      return;
    }
    const r = await fetch("https://api.deepseek.com/chat/completions",{
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+key },
      body: JSON.stringify({
        model:"deepseek-chat",
        max_tokens:1000,
        temperature:0.8,
        messages:[
          {role:"system", content: sysPrompt()},
          {role:"user", content: userPrompt(phase, params||{})}
        ]
      })
    });
    const data = await r.json();
    if(!r.ok){
      res.status(502).json({error:"模型接口返回错误", detail:data});
      return;
    }
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    res.status(200).json({ text });
  }catch(e){
    res.status(500).json({error:"生成失败："+String(e && e.message || e)});
  }
}
