-- Dòng của tài khoản đã xoá (cột người dùng NULL) không khôi phục được NOT NULL → xoá
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_user_id_fkey;
DELETE FROM payment_orders WHERE user_id IS NULL;
ALTER TABLE payment_orders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_created_by_fkey;
DELETE FROM missions WHERE created_by IS NULL;
ALTER TABLE missions ALTER COLUMN created_by SET NOT NULL;
ALTER TABLE missions ADD CONSTRAINT missions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_user_id_fkey;
DELETE FROM game_rooms WHERE host_user_id IS NULL;
ALTER TABLE game_rooms ALTER COLUMN host_user_id SET NOT NULL;
ALTER TABLE game_rooms ADD CONSTRAINT game_rooms_host_user_id_fkey
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE RESTRICT;
