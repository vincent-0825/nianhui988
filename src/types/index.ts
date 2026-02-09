// 用户
export interface User {
  id: string;
  name: string;
  coins: number;
  deviceId: string;
}

// 押注主题
export interface BetTheme {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  winnerOptionId: string | null;
  createdAt: number;
}

// 押注选项
export interface BetOption {
  id: string;
  themeId: string;
  name: string;
}

// 押注记录
export interface BetRecord {
  id: string;
  userId: string;
  themeId: string;
  optionId: string;
  amount: number;
  createdAt: number;
}

// 扩展的押注选项（包含统计信息）
export interface BetOptionWithStats extends BetOption {
  totalAmount: number;
  betCount: number;
  winRate: number;
}

// 扩展的押注主题（包含选项和统计）
export interface BetThemeWithDetails extends BetTheme {
  options: BetOptionWithStats[];
  totalAmount: number;
  totalBets: number;
}

// 用户押注记录（包含主题信息）
export interface UserBetRecord extends BetRecord {
  themeTitle: string;
  optionName: string;
  isWin: boolean;
  reward: number;
}
