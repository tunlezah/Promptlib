**1. SQL injection in `get_user` — High**

- **Where:** `users.py`, `get_user()`, line 14
- **What can go wrong:** `username` is interpolated straight into the query string, so a value such as `' OR 1=1 --` returns every row and a crafted value can read other tables.
- **Fix:**
  ```python
  cur.execute("SELECT * FROM users WHERE name = %s", (username,))
  ```
- **Confidence:** high

**2. Password compared with `==` — Medium**

- **Where:** `auth.py`, `check_password()`, line 32
- **What can go wrong:** Plain string comparison leaks timing information and the stored value is not hashed.
- **Fix:** store a `bcrypt` hash and compare with `bcrypt.checkpw`.
- **Confidence:** medium

**Summary:** 1 high, 1 medium. Fix the query parameterisation first. I could not assess the session handling without seeing `session.py`.
