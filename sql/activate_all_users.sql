UPDATE users 
SET 
    is_activated = true, 
    activation_code = null, 
    activation_code_expires = null,
    updated_at = NOW()
WHERE 
    is_activated = false;