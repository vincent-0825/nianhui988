import type { User, BetTheme, BetOption, BetRecord } from '@/types';

// 游戏配置
export const GAME_CONFIG = {
  INITIAL_COINS: 200000,      // 初始金币 20万
  MIN_BET_AMOUNT: 50000,      // 最小押注 5万
};

const STORAGE_KEYS = {
  USERS: 'bet_users',
  THEMES: 'bet_themes',
  OPTIONS: 'bet_options',
  RECORDS: 'bet_records',
  CURRENT_USER: 'bet_current_user',
  DEVICE_ID: 'bet_device_id',
  IS_ADMIN: 'bet_is_admin',
};

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 生成设备ID
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

// 用户相关操作
export const userStorage = {
  getAll(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  getById(id: string): User | null {
    const users = this.getAll();
    return users.find(u => u.id === id) || null;
  },

  getByDeviceId(deviceId: string): User | null {
    const users = this.getAll();
    return users.find(u => u.deviceId === deviceId) || null;
  },

  create(name: string): User {
    const users = this.getAll();
    const deviceId = getOrCreateDeviceId();
    
    // 检查设备是否已绑定用户
    const existingUser = users.find(u => u.deviceId === deviceId);
    if (existingUser) {
      return existingUser;
    }

    const newUser: User = {
      id: generateId(),
      name,
      coins: GAME_CONFIG.INITIAL_COINS,
      deviceId,
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return newUser;
  },

  update(user: User): void {
    const users = this.getAll();
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  },

  addCoins(userId: string, amount: number): void {
    const user = this.getById(userId);
    if (user) {
      user.coins += amount;
      this.update(user);
    }
  },

  deductCoins(userId: string, amount: number): boolean {
    const user = this.getById(userId);
    if (user && user.coins >= amount) {
      user.coins -= amount;
      this.update(user);
      return true;
    }
    return false;
  },
};

// 当前用户会话
export const sessionStorage = {
  getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  isAdmin(): boolean {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
  },

  setAdmin(isAdmin: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, isAdmin ? 'true' : 'false');
  },

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.IS_ADMIN);
  },
};

// 押注主题相关操作
export const themeStorage = {
  getAll(): BetTheme[] {
    const data = localStorage.getItem(STORAGE_KEYS.THEMES);
    return data ? JSON.parse(data) : [];
  },

  getById(id: string): BetTheme | null {
    const themes = this.getAll();
    return themes.find(t => t.id === id) || null;
  },

  create(theme: Omit<BetTheme, 'id' | 'createdAt'>): BetTheme {
    const themes = this.getAll();
    const newTheme: BetTheme = {
      ...theme,
      id: generateId(),
      createdAt: Date.now(),
    };
    themes.push(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
    return newTheme;
  },

  update(theme: BetTheme): void {
    const themes = this.getAll();
    const index = themes.findIndex(t => t.id === theme.id);
    if (index !== -1) {
      themes[index] = theme;
      localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
    }
  },

  delete(id: string): void {
    const themes = this.getAll().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
    // 同时删除相关选项和记录
    const options = optionStorage.getAll().filter(o => o.themeId !== id);
    localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(options));
    const records = recordStorage.getAll().filter(r => r.themeId !== id);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  },

  setWinner(themeId: string, optionId: string): void {
    const theme = this.getById(themeId);
    if (theme) {
      theme.winnerOptionId = optionId;
      theme.status = 'closed';
      this.update(theme);
    }
  },
};

// 押注选项相关操作
export const optionStorage = {
  getAll(): BetOption[] {
    const data = localStorage.getItem(STORAGE_KEYS.OPTIONS);
    return data ? JSON.parse(data) : [];
  },

  getByThemeId(themeId: string): BetOption[] {
    const options = this.getAll();
    return options.filter(o => o.themeId === themeId);
  },

  getById(id: string): BetOption | null {
    const options = this.getAll();
    return options.find(o => o.id === id) || null;
  },

  create(option: Omit<BetOption, 'id'>): BetOption {
    const options = this.getAll();
    const newOption: BetOption = {
      ...option,
      id: generateId(),
    };
    options.push(newOption);
    localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(options));
    return newOption;
  },

  deleteByThemeId(themeId: string): void {
    const options = this.getAll().filter(o => o.themeId !== themeId);
    localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(options));
  },
};

// 押注记录相关操作
export const recordStorage = {
  getAll(): BetRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.RECORDS);
    return data ? JSON.parse(data) : [];
  },

  getByThemeId(themeId: string): BetRecord[] {
    const records = this.getAll();
    return records.filter(r => r.themeId === themeId);
  },

  getByUserId(userId: string): BetRecord[] {
    const records = this.getAll();
    return records.filter(r => r.userId === userId);
  },

  getByUserAndTheme(userId: string, themeId: string): BetRecord | null {
    const records = this.getAll();
    return records.find(r => r.userId === userId && r.themeId === themeId) || null;
  },

  create(record: Omit<BetRecord, 'id' | 'createdAt'>): BetRecord {
    const records = this.getAll();
    const newRecord: BetRecord = {
      ...record,
      id: generateId(),
      createdAt: Date.now(),
    };
    records.push(newRecord);
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
    return newRecord;
  },

  // 获取选项的押注统计
  getOptionStats(optionId: string): { totalAmount: number; betCount: number } {
    const records = this.getAll().filter(r => r.optionId === optionId);
    return {
      totalAmount: records.reduce((sum, r) => sum + r.amount, 0),
      betCount: records.length,
    };
  },
};

// 计算赢率
export function calculateWinRates(themeId: string): Map<string, number> {
  const records = recordStorage.getByThemeId(themeId);
  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0);
  
  const optionAmounts = new Map<string, number>();
  records.forEach(record => {
    const current = optionAmounts.get(record.optionId) || 0;
    optionAmounts.set(record.optionId, current + record.amount);
  });

  const winRates = new Map<string, number>();
  optionAmounts.forEach((amount, optionId) => {
    winRates.set(optionId, totalAmount > 0 ? (amount / totalAmount) * 100 : 0);
  });

  return winRates;
}

// 结算奖励
// 规则：输家全部金币用于奖励，按赢家押注比例分配给赢家
export function settleBets(themeId: string, winnerOptionId: string): void {
  const records = recordStorage.getByThemeId(themeId);
  const winnerRecords = records.filter(r => r.optionId === winnerOptionId);
  const loserRecords = records.filter(r => r.optionId !== winnerOptionId);
  
  // 输家全部押注金额作为奖励池
  const rewardPool = loserRecords.reduce((sum, r) => sum + r.amount, 0);
  
  // 赢家总押注金额
  const winnerPool = winnerRecords.reduce((sum, r) => sum + r.amount, 0);

  // 按赢家押注比例分配奖励池
  if (winnerPool > 0 && rewardPool > 0) {
    winnerRecords.forEach(record => {
      const user = userStorage.getById(record.userId);
      if (user) {
        // 按比例分配奖励池
        const reward = Math.floor((record.amount / winnerPool) * rewardPool);
        // 退还原押注 + 分配奖励
        userStorage.addCoins(user.id, record.amount + reward);
      }
    });
  } else if (winnerPool > 0) {
    // 没有输家，只退还赢家原押注
    winnerRecords.forEach(record => {
      const user = userStorage.getById(record.userId);
      if (user) {
        userStorage.addCoins(user.id, record.amount);
      }
    });
  }
}
