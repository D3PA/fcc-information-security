import hashlib

def crack_sha1_hash(hash, use_salts=False):
    # read the list of common passwords
    with open('top-10000-passwords.txt', 'r') as f:
        passwords = [line.strip() for line in f]
    
    if use_salts:
        # read the list of known salts
        with open('known-salts.txt', 'r') as f:
            salts = [line.strip() for line in f]
        
        # try each password with each salt (prepended and appended)
        for password in passwords:
            for salt in salts:
                # try salt + password
                salted_password = salt + password
                hashed = hashlib.sha1(salted_password.encode()).hexdigest()
                if hashed == hash:
                    return password
                
                # try password + salt
                salted_password = password + salt
                hashed = hashlib.sha1(salted_password.encode()).hexdigest()
                if hashed == hash:
                    return password
    
    else:
        # try each password without salts
        for password in passwords:
            hashed = hashlib.sha1(password.encode()).hexdigest()
            if hashed == hash:
                return password
    
    return "PASSWORD NOT IN DATABASE"