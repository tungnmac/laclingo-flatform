CREATE TABLE listening_topics (
    language_id VARCHAR(10) NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(16) NOT NULL DEFAULT '🎧',
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (language_id, name)
);
