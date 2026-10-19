-- =============================================================================
-- Seed luyện nói: chủ đề "Phỏng vấn CNTT" (tiếng Anh) — 10 câu nhắc lại (repeat)
-- + 10 câu hỏi phỏng vấn (answer, kèm câu trả lời mẫu + từ khoá "a|b" = 1 trong
-- các cách nói). Idempotent: chủ đề upsert, câu luyện chỉ thêm nếu chưa có
-- (theo language + topic + prompt). Cần chạy SAU migration 000030.
-- =============================================================================

INSERT INTO speaking_topics (language_id, name, icon, description, order_index)
VALUES ('en', 'Phỏng vấn CNTT', '💼', 'Luyện nói tiếng Anh cho buổi phỏng vấn lập trình viên: giới thiệu bản thân, kinh nghiệm, câu hỏi kỹ thuật.', 1)
ON CONFLICT (language_id, name) DO UPDATE
SET icon = EXCLUDED.icon, description = EXCLUDED.description, order_index = EXCLUDED.order_index;

INSERT INTO speaking_items (language_id, topic, kind, prompt, prompt_meaning, sample_answer, keywords, level, order_index)
SELECT 'en', 'Phỏng vấn CNTT', x.kind, x.prompt, x.meaning, x.sample, x.keywords::text[], x.level, x.ord
FROM (VALUES
-- ----- Nhắc lại câu mẫu -----
('repeat', 'I have three years of experience as a backend developer.', 'Tôi có ba năm kinh nghiệm làm lập trình viên backend.', '', '{}', 'A2', 1),
('repeat', 'I mainly work with Go, PostgreSQL and Docker.', 'Tôi chủ yếu làm việc với Go, PostgreSQL và Docker.', '', '{}', 'A2', 2),
('repeat', 'In my last project, I built a REST API for a mobile app.', 'Trong dự án gần nhất, tôi đã xây dựng một REST API cho ứng dụng di động.', '', '{}', 'B1', 3),
('repeat', 'I enjoy solving complex problems and writing clean code.', 'Tôi thích giải quyết các vấn đề phức tạp và viết code sạch.', '', '{}', 'B1', 4),
('repeat', 'I always write unit tests before I push my code.', 'Tôi luôn viết unit test trước khi đẩy code lên.', '', '{}', 'B1', 5),
('repeat', 'Our team used Scrum with two-week sprints.', 'Đội của tôi làm theo Scrum với các sprint hai tuần.', '', '{}', 'B1', 6),
('repeat', 'I reduced the page load time by forty percent.', 'Tôi đã giảm thời gian tải trang đi bốn mươi phần trăm.', '', '{}', 'B1', 7),
('repeat', 'I''m a quick learner and a good team player.', 'Tôi học hỏi nhanh và làm việc nhóm tốt.', '', '{}', 'A2', 8),
('repeat', 'Could you tell me more about the team I would be working with?', 'Anh/chị có thể cho tôi biết thêm về đội mà tôi sẽ làm việc cùng không?', '', '{}', 'B1', 9),
('repeat', 'Thank you for your time. I look forward to hearing from you.', 'Cảm ơn anh/chị đã dành thời gian. Tôi mong sớm nhận được phản hồi.', '', '{}', 'B1', 10),
-- ----- Trả lời câu hỏi phỏng vấn -----
('answer', 'Tell me about yourself.', 'Hãy giới thiệu về bản thân bạn.',
 'I am a backend developer with three years of experience. I mainly work with Go and PostgreSQL, and recently I built the payment service for an e-commerce project. My strongest skills are API design and performance tuning, and I enjoy working closely with my team.',
 '{"developer|engineer","experience|years","project","skills|skill","team"}', 'B1', 11),
('answer', 'Why do you want to work for our company?', 'Vì sao bạn muốn làm việc cho công ty chúng tôi?',
 'I really like your product and how many people use it every day. Your engineering culture and code review process are well known, and I want to grow in that kind of team. I believe my backend experience can help me contribute quickly.',
 '{"product|products","culture|team","grow|growth|learn","contribute|help"}', 'B1', 12),
('answer', 'What is your greatest strength?', 'Điểm mạnh lớn nhất của bạn là gì?',
 'My greatest strength is problem solving. For example, last year our API became very slow, so I profiled the queries, added the right indexes and cached the hot data. As a result the response time dropped by more than half, and I shared the approach with my team.',
 '{"strength","problem solving|solve problems|solving problems","for example|example","result|results","team"}', 'B1', 13),
('answer', 'Explain the difference between REST and GraphQL.', 'Hãy giải thích sự khác nhau giữa REST và GraphQL.',
 'REST exposes many endpoints, and each endpoint returns a fixed shape of data. GraphQL usually has a single endpoint, and the client writes a query to ask for exactly the fields it needs. This avoids over fetching and under fetching, but caching and rate limiting are harder.',
 '{"REST|RESTful","GraphQL","endpoint|endpoints","query|queries","over fetching|overfetching|under fetching"}', 'B2', 14),
('answer', 'How do you handle a bug in production?', 'Bạn xử lý một lỗi trên môi trường production như thế nào?',
 'First I check the monitoring dashboards and the logs to understand the impact. If it is serious, I roll back to the previous version. Then I reproduce the bug locally, write a test that fails, fix it, and deploy the hotfix. Finally I write a short post mortem so it does not happen again.',
 '{"logs|log","monitor|monitoring","reproduce","fix|hotfix","test|tests","roll back|rollback"}', 'B2', 15),
('answer', 'What is the difference between SQL and NoSQL databases?', 'Cơ sở dữ liệu SQL và NoSQL khác nhau thế nào?',
 'SQL databases store data in tables with a fixed schema and support joins and transactions, so they are great for structured data. NoSQL databases like MongoDB store documents or key value pairs with a flexible schema, and they are often easier to scale horizontally.',
 '{"SQL","NoSQL","schema","table|tables","document|documents","scale|scaling|scalability"}', 'B2', 16),
('answer', 'Describe a challenging project you worked on.', 'Hãy mô tả một dự án khó mà bạn từng làm.',
 'The most challenging project was migrating our monolith to microservices without downtime. The main problem was keeping data consistent between the old and new services. Our solution was to move one feature at a time behind a feature flag. In the end we finished on schedule and the team learned a lot.',
 '{"challenge|challenging","problem","solution|solved|solve","team","result|results|in the end"}', 'B2', 17),
('answer', 'How do you keep your technical skills up to date?', 'Bạn cập nhật kỹ năng kỹ thuật của mình bằng cách nào?',
 'I read official documentation and engineering blogs every week. I also take online courses when I learn a new technology, and I build small side projects to practice. Sometimes I join local developer communities and conferences to learn from other people.',
 '{"read|reading","course|courses","side project|side projects|project","documentation|docs","community|communities|conference|conferences"}', 'B1', 18),
('answer', 'What do you know about microservices?', 'Bạn biết gì về microservices?',
 'Microservices split an application into small services that each own one business capability. Each service can be developed, deployed and scaled independently, and they talk to each other through APIs or message queues. The trade off is more complexity in monitoring, networking and data consistency.',
 '{"service|services","independent|independently","deploy|deployed|deployment","API|APIs","scale|scaled|scaling"}', 'B2', 19),
('answer', 'Where do you see yourself in five years?', 'Bạn thấy mình ở đâu sau năm năm nữa?',
 'In five years I see myself as a senior engineer who can lead a small team. I want to keep learning about system design and cloud architecture, help junior developers grow, and take more ownership of the product.',
 '{"senior","lead|leader|leading","learn|learning","grow|growth","team"}', 'B1', 20)
) AS x(kind, prompt, meaning, sample, keywords, level, ord)
WHERE NOT EXISTS (
    SELECT 1 FROM speaking_items i WHERE i.language_id = 'en' AND i.topic = 'Phỏng vấn CNTT' AND i.prompt = x.prompt
);
