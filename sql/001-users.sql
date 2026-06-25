COPY "User" (id, username, displayName)
FROM '/data/users.csv' WITH (FORMAT csv, HEADER false);
