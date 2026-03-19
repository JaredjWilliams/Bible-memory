package org.biblememory.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory rate limiter: 5 attempts per minute per IP for auth endpoints.
 */
@Service
public class RateLimitService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 60_000;

    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public boolean tryConsume(String ip) {
        long now = System.currentTimeMillis();
        Window w = windows.compute(ip, (k, v) -> {
            if (v == null || now - v.start > WINDOW_MS) {
                return new Window(now, 1);
            }
            if (v.count >= MAX_ATTEMPTS) {
                return v;
            }
            return new Window(v.start, v.count + 1);
        });
        return w.count <= MAX_ATTEMPTS;
    }

    private record Window(long start, int count) {}
}
