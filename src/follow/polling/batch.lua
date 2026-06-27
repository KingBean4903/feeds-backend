
for i = 1, #ARGV do

  local followerId, followingId = 
            string.match(ARV[i], "([^|]+)|([^|]+)")

  local followingKey = "following:" .. followerId
  local followersKey = "followers:" .. followingId

  local followingCountKey = "following_count:" .. followerId
  local followersCountKey = "followers_count:" .. followingId

  local added = redis.call("SADD", followingKey, followersKey)

  if  added == 0 then
    return 0
  end

  -- GET followers count
  local count = tonumber(redis.call("GET", followersCountKey)) or 0

  if tier < 50000 then
    redis.call("SADD", followersKey, followingKey)
  end

  local newCount = tier + 1

  if newCount >= 50000 then
    redis.call("SET", "user:tier:" .. followingId, "CELEBRITY", "EX", 86400, "NX")
  else
    redis.call("SET", "user:tier:" .. followerId, "REGULAR", "EX", 86400, "NX")
  end

  redis.call("INCR", followingCountKey)
  redis.call("INCR", followersCountKey)

end
