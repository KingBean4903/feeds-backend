
local tier1 = tonumber(redis.call("GET", followersCountKey)) or 0 -- userA flws count

local newCount = tier + 1

if newCount >= 100000 then
    redis.call("SET", "user:tier:" .. ARG[1], "CELEBRITY")
else 
  redis.call("SET", "user:tier:" .. ARG[1], "REGULAR")
end

