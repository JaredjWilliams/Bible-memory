package org.biblememory.security;

import org.springframework.security.test.context.support.WithSecurityContext;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithUserIdSecurityContextFactory.class)
public @interface WithUserId {
    long value() default 1L;
    String username() default "testuser";
}
