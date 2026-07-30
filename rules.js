/* ===== 白沟AI匹配台 · 核心规则引擎 ===== */

// ===== 配置 =====
const CONFIG = {
  // 角色定义
  ROLES: {
    factory: { id: '加工厂', label: '加工厂', icon: '🏭', desc: '承接代工订单', type: 'supplier' },
    buyer: { id: '采购商', label: '采购商', icon: '🛒', desc: '寻找加工厂/供货商', type: 'buyer' },
    material: { id: '辅料供应商', label: '辅料供应商', icon: '🧵', desc: '供应五金/面料/拉链等', type: 'material' },
    ecommerce: { id: '电商卖家', label: '电商卖家', icon: '📱', desc: '寻找货源/代运营', type: 'ecommerce' },
    logistics: { id: '物流', label: '物流', icon: '🚛', desc: '货运/快递服务', type: 'supplier' },
  },

  // 品类定义
  CATEGORIES: [
    { id: '女包', label: '女包', icon: '👜' },
    { id: '双肩包', label: '双肩包', icon: '🎒' },
    { id: '行李箱', label: '行李箱', icon: '🧳' },
    { id: '手提包', label: '手提包', icon: '🛍' },
    { id: '钱包', label: '钱包', icon: '👛' },
    { id: '化妆包', label: '化妆包', icon: '💄' },
    { id: '电脑包', label: '电脑包', icon: '💻' },
    { id: '腰包', label: '腰包', icon: '🎽' },
  ],

  // 材料类型
  MATERIALS: ['五金配件', '拉链', '面料', '里布', '织带', '扣具', '缝纫线', '拉头', '拉杆', '轮子'],

  // 匹配规则：角色互补对
  MATCH_PAIRS: [
    { from: '采购商', to: '加工厂', weight: 10, desc: '采购商找加工厂' },
    { from: '加工厂', to: '采购商', weight: 10, desc: '加工厂找订单' },
    { from: '加工厂', to: '辅料供应商', weight: 8, desc: '加工厂采购辅料' },
    { from: '辅料供应商', to: '加工厂', weight: 8, desc: '辅料供应商找客户' },
    { from: '电商卖家', to: '加工厂', weight: 7, desc: '电商卖家找代工' },
    { from: '电商卖家', to: '采购商', weight: 6, desc: '电商卖家找货源' },
    { from: '采购商', to: '辅料供应商', weight: 5, desc: '采购商找原材料' },
    { from: '加工厂', to: '物流', weight: 4, desc: '加工厂找货运' },
  ],
};

// ===== 样本数据 =====
const SAMPLES = [
  {
    id: 'p001',
    role: '采购商',
    category: '女包',
    quantity: '2000件',
    delivery: '15天内',
    price: '25元/件',
    title: '急寻女包加工厂，2000件大货',
    raw: '需要一家能做女包的加工厂，款式简单，月出2000件左右，15天交货，能做的联系我。要求做工精细，价格好商量。',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'p002',
    role: '加工厂',
    category: '女包',
    quantity: '500-2000件',
    delivery: '7-15天',
    price: '面议',
    title: '白沟本地加工厂，承接女包代工',
    raw: '白沟本地加工厂，有20个熟练工，专业做女包、双肩包，月产能2000件以上，交期准时，质量有保证。欢迎来厂考察。',
    timestamp: Date.now() - 7200000,
  },
  {
    id: 'p003',
    role: '辅料供应商',
    category: '通用',
    quantity: '不限',
    delivery: '现货',
    price: '面议',
    title: '箱包五金配件厂家直销，批发价',
    raw: '工厂直销各种箱包五金配件，女包夹子、拉链头、D扣、日字扣等，现货充足，价格优惠，支持小批量拿货。',
    timestamp: Date.now() - 10800000,
  },
  {
    id: 'p004',
    role: '采购商',
    category: '双肩包',
    quantity: '500件',
    delivery: '30天内',
    price: '30元/件',
    title: '找双肩包加工厂，外贸订单500件',
    raw: '外贸订单，需要500个双肩包，要求做工好，面料要防水。30天交期，有出口经验的工厂优先。',
    timestamp: Date.now() - 14400000,
  },
  {
    id: 'p005',
    role: '电商卖家',
    category: '女包',
    quantity: '200件',
    delivery: '7天内',
    price: '20元/件',
    title: '拼多多卖家，找女包一件代发或小批量',
    raw: '我是做拼多多的，店铺刚起步，找女包货源，一开始200件试试，卖得好长期合作。需要一件代发或者小批量供货。',
    timestamp: Date.now() - 18000000,
  },
  {
    id: 'p006',
    role: '加工厂',
    category: '行李箱',
    quantity: '1000件以上',
    delivery: '20天',
    price: '面议',
    title: '承接行李箱加工，铝框/拉链款均可',
    raw: '本厂专业做行李箱，铝框款和拉链款都能做，月产能1000件以上。有稳定的配件供应商，质量可靠。',
    timestamp: Date.now() - 21600000,
  },
  {
    id: 'p007',
    role: '辅料供应商',
    category: '通用',
    quantity: '大量现货',
    delivery: '当天发货',
    price: '面议',
    title: '箱包专用拉链、拉头批发',
    raw: '专供箱包用拉链、拉头，3号5号8号都有，金属/尼龙/树脂各种材质，现货当天发，量大从优。',
    timestamp: Date.now() - 25200000,
  },
  {
    id: 'p008',
    role: '采购商',
    category: '钱包',
    quantity: '3000件',
    delivery: '25天内',
    price: '8元/件',
    title: '外贸订单，找钱包加工厂，3000件',
    raw: '外贸订单找钱包加工厂，数量3000件，款式简单，25天交期，需要有出口经验的工厂，质量要过关。',
    timestamp: Date.now() - 28800000,
  },
];

