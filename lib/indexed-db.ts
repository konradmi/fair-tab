"use client"

import Dexie, { Table } from 'dexie';
import { Friend, Group, Expense } from './types';

class FairTabDatabase extends Dexie {
  friends!: Table<Friend, string>;
  groups!: Table<Group, string>;
  expenses!: Table<Expense, string>;

  constructor() {
    super('fairtabDB');
    
    this.version(1).stores({
      friends: 'id, email, name',
      groups: 'id, name',
      expenses: 'id, groupId, paidById, date'
    });
  }
}

export const db = new FairTabDatabase();

export const getAllFriends = async (): Promise<Friend[]> => {
  try {
    return await db.friends.toArray();
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
};

export const getFriendById = async (id: string): Promise<Friend | undefined> => {
  try {
    return await db.friends.get(id);
  } catch (error) {
    console.error(`Error getting friend with id ${id}:`, error);
    return undefined;
  }
};

export const saveFriend = async (friend: Friend): Promise<Friend> => {
  try {
    await db.friends.put(friend);
    return friend;
  } catch (error) {
    console.error('Error saving friend:', error);
    throw error;
  }
};

export const deleteFriend = async (id: string): Promise<void> => {
  try {
    await db.friends.delete(id);
  } catch (error) {
    console.error(`Error deleting friend with id ${id}:`, error);
    throw error;
  }
};

export const getAllGroups = async (): Promise<Group[]> => {
  try {
    return await db.groups.toArray();
  } catch (error) {
    console.error('Error getting groups:', error);
    return [];
  }
};

export const getGroupById = async (id: string): Promise<Group | undefined> => {
  try {
    return await db.groups.get(id);
  } catch (error) {
    console.error(`Error getting group with id ${id}:`, error);
    return undefined;
  }
};

export const saveGroup = async (group: Group): Promise<Group> => {
  try {
    await db.groups.put(group);
    return group;
  } catch (error) {
    console.error('Error saving group:', error);
    throw error;
  }
};

export const deleteGroup = async (id: string): Promise<void> => {
  try {
    await db.groups.delete(id);
  } catch (error) {
    console.error(`Error deleting group with id ${id}:`, error);
    throw error;
  }
};

export const getAllExpenses = async (): Promise<Expense[]> => {
  try {
    return await db.expenses.toArray();
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const getExpenseById = async (id: string): Promise<Expense | undefined> => {
  try {
    return await db.expenses.get(id);
  } catch (error) {
    console.error(`Error getting expense with id ${id}:`, error);
    return undefined;
  }
};

export const saveExpense = async (expense: Expense): Promise<Expense> => {
  try {
    await db.expenses.put(expense);
    return expense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string): Promise<void> => {
  try {
    await db.expenses.delete(id);
  } catch (error) {
    console.error(`Error deleting expense with id ${id}:`, error);
    throw error;
  }
};

export const getExpensesByGroupId = async (groupId: string): Promise<Expense[]> => {
  try {
    return await db.expenses.where('groupId').equals(groupId).toArray();
  } catch (error) {
    console.error(`Error getting expenses for group ${groupId}:`, error);
    return [];
  }
};

export const calculateBalances = async (): Promise<Record<string, Record<string, number>>> => {
  try {
    const expenses = await db.expenses.toArray();
    const friends = await db.friends.toArray();
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
