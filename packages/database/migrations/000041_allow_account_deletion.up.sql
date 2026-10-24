-- Học viên tự xoá tài khoản (App Store / Google Play bắt buộc). 2 khoá ngoại RESTRICT tới users đang chặn DELETE;
-- đổi sang SET NULL để giữ dữ liệu người khác/của hệ thống, bỏ trống người đã xoá:
--  - game_rooms: lịch sử thi đấu của những người chơi khác trong phòng người đó tạo
--  - missions: nhiệm vụ do admin đó tạo
-- Đơn thanh toán cũng giữ lại (ẩn danh) để đối soát / hoàn tiền với cổng thanh toán, thay vì xoá theo tài khoản.

ALTER TABLE game_rooms ALTER COLUMN host_user_id DROP NOT NULL;
ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_user_id_fkey;
ALTER TABLE game_rooms ADD CONSTRAINT game_rooms_host_user_id_fkey
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE missions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE missions DROP CONSTRAINT IF EXISTS missions_created_by_fkey;
ALTER TABLE missions ADD CONSTRAINT missions_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE payment_orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE payment_orders DROP CONSTRAINT IF EXISTS payment_orders_user_id_fkey;
ALTER TABLE payment_orders ADD CONSTRAINT payment_orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
