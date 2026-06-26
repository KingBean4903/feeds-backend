-- KEY[1] = following:userA
-- KEY[2] = followers:userB
-- KEY[3] = following_count:userA
-- KEY[4] = followers_count:userB
------------------
-- ARG[1] = userA
-- ARG[2] = userB
--

for i = 1, #ARGV do

  local followerId, followingId = 
            string.match(ARV[i], "([^|]+)|([^|]+)")

  local followingKey = "following:" .. followerId
  local followersKey = "followers:" .. followingId

  local followingCountKey = "following_count:" .. followerId
  local followersCountKey = "followers_count:" .. followingId

  local added = redis.call("SADD", followingKey, followersKey)

  if added == 0 then
    return 0
  end

    -- Check count of user
  local tier1 = tonumber(redis.call("GET", followersCountKey)) or 0 -- userA flws count

  if tier1 < 100000 then
    redis.call("SADD", followersKey, followingKey) -- add follower to set followers:userB
  end

  redis.call("INCR", followingCountKey)
  redis.call("INCR", followersCountKey)

end

