import {
  users,
  type User,
  type InsertUser,
  flipHistory,
  type FlipHistory,
  type InsertFlipHistory,
  coinSettings,
  type CoinSettings,
} from "@shared/schema";

// Storage interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Flip history operations
  getAllFlipHistory(): Promise<FlipHistory[]>;
  addFlipToHistory(flip: InsertFlipHistory): Promise<FlipHistory>;
  clearFlipHistory(): Promise<void>;
  getFlipStats(): Promise<{
    headsCount: number;
    tailsCount: number;
    totalCount: number;
  }>;

  // Coin settings operations
  getCoinSettings(): Promise<CoinSettings | undefined>;
  updateCoinSettings(settings: Partial<CoinSettings>): Promise<CoinSettings>;

  // Payment operations
  getPaymentStatus(userId: string): Promise<boolean>;
  setPaymentStatus(userId: string, hasPaid: boolean): Promise<void>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private flips: Map<number, FlipHistory>;
  private settings: CoinSettings | undefined;
  private payments: Map<string, boolean>;

  private userCurrentId: number;
  private flipCurrentId: number;

  constructor() {
    this.users = new Map();
    this.flips = new Map();
    this.payments = new Map();
    this.userCurrentId = 1;
    this.flipCurrentId = 1;

    // Default coin settings
    this.settings = {
      id: 1,
      headsLabel: "HEADS",
      tailsLabel: "TAILS",
      coinStyle: "default",
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Flip history operations
  async getAllFlipHistory(): Promise<FlipHistory[]> {
    // Return in reverse chronological order (newest first)
    return Array.from(this.flips.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  async addFlipToHistory(flip: InsertFlipHistory): Promise<FlipHistory> {
    const id = this.flipCurrentId++;
    const timestamp = new Date();

    // Ensure all required fields are present with defaults if needed
    const newFlip: FlipHistory = {
      outcome: flip.outcome,
      headsLabel: flip.headsLabel || "HEADS",
      tailsLabel: flip.tailsLabel || "TAILS",
      coinStyle: flip.coinStyle || "default",
      context: flip.context || null,
      aiSuggestion: flip.aiSuggestion || null,
      id,
      timestamp,
    };

    this.flips.set(id, newFlip);
    return newFlip;
  }

  async clearFlipHistory(): Promise<void> {
    this.flips.clear();
    this.flipCurrentId = 1;
  }

  async getFlipStats(): Promise<{
    headsCount: number;
    tailsCount: number;
    totalCount: number;
  }> {
    const allFlips = Array.from(this.flips.values());
    const headsCount = allFlips.filter(
      (flip) => flip.outcome === "heads",
    ).length;
    const tailsCount = allFlips.filter(
      (flip) => flip.outcome === "tails",
    ).length;

    return {
      headsCount,
      tailsCount,
      totalCount: headsCount + tailsCount,
    };
  }

  // Coin settings operations
  async getCoinSettings(): Promise<CoinSettings | undefined> {
    return this.settings;
  }

  async updateCoinSettings(
    settings: Partial<CoinSettings>,
  ): Promise<CoinSettings> {
    if (!this.settings) {
      this.settings = {
        id: 1,
        headsLabel: settings.headsLabel || "HEADS",
        tailsLabel: settings.tailsLabel || "TAILS",
        coinStyle: settings.coinStyle || "default",
      };
    } else {
      this.settings = {
        ...this.settings,
        ...settings,
      };
    }

    return this.settings;
  }

  // Payment operations
  async getPaymentStatus(userId: string): Promise<boolean> {
    return this.payments.get(userId) || false;
  }

  async setPaymentStatus(userId: string, hasPaid: boolean): Promise<void> {
    this.payments.set(userId, hasPaid);
  }
}
