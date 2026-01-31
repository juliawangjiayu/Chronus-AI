
import axios from 'axios';
import { AiSuggestion, AIMode, CalendarEvent } from '../types';

const API_URL = 'http://localhost:8081/api';

export const aiService = {
  async chat(message: string, mode: string): Promise<{ reply: string; suggestions: AiSuggestion[] }> {
    try {
      const response = await axios.post(`${API_URL}/ai/chat`, { message, mode });
      return response.data;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },

  async generateScheduleResponse(
    prompt: string, 
    events: CalendarEvent[], 
    history: { role: string; content: string }[], 
    mode: AIMode
  ): Promise<{ reply: string; suggestions: AiSuggestion[] }> {
    
    // Construct context string
    const eventContext = events.map(e => 
      `- ${e.title} (${e.startTime.toLocaleString()} to ${e.endTime.toLocaleString()})${e.notes ? `: ${e.notes}` : ''}`
    ).join('\n');

    const historyContext = history.slice(-5).map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

    const fullMessage = `
Context:
${eventContext ? `Current Events:\n${eventContext}\n` : 'No upcoming events.'}

History:
${historyContext}

User: ${prompt}
    `.trim();

    return this.chat(fullMessage, mode);
  }
};
