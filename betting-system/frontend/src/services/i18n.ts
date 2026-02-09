const zh = {
  // 通用
  appName: '年会押注',
  coins: '金币',
  wineGlass: '酒杯',
  confirm: '确认',
  cancel: '取消',
  delete: '删除',
  save: '保存',
  back: '返回',
  admin: '管理',
  logout: '退出',
  loading: '加载中...',
  serverError: '服务器错误',

  // 登录
  loginTitle: '年会押注',
  loginSubtitle: '输入姓名即可参与',
  enterName: '请输入你的姓名',
  adminPassword: '管理员密码',
  enterGame: '进入游戏',
  adminLogin: '管理员登录',
  backToNormal: '返回普通登录',
  loginSuccess: '登录成功！',
  loginFail: '登录失败',
  pleaseEnterName: '请输入姓名',

  // 主页
  noThemes: '暂无押注主题',
  waitingAdmin: '等待管理员创建主题...',
  ongoing: '进行中',
  ended: '已结束',
  prizePool: '奖池',
  betAmount: '押注金额',
  minBet: '最少',
  allIn: '全压',
  bet: '押注',
  alreadyBet: '你已押注',
  youWin: '恭喜你赢了！',
  youLose: '很遗憾，下次加油！',
  selectOption: '请选择一个选项',
  minBetError: '最小押注',
  maxBetError: '最大押注',
  insufficientCoins: '金币不足',
  betSuccess: '押注成功！',
  betFail: '押注失败',
  skipRound: '跳过本轮',
  skipped: '已跳过本轮',
  winRate: '赢率',
  persons: '人',
  gameOver: '游戏结束！总奖池已归零',
  wineGlassNote: '金币已用完，将以酒杯计数',
  yourWineGlasses: '你的酒杯',

  // 管理
  themeManage: '主题管理',
  userManage: '用户管理',
  settings: '设置',
  createTheme: '创建新主题',
  themeTitle: '主题标题',
  themeTitlePlaceholder: '如：年度最佳员工',
  description: '描述（可选）',
  options: '选项',
  addOption: '+ 添加选项',
  create: '创建主题',
  refreshStats: '刷新统计',
  selectWinner: '选为赢家',
  randomSettle: '随机开奖',
  winner: '获胜',
  settled: '结算完成',
  settleConfirm: '确定公布结果？将自动结算所有押注',
  deleteConfirm: '确定删除？未结算的押注将退还金币',
  deleted: '已删除',
  totalUsers: '共 {count} 位用户',
  giveCoins: '发放',
  giveSuccess: '发放成功！',
  rounds: '轮次',
  settlementMode: '开奖方式',
  adminPick: '管理员选择',
  systemRandom: '系统随机',

  // 设置
  systemSettings: '系统设置',
  initialCoins: '初始金币',
  minBetAmount: '最小押注金额',
  maxBetAmount: '最大押注金额',
  totalPrizePool: '总奖池金额',
  currentPool: '当前奖池',
  saveSuccess: '保存成功！',
  saveFail: '保存失败',
  resetPool: '重置奖池',
  wan: '万',
  leaderboard: '排行榜',
  rank: '排名',
  proportion: '占比',
  estimatedPrize: '预估奖金',
  noUsers: '暂无数据',
  springGreeting: '马年新春快乐',
  totalCoinsAll: '全员金币总额',
  pending: '未开始',
  startTheme: '开始',
  wineGlassRanking: '酒杯排行',
  glasses: '杯',
  themeLibrary: '主题库',
  total: '合计',
  prizeTier: '奖金等级',
  deleteUser: '删除',
  deleteUserConfirm: '确定删除该用户？该用户的所有押注也会被删除',
  userDeleted: '用户已删除',
  wonLabel: '赢了',
  lostLabel: '未中奖',
  noBetLabel: '未参与',
  editTheme: '编辑',
  editSave: '保存修改',
  editSuccess: '修改成功！',
  rules: '规则',
  rulesTitle: '游戏规则',
  rulesClose: '我知道了',
  rulesContent: `【基本规则】
每位玩家初始获得 40万 金币，在管理员创建的押注主题中选择你认为正确的选项进行押注。

【押注规则】
• 每个主题只能押注一次，押注后不可更改
• 押注金额范围：最低 5万，最高 1000万
• 以 5万 为最小单位递增
• 可选择"全压"一键押上所有金币（不超过上限）
• 可选择"跳过本轮"不参与当前主题

【酒杯模式 🍷】
• 当金币用完（为0）时，自动进入酒杯模式
• 酒杯模式下每次押注固定 5万，不扣除金币
• 每次酒杯押注记录 1 个酒杯
• 酒杯数量代表"罚酒杯数"，年会现场兑现

【开奖方式】
• 管理员指定：管理员选择正确答案
• 系统随机：系统随机抽取一个选项作为赢家

【结算规则】
• 押错的金币汇入该主题奖池
• 押对者按各自押注金额比例瓜分奖池
• 计算公式：返还原押注 + 奖池 × (你的押注 ÷ 所有赢家押注总额)
• 酒杯模式押对者额外获得 5万 金币奖励
• 若无人押中正确选项，所有金币原路退还

【排行榜 & 奖金】
• 排行榜按金币数量降序，显示前 25 名
• 固定奖金等级：
  🥇 第1名：300万  🥈 第2名：150万  🥉 第3名：100万
  第4-10名：各50万  第11-25名：各10万
• 总奖池 = 全员金币总额`,
};

