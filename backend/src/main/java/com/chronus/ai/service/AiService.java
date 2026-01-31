package com.chronus.ai.service;

import com.chronus.ai.model.AiSuggestion;
import com.chronus.ai.model.ChatResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import org.springframework.core.io.ClassPathResource;
import java.nio.charset.StandardCharsets;
import java.io.IOException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${ai.api.key}")
    private String apiKey;

    @Value("${ai.api.url}")
    private String apiUrl; // e.g., https://api.openai.com/v1/chat/completions

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatResponse chat(String message, String mode) {
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            // Prepare body
            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-3.5-turbo"); // Or gpt-4
            
            String systemPromptTemplate;
            try {
                // Try to load mode-specific prompt
                String filename = "system-prompt-" + mode.toLowerCase() + ".txt";
                try {
                    systemPromptTemplate = new String(new ClassPathResource(filename).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                } catch (IOException e) {
                    // Fallback to generic prompt
                    systemPromptTemplate = new String(new ClassPathResource("system-prompt.txt").getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                }
            } catch (IOException e) {
                // Fallback if file not found
                systemPromptTemplate = """
                    You are a planning assistant Chronus. 
                    Analyze the user's request and current mode ("%s").
                    Return a JSON object with:
                    1. "reply": A friendly response.
                    2. "suggestions": An array of tasks derived from the request.
                       Each task has: "name", "duration" (minutes), "mode" (todo/study/final), "priority" (high/medium/low), "reason".
                    
                    Example JSON:
                    {
                      "reply": "I've added a study session for you.",
                      "suggestions": [
                        { "name": "Read Chapter 1", "duration": 45, "mode": "study", "priority": "high", "reason": "Core material" }
                      ]
                    }
                    IMPORTANT: Output ONLY valid JSON. No markdown blocks.
                    """;
            }
            
            // Format only if it contains %s (backward compatibility for generic prompt)
            String systemPrompt = systemPromptTemplate.contains("%s") ? systemPromptTemplate.formatted(mode) : systemPromptTemplate;

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user", "content", message));

            body.put("messages", messages);
            body.put("temperature", 0.7);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            // Call API
            // Note: If apiUrl is not set or invalid, this will throw.
            // For hackathon/demo, we assume valid config or handle error.
            if (apiUrl == null || apiUrl.isEmpty() || apiKey == null || apiKey.equals("FAKE_KEY")) {
                return mockResponse(message, mode);
            }

            // Check if using Gemini API
            if (apiUrl.contains("google") || apiUrl.contains("gemini")) {
                try {
                    return callGeminiApi(message, systemPrompt);
                } catch (Exception e) {
                    System.err.println("Gemini API Error: " + e.getMessage());
                    return mockResponse(message, mode);
                }
            }

            // Default OpenAI format
            ResponseEntity<Map> response = restTemplate.postForEntity(apiUrl, request, Map.class);
            
            if (response.getBody() != null) {
                List<Map> choices = (List<Map>) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map messageObj = (Map) choices.get(0).get("message");
                    String content = (String) messageObj.get("content");
                    return objectMapper.readValue(content, ChatResponse.class);
                }
            }
            
            return mockResponse(message, mode); // Fallback

        } catch (Exception e) {
            e.printStackTrace();
            return mockResponse(message, mode); // Fallback on error
        }
    }

    private ChatResponse callGeminiApi(String userMessage, String systemPrompt) throws Exception {
        // Construct Gemini URL with API Key
        String finalUrl = apiUrl + "?key=" + apiKey;

        // Construct Gemini Request Body
        // Gemini doesn't support system prompt in the same way as OpenAI's "system" role in standard endpoints easily.
        // We will prepend it to the user message or use "parts".
        // Structure: { "contents": [{ "parts": [{ "text": "..." }] }] }
        
        Map<String, Object> geminiBody = new HashMap<>();
        List<Map<String, Object>> contents = new ArrayList<>();
        Map<String, Object> contentPart = new HashMap<>();
        List<Map<String, String>> parts = new ArrayList<>();
        
        // Combine system prompt and user message
        String combinedMessage = systemPrompt + "\n\nUser Request: " + userMessage;
        
        parts.add(Map.of("text", combinedMessage));
        contentPart.put("parts", parts);
        contents.add(contentPart);
        geminiBody.put("contents", contents);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(geminiBody, headers);
        
        ResponseEntity<Map> response = restTemplate.postForEntity(finalUrl, request, Map.class);
        
        if (response.getBody() != null) {
            // Parse Gemini Response
            // { "candidates": [ { "content": { "parts": [ { "text": "..." } ] } } ] }
            List<Map> candidates = (List<Map>) response.getBody().get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map contentObj = (Map) candidates.get(0).get("content");
                List<Map> partsRes = (List<Map>) contentObj.get("parts");
                if (partsRes != null && !partsRes.isEmpty()) {
                    String text = (String) partsRes.get(0).get("text");
                    // Extract JSON from text (Gemini might wrap it in markdown ```json ... ```)
                    String json = text.replaceAll("```json", "").replaceAll("```", "").trim();
                    return objectMapper.readValue(json, ChatResponse.class);
                }
            }
        }
        throw new RuntimeException("Empty response from Gemini");
    }

    // Fallback Mock for Demo stability
    private ChatResponse mockResponse(String message, String mode) {
        ChatResponse response = new ChatResponse();
        response.setReply("I'm simulating a response because the AI API is not configured or reachable. (Mode: " + mode + ")");
        
        List<AiSuggestion> suggestions = new ArrayList<>();
        AiSuggestion task = new AiSuggestion();
        task.setName("Sample Task from " + message);
        task.setDuration(30);
        task.setMode(mode);
        task.setPriority("medium");
        task.setReason("Generated by fallback logic");
        suggestions.add(task);
        
        response.setSuggestions(suggestions);
        return response;
    }
}