// ===== 帖子解析 =====
function parsePost(raw) {
  const result = {
    role: '',
    category: '',
    quantity: '',
    delivery: '',
    price: '',
    raw: raw,
  };

  // 角色识别
  const rolePatterns = [
    { regex: /加工厂|做包|代工|承接|加工|车间|工人|熟练工|产能|来厂考察/, role: '加工厂' },
    { regex: /找.*加工|找.*做|寻.*加工|求.*加工|找.*代工|需要.*加工|找.*工厂|急寻|找.*生产/, role: '采购商' },
    { regex: /五金|拉链|面料|辅料|配件|里布|织带|扣具|拉头|缝纫线|批发|厂家直销|供货/, role: '辅料供应商' },
    { regex: /电商|拼多多|淘宝|抖音|直播|一件代发|货源|拿货|店铺|卖家/, role: '电商卖家' },
    { regex: /物流|货运|快递|拉货|运输|车辆/, role: '物流' },
  ];

  for (const { regex, role } of rolePatterns) {
    if (regex.test(raw)) {
      result.role = role;
      break;
    }
  }

  // 品类识别
  const catPatterns = [
    { regex: /女包|女士包|女式包/, cat: '女包' },
    { regex: /双肩包|背包/, cat: '双肩包' },
    { regex: /行李箱|旅行箱|拉杆箱/, cat: '行李箱' },
    { regex: /手提包|拎包/, cat: '手提包' },
    { regex: /钱包|钱夹/, cat: '钱包' },
    { regex: /化妆包|洗漱包/, cat: '化妆包' },
    { regex: /电脑包|笔记本包/, cat: '电脑包' },
    { regex: /腰包|胸包/, cat: '腰包' },
  ];

  for (const { regex, cat } of catPatterns) {
    if (regex.test(raw)) {
      result.category = cat;
      break;
    }
  }

  // 数量提取
  const qtyMatch = raw.match(/(\d+)\s*件/);
  if (qtyMatch) {
    const qty = parseInt(qtyMatch[1]);
    if (qty < 100) result.quantity = '100件以下';
    else if (qty <= 500) result.quantity = '100-500件';
    else if (qty <= 2000) result.quantity = '500-2000件';
    else result.quantity = '2000件以上';
  }

  // 交期提取
  const delMatch = raw.match(/(\d+)\s*天(?:交|出|完|做|之)/);
  if (delMatch) {
    const days = parseInt(delMatch[1]);
    if (days <= 7) result.delivery = '7天内';
    else if (days <= 15) result.delivery = '15天内';
    else if (days <= 30) result.delivery = '30天内';
    else result.delivery = '30天以上';
  }

  // 价格提取
  const priceMatch = raw.match(/(\d+\.?\d*)\s*元\s*[\/每]/);
  if (priceMatch) {
    result.price = priceMatch[0];
  }

  return result;
}