const en: typeof zh = {
  appName: 'Party Betting',
  coins: 'Coins',
  wineGlass: 'Glasses',
  confirm: 'Confirm',
  cancel: 'Cancel',
  delete: 'Delete',
  save: 'Save',
  back: 'Back',
  admin: 'Admin',
  logout: 'Logout',
  loading: 'Loading...',
  serverError: 'Server error',

  loginTitle: 'Party Betting',
  loginSubtitle: 'Enter your name to join',
  enterName: 'Enter your name',
  adminPassword: 'Admin password',
  enterGame: 'Join Game',
  adminLogin: 'Admin Login',
  backToNormal: 'Back to normal login',
  loginSuccess: 'Login success!',
  loginFail: 'Login failed',
  pleaseEnterName: 'Please enter your name',

  noThemes: 'No betting topics yet',
  waitingAdmin: 'Waiting for admin to create topics...',
  ongoing: 'Open',
  ended: 'Closed',
  prizePool: 'Prize Pool',
  betAmount: 'Bet amount',
  minBet: 'Min',
  allIn: 'All In',
  bet: 'Bet',
  alreadyBet: 'You bet',
  youWin: 'Congratulations, you won!',
  youLose: 'Better luck next time!',
  selectOption: 'Please select an option',
  minBetError: 'Minimum bet',
  maxBetError: 'Maximum bet',
  insufficientCoins: 'Insufficient coins',
  betSuccess: 'Bet placed!',
  betFail: 'Bet failed',
  skipRound: 'Skip',
  skipped: 'Skipped this round',
  winRate: 'Win Rate',
  persons: 'bets',
  gameOver: 'Game Over! Prize pool is empty',
  wineGlassNote: 'No coins left, counting wine glasses',
  yourWineGlasses: 'Your glasses',

  themeManage: 'Topics',
  userManage: 'Users',
  settings: 'Settings',
  createTheme: 'Create Topic',
  themeTitle: 'Title',
  themeTitlePlaceholder: 'e.g. Best Employee',
  description: 'Description (optional)',
  options: 'Options',
  addOption: '+ Add option',
  create: 'Create',
  refreshStats: 'Refresh',
  selectWinner: 'Set Winner',
  randomSettle: 'Random Draw',
  winner: 'Winner',
  settled: 'Settled',
  settleConfirm: 'Announce result? All bets will be settled automatically.',
  deleteConfirm: 'Delete? Unsettled bets will be refunded.',
  deleted: 'Deleted',
  totalUsers: '{count} users',
  giveCoins: 'Give',
  giveSuccess: 'Coins given!',
  rounds: 'Rounds',
  settlementMode: 'Settlement',
  adminPick: 'Admin Pick',
  systemRandom: 'Random',

  systemSettings: 'System Settings',
  initialCoins: 'Initial Coins',
  minBetAmount: 'Min Bet',
  maxBetAmount: 'Max Bet',
  totalPrizePool: 'Total Prize Pool',
  currentPool: 'Current Pool',
  saveSuccess: 'Saved!',
  saveFail: 'Save failed',
  resetPool: 'Reset Pool',
  wan: '0K',
  leaderboard: 'Leaderboard',
  rank: 'Rank',
  proportion: 'Share',
  estimatedPrize: 'Est. Prize',
  noUsers: 'No data',
  springGreeting: 'Happy Year of the Horse',
  totalCoinsAll: 'Total Coins',
  pending: 'Pending',
  startTheme: 'Start',
  wineGlassRanking: 'Wine Glass Rank',
  glasses: 'glasses',
  themeLibrary: 'Library',
  total: 'Total',
  prizeTier: 'Prize Tier',
  deleteUser: 'Delete',
  deleteUserConfirm: 'Delete this user? All their bets will also be removed.',
  userDeleted: 'User deleted',
  wonLabel: 'Won',
  lostLabel: 'Lost',
  noBetLabel: 'No Bet',
  editTheme: 'Edit',
  editSave: 'Save Changes',
  editSuccess: 'Updated!',
  rules: 'Rules',
  rulesTitle: 'Game Rules',
  rulesClose: 'Got it',
  rulesContent: `[Basic Rules]
Each player starts with 400K coins. Bet on the option you think is correct in each topic created by the admin.

[Betting Rules]
• Each topic can only be bet once; bets cannot be changed
• Bet range: min 50K, max 10,000K
• Minimum increment: 50K
• "All In" button bets all your coins (up to max limit)
• You can "Skip" any topic you don't want to bet on

[Wine Glass Mode 🍷]
• When your coins reach 0, you enter Wine Glass Mode
• Each bet is fixed at 50K, no coins deducted
• Each wine glass bet records 1 glass
• Glasses represent "penalty drinks" to be fulfilled at the party

[Settlement Methods]
• Admin Pick: Admin selects the correct answer
• Random Draw: System randomly picks a winning option

[Payout Rules]
• Losing bets go into the topic's prize pool
• Winners share the pool proportionally based on bet amounts
• Formula: Original bet + Pool × (Your bet ÷ Total winning bets)
• Wine glass winners receive an extra 50K coin bonus
• If no one picked the winner, all bets are fully refunded

[Leaderboard & Prizes]
• Leaderboard shows top 25 players ranked by coins
• Fixed prize tiers:
  🥇 1st: 3,000K  🥈 2nd: 1,500K  🥉 3rd: 1,000K
  4th-10th: 500K each  11th-25th: 100K each
• Total Prize Pool = Sum of all players' coins`,
};

const translations = { zh, en } as const;
type Lang = keyof typeof translations;
type TransKey = keyof typeof zh;

function getDefaultLang(): Lang {
  const saved = localStorage.getItem('lang');
  if (saved === 'zh' || saved === 'en') return saved;
  const sysLang = navigator.language || '';
  return sysLang.startsWith('zh') ? 'zh' : 'en';
}

let currentLang: Lang = getDefaultLang();
const listeners: Set<() => void> = new Set();

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  listeners.forEach(fn => fn());
}

export function t(key: TransKey): string {
  return translations[currentLang][key] || key;
}

export function onLangChange(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
