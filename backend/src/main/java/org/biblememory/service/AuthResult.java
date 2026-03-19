package org.biblememory.service;

public record AuthResult(boolean success, String token, String username, boolean duplicateUsername) {

    public static AuthResult success(String token, String username) {
        return new AuthResult(true, token, username, false);
    }

    public static AuthResult failure() {
        return new AuthResult(false, null, null, false);
    }

    public static AuthResult duplicateUser() {
        return new AuthResult(false, null, null, true);
    }
}
