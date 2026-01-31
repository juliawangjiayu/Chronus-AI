import axios from 'axios';
import { Todo } from '../types';

const API_URL = 'http://localhost:8081/api/todos';

export const todoService = {
  async getAllTodos(): Promise<Todo[]> {
    const response = await axios.get(API_URL);
    // Convert date strings to Date objects
    return response.data.map((t: any) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined
    }));
  },

  async createTodo(todo: Partial<Todo>): Promise<Todo> {
    const response = await axios.post(API_URL, todo);
    const t = response.data;
    return {
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined
    };
  },

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const response = await axios.put(`${API_URL}/${id}`, updates);
    const t = response.data;
    return {
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      scheduledDate: t.scheduledDate ? new Date(t.scheduledDate) : undefined,
      completedAt: t.completedAt ? new Date(t.completedAt) : undefined
    };
  },

  async deleteTodo(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }
};
