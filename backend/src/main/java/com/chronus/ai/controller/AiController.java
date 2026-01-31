package com.chronus.ai.controller;

import com.chronus.ai.model.ChatRequest;
import com.chronus.ai.model.ChatResponse;
import com.chronus.ai.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        return aiService.chat(request.getMessage(), request.getMode());
    }
}
