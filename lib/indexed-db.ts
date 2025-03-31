"use client"

import { Friend, Group, Expense } from './types';

// Database configuration
const DB_NAME = 'fairtabDB';
const DB_VERSION = 1;

// Store names
const STORES = {
  FRIENDS: 'friends',
  GROUPS: 'groups',
  EXPENSES: 'expenses',
};

// Open database connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Error opening database'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create friends store
      if (!db.objectStoreNames.contains(STORES.FRIENDS)) {
        const friendsStore = db.createObjectStore(STORES.FRIENDS, { keyPath: 'id' });
        friendsStore.createIndex('email', 'email', { unique: true });
        friendsStore.createIndex('name', 'name', { unique: false });
      }
      
      // Create groups store
      if (!db.objectStoreNames.contains(STORES.GROUPS)) {
        const groupsStore = db.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
        groupsStore.createIndex('name', 'name', { unique: false });
      }
      
      // Create expenses store
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expensesStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expensesStore.createIndex('groupId', 'groupId', { unique: false });
        expensesStore.createIndex('paidById', 'paidById', { unique: false });
        expensesStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
};

// Helper to generate a transaction and get the store
const getStore = async (storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> => {
  const db = await openDB();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

// Generic function to execute a request and return a promise
const executeRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Friends CRUD operations
export const getAllFriends = async (): Promise<Friend[]> => {
  try {
    const store = await getStore(STORES.FRIENDS);
    return executeRequest(store.getAll());
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

export const getFriendById = async (id: string): Promise<Friend | undefined> => {
  try {
    const store = await getStore(STORES.FRIENDS);
    return executeRequest(store.get(id));
  } catch (error) {
    console.error(`Error getting friend with id ${id}:`, error);
    return undefined;
  }
};

export const saveFriend = async (friend: Friend): Promise<Friend> => {
  try {
    const store = await getStore(STORES.FRIENDS, 'readwrite');
    await executeRequest(store.put(friend));
    return friend;
  } catch (error) {
    console.error('Error saving friend:', error);
    throw error;
  }
};

export const deleteFriend = async (id: string): Promise<void> => {
  try {
    const store = await getStore(STORES.FRIENDS, 'readwrite');
    await executeRequest(store.delete(id));
  } catch (error) {
    console.error(`Error deleting friend with id ${id}:`, error);
    throw error;
  }
};

// Groups CRUD operations
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const store = await getStore(STORES.GROUPS);
    return executeRequest(store.getAll());
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  try {
    const store = await getStore(STORES.GROUPS);
    return executeRequest(store.get(id));
  } catch (error) {
    console.error(`Error getting group with id ${id}:`, error);
    return undefined;
  }
};

export const saveGroup = async (group: Group): Promise<Group> => {
  try {
    const store = await getStore(STORES.GROUPS, 'readwrite');
    await executeRequest(store.put(group));
    return group;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    const store = await getStore(STORES.GROUPS, 'readwrite');
    await executeRequest(store.delete(id));
  } catch (error) {
    console.error(`Error deleting group with id ${id}:`, error);
    throw error;
  }
};

// Expenses CRUD operations
export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    const store = await getStore(STORES.EXPENSES);
    return executeRequest(store.getAll());
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getExpenseById = async (id: string): Promise<Expense | undefined> => {
  try {
    const store = await getStore(STORES.EXPENSES);
    return executeRequest(store.get(id));
  } catch (error) {
    console.error(`Error getting expense with id ${id}:`, error);
    return undefined;
  }
};

export const saveExpense = async (expense: Expense): Promise<Expense> => {
  try {
    const store = await getStore(STORES.EXPENSES, 'readwrite');
    await executeRequest(store.put(expense));
    return expense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const store = await getStore(STORES.EXPENSES, 'readwrite');
    await executeRequest(store.delete(id));
  } catch (error) {
    console.error(`Error deleting expense with id ${id}:`, error);
    throw error;
  }
};

// Helper function to get expenses for a specific group
export const getExpensesByGroupId = async (groupId: string): Promise<Expense[]> => {
  try {
    const store = await getStore(STORES.EXPENSES);
    const index = store.index('groupId');
    return executeRequest(index.getAll(IDBKeyRange.only(groupId)));
  } catch (error) {
    console.error(`Error getting expenses for group ${groupId}:`, error);
    return [];
  }
};

// Balance calculation
export const calculateBalances = async (): Promise<Record<string, Record<string, number>>> => {
  try {
    const expenses = await getAllExpenses();
    const friends = await getAllFriends();
    const balances: Record<string, Record<string, number>> = {};

    // Initialize balances
    friends.forEach((friend) => {
      balances[friend.id] = {};
      friends.forEach((otherFriend) => {
        if (friend.id !== otherFriend.id) {
          balances[friend.id][otherFriend.id] = 0;
        }
      });
    });

    // Calculate balances from expenses
    expenses.forEach((expense) => {
      const paidBy = expense.paidById;
      const splitAmong = expense.splitAmong;
      const amountPerPerson = expense.amount / splitAmong.length;

      splitAmong.forEach((personId) => {
        if (personId !== paidBy) {
          // Person owes money to paidBy
          balances[personId][paidBy] = (balances[personId][paidBy] || 0) + amountPerPerson;
          // Negative balance means paidBy owes money to person
          balances[paidBy][personId] = (balances[paidBy][personId] || 0) - amountPerPerson;
        }
      });
    });

    return balances;
  } catch (error) {
    console.error('Error calculating balances:', error);
    return {};
  }
}; 
