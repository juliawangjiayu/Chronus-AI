package com.chronus.ai.model;

import java.util.List;

public class ChatResponse {
    private String reply;
    private List<AiSuggestion> suggestions;

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<AiSuggestion> getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(List<AiSuggestion> suggestions) {
        this.suggestions = suggestions;
    }
}
