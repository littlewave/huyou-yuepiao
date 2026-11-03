/**
 * The knowledge taxonomy: 12 Domains, each with Topics. A Topic id is `domain/topic`
 * (a third level, `domain/topic/sub`, is allowed and rolls up to its parent).
 * Eras are a separate axis (the 时间地图), and Lenses are weightings over Domains.
 */

export type DomainId =
  | "fabric"
  | "layers"
  | "everyday"
  | "infrastructure"
  | "ecology"
  | "food"
  | "architecture"
  | "culture"
  | "economy"
  | "society"
  | "countryside"
  | "rhythm";

export type TopicId = `${DomainId}/${string}`;

export interface Domain {
  id: DomainId;
  label: string;
  topics: { id: string; label: string }[];
}

export const DOMAINS: Domain[] = [
  {
    id: "fabric",
    label: "城市肌理与街巷",
    topics: [
      { id: "lilong", label: "里弄与石库门" },
      { id: "street", label: "马路、路名与街廓" },
      { id: "boundary", label: "边界与断裂带" },
      { id: "renewal", label: "城市更新" },
    ],
  },
  {
    id: "layers",
    label: "城市历史与时代地层",
    topics: [
      { id: "palimpsest", label: "叠层遗存" },
      { id: "war-memory", label: "战争记忆" },
      { id: "place-names", label: "地名与区划变迁" },
      { id: "archives", label: "博物馆与档案" },
    ],
  },
  {
    id: "everyday",
    label: "市井生活与社会观察",
    topics: [
      { id: "wet-market", label: "菜场" },
      { id: "neighbourhood", label: "邻里与社区" },
      { id: "public-space", label: "公共空间的使用" },
      { id: "street-economy", label: "小店与街头经济" },
      { id: "ageing", label: "老年生活" },
    ],
  },
  {
    id: "infrastructure",
    label: "工业文明与基础设施",
    topics: [
      { id: "industrial-heritage", label: "工业遗产" },
      { id: "port", label: "港口与航运" },
      { id: "water", label: "供水与排水" },
      { id: "energy", label: "电力与能源" },
      { id: "transit", label: "轨交、轮渡与交通" },
      { id: "communications", label: "邮电与通信" },
    ],
  },
  {
    id: "ecology",
    label: "江河、自然与城市生态",
    topics: [
      { id: "rivers", label: "江河水系" },
      { id: "wetland", label: "湿地与候鸟" },
      { id: "urban-green", label: "城市绿地" },
      { id: "plants", label: "植物" },
      { id: "biodiversity", label: "物种与生物多样性" },
      { id: "flood", label: "防汛与海塘" },
    ],
  },
  {
    id: "food",
    label: "饮食文化与商业生态",
    topics: [
      { id: "local-cuisine", label: "本帮与地方风味" },
      { id: "breakfast", label: "早点与小吃" },
      { id: "markets", label: "市集" },
      { id: "retail", label: "商业形态变迁" },
    ],
  },
  {
    id: "architecture",
    label: "建筑、设计与城市美学",
    topics: [
      { id: "period-styles", label: "近代建筑风格" },
      { id: "modernist", label: "现代主义" },
      { id: "contemporary", label: "当代建筑" },
      { id: "adaptive-reuse", label: "改造再利用" },
      { id: "landscape", label: "景观设计" },
      { id: "signage", label: "字体与招牌" },
    ],
  },
  {
    id: "culture",
    label: "文学、艺术与思想史",
    topics: [
      { id: "literature", label: "文学" },
      { id: "visual-art", label: "美术" },
      { id: "film", label: "电影" },
      { id: "stage", label: "音乐与剧场" },
      { id: "publishing", label: "出版与书店" },
      { id: "science", label: "科学与技术史" },
      { id: "exchange", label: "宗教与西学东渐" },
      { id: "religion", label: "寺庙与信仰" },
    ],
  },
  {
    id: "economy",
    label: "经济、产业与全球化",
    topics: [
      { id: "finance", label: "金融" },
      { id: "trade", label: "贸易" },
      { id: "manufacturing", label: "制造业" },
      { id: "tech", label: "科技与创新" },
      { id: "global", label: "外来资本与侨民" },
    ],
  },
  {
    id: "society",
    label: "社会结构与城市治理",
    topics: [
      { id: "planning", label: "城市规划" },
      { id: "housing", label: "住房" },
      { id: "migration", label: "移民与人口" },
      { id: "governance", label: "基层治理" },
      { id: "conservation", label: "保护制度" },
      { id: "municipal", label: "市政与垃圾分类" },
    ],
  },
  {
    id: "countryside",
    label: "郊野、乡村与江南文化",
    topics: [
      { id: "water-town", label: "水乡古镇" },
      { id: "farmland", label: "农田与乡村" },
      { id: "archaeology", label: "考古" },
      { id: "county-town", label: "县城与老城" },
      { id: "crafts", label: "手工艺" },
    ],
  },
  {
    id: "rhythm",
    label: "城市节律与特殊体验",
    topics: [
      { id: "morning", label: "清晨" },
      { id: "night", label: "夜间城市" },
      { id: "commute", label: "通勤高峰" },
      { id: "seasonal", label: "季节与节庆" },
      { id: "weather", label: "雨天与冬天" },
    ],
  },
];

