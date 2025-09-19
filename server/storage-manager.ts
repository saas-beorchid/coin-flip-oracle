import { IStorage, MemStorage } from "./storage";
import { DatabaseStorage } from "./database-storage";

// Create both storage implementations
const memStorage = new MemStorage();
const dbStorage = new DatabaseStorage();

// Choose which storage to use - fall back to memory storage if database initialization fails
let useDatabase = process.env.DATABASE_URL ? true : false;

// Export storage - this will be initialized in index.ts and will be either DB or Memory
export let storage: IStorage = useDatabase ? dbStorage : memStorage;

// Function to fall back to in-memory storage if database connection fails
export function fallbackToMemoryStorage(): void {
  if (useDatabase) {
    storage = memStorage;
    useDatabase = false;
  }
}

// Function to explicitly set which storage to use
export function setStorageImplementation(
  implementation: "memory" | "database"
): void {
  if (implementation === "memory") {
    storage = memStorage;
    useDatabase = false;
  } else if (implementation === "database" && process.env.DATABASE_URL) {
    storage = dbStorage;
    useDatabase = true;
  }
}
