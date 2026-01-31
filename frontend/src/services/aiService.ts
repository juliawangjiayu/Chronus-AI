import axios from 'axios';
import { AiSuggestion } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const aiService = {
  async chat(message: string, mode: string): Promise<{ reply: string; suggestions: AiSuggestion[] }> {
    try {
      // In a real implementation, this would call the backend
      const response = await axios.post(`${API_URL}/ai/chat`, { message, mode });
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      // Fallback for demo purposes if backend is not running, 
      // BUT as per instructions, we aim for real API. 
      // If this fails, the UI will show an error.
      throw error;
    }
  }
};