export type EraId = "ancient" | "jiangnan" | "treaty-port" | "republic" | "early-prc" | "reform" | "pudong" | "now";

/** The 时间地图 axis. Years are the conventional breakpoints, not exact boundaries. */
export const ERAS: { id: EraId; label: string; from: number | null; to: number | null }[] = [
  { id: "ancient", label: "先民与古代", from: null, to: 1291 },
  { id: "jiangnan", label: "江南县城与市镇", from: 1292, to: 1842 },
  { id: "treaty-port", label: "开埠与租界", from: 1843, to: 1911 },
  { id: "republic", label: "民国", from: 1912, to: 1949 },
  { id: "early-prc", label: "工业城市年代", from: 1949, to: 1977 },
  { id: "reform", label: "改革开放初期", from: 1978, to: 1989 },
  { id: "pudong", label: "浦东开发与世博", from: 1990, to: 2010 },
  { id: "now", label: "当下的更新", from: 2011, to: null },
];

export type LensId = "detective" | "archaeologist" | "observer" | "engineer" | "critic" | "naturalist";

/** 探索身份: a way of looking, expressed as the Domains it leans on. Not a badge or a level. */
export const LENSES: { id: LensId; label: string; domains: DomainId[] }[] = [
  { id: "detective", label: "城市侦探", domains: ["fabric", "layers", "society"] },
  { id: "archaeologist", label: "城市考古学家", domains: ["layers", "countryside", "architecture"] },
  { id: "observer", label: "社会观察家", domains: ["everyday", "society", "food", "rhythm"] },
  { id: "engineer", label: "基础设施工程师", domains: ["infrastructure", "economy", "ecology"] },
  { id: "critic", label: "建筑评论家", domains: ["architecture", "fabric", "culture"] },
  { id: "naturalist", label: "自然观察员", domains: ["ecology", "countryside", "rhythm"] },
];

/** Domains the 生活地图 draws from: everyday life, public space and social life. */
export const LIFE_DOMAINS: DomainId[] = ["everyday", "food", "society", "rhythm"];

const DOMAIN_IDS = new Set(DOMAINS.map((d) => d.id));
const TOPIC_IDS = new Set(DOMAINS.flatMap((d) => d.topics.map((t) => `${d.id}/${t.id}`)));

export const domainOf = (topic: TopicId): DomainId => topic.split("/")[0] as DomainId;

/** True when the id is a known `domain/topic`, or a `domain/topic/sub` under one. */
export function isTopic(id: string): id is TopicId {
  const [d, t] = id.split("/");
  return DOMAIN_IDS.has(d as DomainId) && TOPIC_IDS.has(`${d}/${t}`);
}

export const domainsOf = (topics: TopicId[]): DomainId[] => [...new Set(topics.map(domainOf))];

export function topicLabel(id: TopicId): string {
  const [d, t] = id.split("/");
  return DOMAINS.find((x) => x.id === d)?.topics.find((x) => x.id === t)?.label ?? id;
}

/** How many items touch each Domain; zeroes included so gaps show. */
export function domainCoverage(items: { topics: TopicId[] }[]): Record<DomainId, number> {
  const out = Object.fromEntries(DOMAINS.map((d) => [d.id, 0])) as Record<DomainId, number>;
  for (const it of items) for (const d of domainsOf(it.topics)) out[d]++;
  return out;
}

/** Lenses an item speaks to, strongest first; ties keep LENSES order. */
export function lensesFor(topics: TopicId[]): LensId[] {
  const ds = new Set(domainsOf(topics));
  return LENSES.map((l) => ({ id: l.id, n: l.domains.filter((d) => ds.has(d)).length }))
    .filter((l) => l.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((l) => l.id);
}
