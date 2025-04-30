//! Validation utilities for the DarkSwap platform.

use darkswap_lib::{Error, Result};

/// Validate a Bitcoin address.
pub fn validate_bitcoin_address(address: &str) -> Result<()> {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a Bitcoin library to validate the address.
    if address.starts_with("1") || address.starts_with("3") || address.starts_with("bc1") {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid Bitcoin address: {}",
            address
        )))
    }
}

/// Validate a rune ID.
pub fn validate_rune_id(id: &str) -> Result<()> {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a more sophisticated validation.
    if id.len() <= 16 && id.chars().all(|c| c.is_alphanumeric()) {
        Ok(())
    } else {
        Err(Error::Validation(format!("Invalid rune ID: {}", id)))
    }
}

/// Validate an alkane ID.
pub fn validate_alkane_id(id: &str) -> Result<()> {
    // This is a simplified validation that just checks the format.
    // In a real implementation, you would use a more sophisticated validation.
    if id.len() <= 16 && id.chars().all(|c| c.is_alphanumeric()) {
        Ok(())
    } else {
        Err(Error::Validation(format!("Invalid alkane ID: {}", id)))
    }
}

/// Validate an order side.
pub fn validate_order_side(side: &str) -> Result<()> {
    if side == "buy" || side == "sell" {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid order side: {}. Must be 'buy' or 'sell'.",
            side
        )))
    }
}

/// Validate an order amount.
pub fn validate_order_amount(amount: f64) -> Result<()> {
    if amount > 0.0 {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid order amount: {}. Must be greater than 0.",
            amount
        )))
    }
}

/// Validate an order price.
pub fn validate_order_price(price: f64) -> Result<()> {
    if price > 0.0 {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid order price: {}. Must be greater than 0.",
            price
        )))
    }
}

/// Validate an order expiry.
pub fn validate_order_expiry(expiry: u64) -> Result<()> {
    if expiry > 0 {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid order expiry: {}. Must be greater than 0.",
            expiry
        )))
    }
}

/// Validate an email address.
pub fn validate_email(email: &str) -> Result<()> {
    // This is a simplified validation that just checks for @ and .
    // In a real implementation, you would use a more sophisticated validation.
    if email.contains('@') && email.contains('.') {
        Ok(())
    } else {
        Err(Error::Validation(format!(
            "Invalid email address: {}",
            email
        )))
    }
}

/// Validate a password.
pub fn validate_password(password: &str) -> Result<()> {
    // Check length
    if password.len() < 8 {
        return Err(Error::Validation(
            "Password must be at least 8 characters long".to_string(),
        ));
    }

    // Check for at least one uppercase letter
    if !password.chars().any(|c| c.is_uppercase()) {
        return Err(Error::Validation(
            "Password must contain at least one uppercase letter".to_string(),
        ));
    }

    // Check for at least one lowercase letter
    if !password.chars().any(|c| c.is_lowercase()) {
        return Err(Error::Validation(
            "Password must contain at least one lowercase letter".to_string(),
        ));
    }

    // Check for at least one digit
    if !password.chars().any(|c| c.is_digit(10)) {
        return Err(Error::Validation(
            "Password must contain at least one digit".to_string(),
        ));
    }

    // Check for at least one special character
    if !password.chars().any(|c| !c.is_alphanumeric()) {
        return Err(Error::Validation(
            "Password must contain at least one special character".to_string(),
        ));
    }

    Ok(())
}

/// Validate a username.
pub fn validate_username(username: &str) -> Result<()> {
    // Check length
    if username.len() < 3 || username.len() > 20 {
        return Err(Error::Validation(
            "Username must be between 3 and 20 characters long".to_string(),
        ));
    }

    // Check for valid characters
    if !username.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
        return Err(Error::Validation(
            "Username can only contain letters, numbers, underscores, and hyphens".to_string(),
        ));
    }

    Ok(())
}

