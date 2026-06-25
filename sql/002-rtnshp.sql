\copy "Follow" ("id","followerId","followingId") FROM '/data/relationships_clean.csv' WITH (FORMAT csv, HEADER false);
