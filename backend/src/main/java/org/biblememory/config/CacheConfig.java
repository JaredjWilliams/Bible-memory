package org.biblememory.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("passages");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(7, TimeUnit.DAYS)
                .initialCapacity(500)
                .maximumSize(10_000));
        return cacheManager;
    }
}
