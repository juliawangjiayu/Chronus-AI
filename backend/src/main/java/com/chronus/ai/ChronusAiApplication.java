package com.chronus.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Properties;

@SpringBootApplication
public class ChronusAiApplication {

    public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(ChronusAiApplication.class, args);
    }

    private static void loadEnv() {
        File envFile = new File("../.env");
        if (envFile.exists()) {
            try {
                Files.lines(envFile.toPath())
                    .filter(line -> line.contains("=") && !line.startsWith("#"))
                    .forEach(line -> {
                        String[] parts = line.split("=", 2);
                        if (parts.length == 2) {
                            String key = parts[0].trim();
                            String value = parts[1].trim();
                            System.setProperty(key, value);
                        }
                    });
                System.out.println("Loaded environment variables from .env");
            } catch (IOException e) {
                System.err.println("Failed to load .env file: " + e.getMessage());
            }
        }
    }

}
