UPDATE users SET role = 'admin' WHERE role = 'owner';

ALTER TABLE users DROP COLUMN is_active;

ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
