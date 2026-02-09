import { themeStorage, optionStorage, recordStorage, userStorage } from './storage';

// 导出所有数据
export function exportAllData(): string {
  const data = {
    users: userStorage.getAll(),
    themes: themeStorage.getAll(),
    options: optionStorage.getAll(),
    records: recordStorage.getAll(),
    exportTime: Date.now(),
  };
  return JSON.stringify(data, null, 2);
}

// 导入数据（合并模式）
export function importAllData(jsonString: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.themes || !Array.isArray(data.themes)) {
      return { success: false, message: '数据格式错误：缺少主题数据' };
    }

    // 保存到 localStorage
    if (data.users) {
      localStorage.setItem('bet_users', JSON.stringify(data.users));
    }
    if (data.themes) {
      localStorage.setItem('bet_themes', JSON.stringify(data.themes));
    }
    if (data.options) {
      localStorage.setItem('bet_options', JSON.stringify(data.options));
    }
    if (data.records) {
      localStorage.setItem('bet_records', JSON.stringify(data.records));
    }

    return { success: true, message: '数据导入成功！' };
  } catch (error) {
    return { success: false, message: '数据解析失败，请检查文件格式' };
  }
}

// 下载数据为文件
export function downloadDataFile(): void {
  const data = exportAllData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bet-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 从文件读取数据
export function readDataFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    reader.readAsText(file);
  });
}