/// Validate a URL.
pub fn validate_url(url: &str) -> Result<()> {
    // This is a simplified validation that just checks for http:// or https://
    // In a real implementation, you would use a more sophisticated validation.
    if url.starts_with("http://") || url.starts_with("https://") {
        Ok(())
    } else {
        Err(Error::Validation(format!("Invalid URL: {}", url)))
    }
}

/// Validate a file path.
pub fn validate_file_path(path: &str) -> Result<()> {
    // This is a simplified validation that just checks for invalid characters.
    // In a real implementation, you would use a more sophisticated validation.
    if path.contains("..") || path.contains("//") {
        Err(Error::Validation(format!("Invalid file path: {}", path)))
    } else {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_bitcoin_address() {
        assert!(validate_bitcoin_address("1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2").is_ok());
        assert!(validate_bitcoin_address("3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy").is_ok());
        assert!(validate_bitcoin_address("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq").is_ok());
        assert!(validate_bitcoin_address("invalid-address").is_err());
    }

    #[test]
    fn test_validate_rune_id() {
        assert!(validate_rune_id("RUNE123").is_ok());
        assert!(validate_rune_id("123456789012345").is_ok());
        assert!(validate_rune_id("RUNE123!").is_err());
        assert!(validate_rune_id("12345678901234567").is_err());
    }

    #[test]
    fn test_validate_alkane_id() {
        assert!(validate_alkane_id("ALKANE123").is_ok());
        assert!(validate_alkane_id("123456789012345").is_ok());
        assert!(validate_alkane_id("ALKANE123!").is_err());
        assert!(validate_alkane_id("12345678901234567").is_err());
    }

    #[test]
    fn test_validate_order_side() {
        assert!(validate_order_side("buy").is_ok());
        assert!(validate_order_side("sell").is_ok());
        assert!(validate_order_side("invalid").is_err());
    }

    #[test]
    fn test_validate_order_amount() {
        assert!(validate_order_amount(1.0).is_ok());
        assert!(validate_order_amount(0.1).is_ok());
        assert!(validate_order_amount(0.0).is_err());
        assert!(validate_order_amount(-1.0).is_err());
    }

    #[test]
    fn test_validate_order_price() {
        assert!(validate_order_price(1.0).is_ok());
        assert!(validate_order_price(0.1).is_ok());
        assert!(validate_order_price(0.0).is_err());
        assert!(validate_order_price(-1.0).is_err());
    }

    #[test]
    fn test_validate_order_expiry() {
        assert!(validate_order_expiry(1).is_ok());
        assert!(validate_order_expiry(3600).is_ok());
        assert!(validate_order_expiry(0).is_err());
    }

    #[test]
    fn test_validate_email() {
        assert!(validate_email("test@example.com").is_ok());
        assert!(validate_email("invalid-email").is_err());
    }

    #[test]
    fn test_validate_password() {
        assert!(validate_password("Password1!").is_ok());
        assert!(validate_password("password").is_err()); // Too short
        assert!(validate_password("password1!").is_err()); // No uppercase
        assert!(validate_password("PASSWORD1!").is_err()); // No lowercase
        assert!(validate_password("Password!").is_err()); // No digit
        assert!(validate_password("Password1").is_err()); // No special character
    }

    #[test]
    fn test_validate_username() {
        assert!(validate_username("user123").is_ok());
        assert!(validate_username("user-name").is_ok());
        assert!(validate_username("user_name").is_ok());
        assert!(validate_username("ab").is_err()); // Too short
        assert!(validate_username("abcdefghijklmnopqrstuvwxyz").is_err()); // Too long
        assert!(validate_username("user name").is_err()); // Contains space
        assert!(validate_username("user@name").is_err()); // Contains special character
    }

    #[test]
    fn test_validate_url() {
        assert!(validate_url("https://example.com").is_ok());
        assert!(validate_url("http://example.com").is_ok());
        assert!(validate_url("example.com").is_err());
    }

    #[test]
    fn test_validate_file_path() {
        assert!(validate_file_path("/path/to/file").is_ok());
        assert!(validate_file_path("path/to/file").is_ok());
        assert!(validate_file_path("../path/to/file").is_err());
        assert!(validate_file_path("path//to/file").is_err());
    }
}