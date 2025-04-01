"use client"

import Dexie, { Table } from 'dexie';
import { Friend, Group, Expense } from './types';

const DB_NAME = 'fairtabDB';
const DB_VERSION = 1;

class FairTabDatabase extends Dexie {
  friends!: Table<Friend, string>;
  groups!: Table<Group, string>;
  expenses!: Table<Expense, string>;

  constructor() {
    super(DB_NAME);
    
    this.version(DB_VERSION).stores({
      friends: 'email, name',
      groups: 'id, name',
      expenses: 'id, groupId, paidByEmail, date'
    });
  }
}

const isIndexedDBSupported = () => {
  return typeof window !== 'undefined' && 
    'indexedDB' in window && 
    window.indexedDB !== null;
};

export const initializeDatabase = async (): Promise<FairTabDatabase> => {
  if (!isIndexedDBSupported()) {
    console.warn('IndexedDB is not supported in this browser');
    throw new Error('IndexedDB is not supported in this browser');
  }

  try {
    const database = new FairTabDatabase();
    
    await database.open();
    console.log('Database opened successfully');
    return database;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

let db: FairTabDatabase | null = null;

export const getDb = async (): Promise<FairTabDatabase> => {
  if (!db) {
    db = await initializeDatabase();
  }
  return db;
};

export const getAllFriends = async (): Promise<Friend[]> => {
  try {
    const database = await getDb();
    return await database.friends.toArray();
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

export const getFriendByEmail = async (email: string): Promise<Friend | undefined> => {
  try {
    const database = await getDb();
    return await database.friends.get(email);
  } catch (error) {
    console.error(`Error getting friend with email ${email}:`, error);
    return undefined;
  }
};

export const saveFriend = async (friend: Friend): Promise<Friend> => {
  try {
    const database = await getDb();
    
    const existingFriend = await database.friends.get(friend.email);
    
    if (existingFriend) {
      if (existingFriend.name !== friend.name || existingFriend.avatar !== friend.avatar) {
        await database.friends.put(friend);
        console.log(`Updated existing friend: ${friend.email}`);
      } else {
        console.log(`Friend already exists: ${friend.email}`);
      }
      return existingFriend;
    }
    
    await database.friends.put(friend);
    console.log(`Added new friend: ${friend.email}`);
    return friend;
  } catch (error) {
    console.error('Error saving friend:', error);
    throw error;
  }
};

export const deleteFriend = async (email: string): Promise<void> => {
  try {
    const database = await getDb();
    await database.friends.delete(email);
  } catch (error) {
    console.error(`Error deleting friend with email ${email}:`, error);
    throw error;
  }
};

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const database = await getDb();
    return await database.groups.toArray();
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  try {
    const database = await getDb();
    return await database.groups.get(id);
  } catch (error) {
    console.error(`Error getting group with id ${id}:`, error);
    return undefined;
  }
};

export const saveGroup = async (group: Group): Promise<Group> => {
  try {
    const database = await getDb();
    await database.groups.put(group);
    return group;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    const database = await getDb();
    await database.groups.delete(id);
  } catch (error) {
    console.error(`Error deleting group with id ${id}:`, error);
    throw error;
  }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    const database = await getDb();
    return await database.expenses.toArray();
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getExpenseById = async (id: string): Promise<Expense | undefined> => {
  try {
    const database = await getDb();
    return await database.expenses.get(id);
  } catch (error) {
    console.error(`Error getting expense with id ${id}:`, error);
    return undefined;
  }
};

export const saveExpense = async (expense: Expense): Promise<Expense> => {
  try {
    const database = await getDb();
    await database.expenses.put(expense);
    return expense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    const database = await getDb();
    await database.expenses.delete(id);
  } catch (error) {
    console.error(`Error deleting expense with id ${id}:`, error);
    throw error;
  }
};

export const getExpensesByGroupId = async (groupId: string): Promise<Expense[]> => {
  try {
    const database = await getDb();
    return await database.expenses.where('groupId').equals(groupId).toArray();
  } catch (error) {
    console.error(`Error getting expenses for group ${groupId}:`, error);
    return [];
  }
};

export const calculateBalances = async (): Promise<Record<string, Record<string, number>>> => {
  try {
    const expenses = await getAllExpenses();
    const friends = await getAllFriends();
    const balances: Record<string, Record<string, number>> = {};

    friends.forEach((friend) => {
      balances[friend.email] = {};
      friends.forEach((otherFriend) => {
        if (friend.email !== otherFriend.email) {
          balances[friend.email][otherFriend.email] = 0;
        }
      });
    });

    for (const expense of expenses) {
      // Skip expenses without a valid paidByEmail
      if (!expense.paidByEmail) continue;
      
      const payerEmail = expense.paidByEmail;
      const amountPerPerson = expense.amount / expense.splitAmong.length;
      
      if (expense.splitAmong.length === 0) continue;

      // Process each person the expense is split among
      for (const personEmail of expense.splitAmong) {
        // Skip invalid emails or when person is the same as payer
        if (!personEmail || personEmail === payerEmail) continue;

        // Ensure the entries exist in the balances object
        if (!balances[personEmail]) balances[personEmail] = {};
        if (!balances[payerEmail]) balances[payerEmail] = {};
        if (!balances[personEmail][payerEmail]) balances[personEmail][payerEmail] = 0;
        if (!balances[payerEmail][personEmail]) balances[payerEmail][personEmail] = 0;

        // Person owes money to payer
        balances[personEmail][payerEmail] += amountPerPerson;
        // Negative balance means payer owes money to person
        balances[payerEmail][personEmail] -= amountPerPerson;
      }
    }

    return balances;
  } catch (error) {
    console.error('Error calculating balances:', error);
    return {};
  }
}; 
