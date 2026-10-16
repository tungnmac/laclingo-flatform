import bcrypt from 'bcryptjs'

const COST = 12

export const hashPassword = (password: string) => bcrypt.hash(password, COST)
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash)

// Hash thật của 1 mật khẩu ngẫu nhiên — login với email không tồn tại vẫn chạy bcrypt.compare,
// tốn thời gian như email có thật nên không lộ email nào đã đăng ký qua thời gian phản hồi.
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(crypto.randomUUID(), COST)
