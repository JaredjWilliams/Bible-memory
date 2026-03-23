package org.biblememory.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.util.List;

public class WithUserIdSecurityContextFactory implements WithSecurityContextFactory<WithUserId> {

    @Override
    public SecurityContext createSecurityContext(WithUserId annotation) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        UserPrincipal principal = new UserPrincipal(annotation.value(), annotation.username());
        context.setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, List.of()));
        return context;
    }
}