// ===== AI翻译（生成卡点+建议+风险） =====
function translate(parsed) {
  const cards = [];

  // 根据角色和品类生成建议
  if (parsed.role === '采购商') {
    if (parsed.category === '女包') {
      cards.push({
        pain: '女包加工厂多，但做工水平参差不齐',
        advice: '建议要求工厂提供样品，确认做工再下单',
        risk: '警惕低价陷阱，部分工厂用劣质面料充好',
      });
    }
    if (parsed.quantity && (parsed.quantity.includes('2000') || parsed.quantity.includes('以上'))) {
      cards.push({
        pain: '大单对接小工厂可能出现产能不足',
        advice: '建议分批次下单，或同时对接2-3家工厂备选',
        risk: '单一工厂交期延误风险高，旺季尤其明显',
      });
    }
    if (parsed.delivery && (parsed.delivery.includes('7天') || parsed.delivery.includes('15天'))) {
      cards.push({
        pain: '交期紧张，部分工厂可能加价或拒单',
        advice: '提前沟通交期，合同中明确延期赔偿条款',
        risk: '赶工期容易导致质量下降，建议预留质检时间',
      });
    }
  }

  if (parsed.role === '加工厂') {
    cards.push({
      pain: '散单多、大单少，产能利用率不稳定',
      advice: '建议在平台多做展示，上传工厂实拍图和样品图',
      risk: '赊账加工风险大，建议新客户先收定金再开工',
    });
    if (parsed.category === '女包') {
      cards.push({
        pain: '女包款式更新快，老款设备可能过时',
        advice: '关注热门款式，提前备好对应五金模具',
        risk: '跟风做爆款容易扎堆，利润空间被压缩',
      });
    }
  }

  if (parsed.role === '电商卖家') {
    cards.push({
      pain: '小批量拿货价格高，利润空间小',
      advice: '建议先拿样品测试市场，卖得好再谈量价',
      risk: '盲目压价可能导致供应商偷工减料',
    });
  }

  if (parsed.role === '辅料供应商') {
    cards.push({
      pain: '五金配件价格透明，利润薄',
      advice: '建议差异化经营，做特色款式或批量定制',
      risk: '赊账客户多，建议控制账期，及时催款',
    });
  }

  // 通用风险
  cards.push({
    pain: '箱包加工行业拖欠加工费问题常见',
    advice: '建议通过平台担保交易，或签订正式合同',
    risk: '对方身份不明时，不要轻易支付定金或发货',
  });

  return cards;
}

// ===== 智能匹配 =====
function runMatch(targetPost, allPosts) {
  const matches = [];

  for (const post of allPosts) {
    if (post.id === targetPost.id) continue;

    let score = 0;
    const reasons = [];

    // 角色互补匹配
    const pair = CONFIG.MATCH_PAIRS.find(
      p => p.from === targetPost.role && p.to === post.role
    );
    if (pair) {
      score += pair.weight;
      reasons.push(pair.desc);
    }

    // 品类匹配
    if (targetPost.category && post.category) {
      if (targetPost.category === post.category) {
        score += 5;
        reasons.push(`品类一致：${targetPost.category}`);
      } else if (post.category === '通用') {
        score += 2;
        reasons.push('通用品类，可适配');
      }
    }

    // 数量匹配
    if (targetPost.quantity && post.quantity) {
      const qtyOverlap = checkQuantityOverlap(targetPost.quantity, post.quantity);
      if (qtyOverlap) {
        score += 3;
        reasons.push('数量范围匹配');
      }
    }

    // 交期匹配
    if (targetPost.delivery && post.delivery) {
      const delOverlap = checkDeliveryOverlap(targetPost.delivery, post.delivery);
      if (delOverlap) {
        score += 2;
        reasons.push('交期可协商');
      }
    }

    if (score > 0) {
      matches.push({
        post: post,
        score: Math.min(score, 20),
        reasons: reasons,
        matchPercent: Math.round((score / 20) * 100),
      });
    }
  }

  // 按匹配度排序
  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 5);
}

function checkQuantityOverlap(q1, q2) {
  const ranges = {
    '100件以下': [0, 100],
    '100-500件': [100, 500],
    '500-2000件': [500, 2000],
    '2000件以上': [2000, Infinity],
    '1000件以上': [1000, Infinity],
    '不限': [0, Infinity],
    '大量现货': [0, Infinity],
  };

  const r1 = ranges[q1] || [0, Infinity];
  const r2 = ranges[q2] || [0, Infinity];

  return r1[0] <= r2[1] && r2[0] <= r1[1];
}

function checkDeliveryOverlap(d1, d2) {
  // 简化：只要不是极端不匹配就认为可协商
  return true;
}

// ===== 搜索筛选 =====
function filterPosts(posts, filters) {
  return posts.filter(post => {
    if (filters.role && post.role !== filters.role) return false;
    if (filters.category && post.category !== filters.category && post.category !== '通用') return false;
    if (filters.quantity && post.quantity !== filters.quantity) return false;
    if (filters.delivery && post.delivery !== filters.delivery) return false;
    return true;
  });
}

// ===== 生成唯一ID =====
function generateId() {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===== 格式化时间 =====
function formatTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

// ===== 获取角色类型（用于样式） =====
function getRoleType(role) {
  const map = {
    '加工厂': 'supplier',
    '采购商': 'buyer',
    '辅料供应商': 'material',
    '电商卖家': 'ecommerce',
    '物流': 'supplier',
  };
  return map[role] || 'supplier';
}

// ===== 导出（全局可用） =====
window.BaigouRules = {
  CONFIG,
  SAMPLES,
  parsePost,
  translate,
  runMatch,
  filterPosts,
  generateId,
  formatTime,
  getRoleType,
};