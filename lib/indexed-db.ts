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
      friends: 'email, name, ownerEmail',
      groups: 'id, name, ownerEmail, *members',
      expenses: 'id, groupId, paidByEmail, date, ownerEmail'
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

export async function getAllFriends(userEmail: string): Promise<Friend[]> {
  const db = await getDb()
  const friends = await db.friends.toArray()
  const groups = await db.groups.toArray()
  
  // Get friends where current user is the owner
  const ownedFriends = friends.filter((friend: Friend) => friend.ownerEmail === userEmail)
  
  // Get all groups where the current user is a member
  const userGroups = groups.filter((group: Group) => group.members.includes(userEmail))
  
  // Get all unique member emails from these groups
  const groupMemberEmails = [...new Set(userGroups.flatMap((group: Group) => group.members))]
  
  // Get all friends that are members of these groups
  const groupFriends = friends.filter((friend: Friend) => 
    friend.ownerEmail !== userEmail && // Don't include friends we own
    groupMemberEmails.includes(friend.email) // Include if they're in any of our groups
  )
  
  // Combine and deduplicate friends based on email
  const allFriends = [...ownedFriends, ...groupFriends]
  const uniqueFriends = Array.from(
    new Map(allFriends.map(friend => [friend.email, friend])).values()
  )
  
  return uniqueFriends
}

export const getFriendByEmail = async (email: string, userEmail: string): Promise<Friend | undefined> => {
  try {
    const database = await getDb();
    const friend = await database.friends.get(email);
    
    // Check if the friend is owned by the user or is in any of user's groups
    if (friend) {
      if (friend.ownerEmail === userEmail) {
        return friend;
      }
      
      // Check if the friend is in any of the user's groups
      const userGroups = await getAllGroups(userEmail);
      const isInUserGroups = userGroups.some(group => group.members.includes(friend.email));
      
      if (isInUserGroups) {
        return friend;
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting friend with email ${email}:`, error);
    return undefined;
  }
};

export const saveFriend = async (friend: Friend, userEmail: string): Promise<Friend> => {
  try {
    const database = await getDb();
    
    // Set the owner email if not already set
    if (!friend.ownerEmail) {
      friend.ownerEmail = userEmail;
    }
    
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

export const deleteFriend = async (email: string, userEmail: string): Promise<void> => {
  try {
    const database = await getDb();
    const friend = await database.friends.get(email);
    
    // Only allow deletion if user is the owner
    if (friend && friend.ownerEmail === userEmail) {
      await database.friends.delete(email);
    } else {
      throw new Error('Not authorized to delete this friend');
    }
  } catch (error) {
    console.error(`Error deleting friend with email ${email}:`, error);
    throw error;
  }
};

export const getAllGroups = async (userEmail: string): Promise<Group[]> => {
  try {
    const database = await getDb();
    // Get groups owned by the user or where user is a member
    return await database.groups.where('ownerEmail').equals(userEmail)
      .or('members').equals(userEmail)
      .toArray();
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
};

export const getGroupById = async (id: string, userEmail: string): Promise<Group | undefined> => {
  try {
    const database = await getDb();
    const group = await database.groups.get(id);
    
    // Check if the user is the owner or a member of the group
    if (group && (group.ownerEmail === userEmail || group.members.includes(userEmail))) {
      return group;
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting group with id ${id}:`, error);
    return undefined;
  }
};

export const saveGroup = async (group: Group, userEmail: string): Promise<Group> => {
  try {
    const database = await getDb();
    
    if (!group.ownerEmail) {
      group.ownerEmail = userEmail;
    }
    
    if (!group.members.includes(group.ownerEmail)) {
      group.members.push(group.ownerEmail);
    }
    
    await database.groups.put(group);
    return group;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string, userEmail: string): Promise<void> => {
  try {
    const database = await getDb();
    const group = await database.groups.get(id);
    
    if (group && group.ownerEmail === userEmail) {
      await database.groups.delete(id);
    } else {
      throw new Error('Not authorized to delete this group');
    }
  } catch (error) {
    console.error(`Error deleting group with id ${id}:`, error);
    throw error;
  }
};

export const getAllExpenses = async (userEmail: string): Promise<Expense[]> => {
  try {
    const database = await getDb();
    
    const userGroups = await getAllGroups(userEmail);
    const groupIds = userGroups.map(group => group.id);
    
    return await database.expenses
      .where('groupId')
      .anyOf(groupIds)
      .toArray();
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getExpenseById = async (id: string, userEmail: string): Promise<Expense | undefined> => {
  try {
    const database = await getDb();
    const expense = await database.expenses.get(id);
    
    if (expense) {
      const group = await getGroupById(expense.groupId, userEmail);
      if (group) {
        return expense;
      }
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting expense with id ${id}:`, error);
    return undefined;
  }
};

export const saveExpense = async (expense: Expense, userEmail: string): Promise<Expense> => {
  try {
    const database = await getDb();
    
    if (!expense.ownerEmail) {
      expense.ownerEmail = userEmail;
    }
    
    const group = await getGroupById(expense.groupId, userEmail);
    if (!group) {
      throw new Error('Not authorized to add expense to this group');
    }
    
    await database.expenses.put(expense);
    return expense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string, userEmail: string): Promise<void> => {
  try {
    const database = await getDb();
    const expense = await database.expenses.get(id);
    
    if (expense) {
      if (expense.ownerEmail === userEmail) {
        await database.expenses.delete(id);
      } else {
        const group = await getGroupById(expense.groupId, userEmail);
        if (group && group.ownerEmail === userEmail) {
          await database.expenses.delete(id);
        } else {
          throw new Error('Not authorized to delete this expense');
        }
      }
    }
  } catch (error) {
    console.error(`Error deleting expense with id ${id}:`, error);
    throw error;
  }
};

export const getExpensesByGroupId = async (groupId: string, userEmail: string): Promise<Expense[]> => {
  try {
    const group = await getGroupById(groupId, userEmail);
    if (!group) {
      return [];
    }
    
    const database = await getDb();
    return await database.expenses.where('groupId').equals(groupId).toArray();
  } catch (error) {
    console.error(`Error getting expenses for group ${groupId}:`, error);
    return [];
  }
};

export const calculateBalances = async (userEmail: string): Promise<Record<string, Record<string, number>>> => {
  try {
    const expenses = await getAllExpenses(userEmail);
    const friends = await getAllFriends(userEmail);
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
