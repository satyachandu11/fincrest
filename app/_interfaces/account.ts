export interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    isDefault: boolean;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count: {
      transactions: number;
    };
  }