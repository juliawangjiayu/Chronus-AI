package com.chronus.ai.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "running");
        status.put("message", "Chronus AI Backend is active");
        status.put("api_docs", "/api/ai/chat");
        return status;
    }
}
