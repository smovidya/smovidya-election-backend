CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    voteAt DATETIME,
    voterId TEXT,
    position TEXT,
    candidateId TEXT
);
