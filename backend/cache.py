"""
Redis caching service for performance optimization
Caches recommendations, leaderboards, and frequently accessed data
"""
import redis
import json
import os
from typing import Optional, Any, List
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

# Cache expiration times (in seconds)
CACHE_EXPIRATION = {
    "recommendations": 3600,  # 1 hour
    "analytics": 1800,  # 30 minutes
    "leaderboard": 600,  # 10 minutes
    "course_list": 1800,  # 30 minutes
    "user_progress": 300,  # 5 minutes
}


class RedisCache:
    """Redis caching service"""
    
    def __init__(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                password=REDIS_PASSWORD,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_keepalive=True,
                health_check_interval=30
            )
            # Test connection
            self.client.ping()
            logger.info("Redis connection established")
        except redis.ConnectionError as e:
            logger.error(f"Redis connection failed: {e}")
            self.client = None
    
    def is_available(self) -> bool:
        """Check if Redis is available"""
        if self.client is None:
            return False
        try:
            self.client.ping()
            return True
        except:
            return False
    
    def _make_key(self, prefix: str, identifier: str) -> str:
        """Generate cache key"""
        return f"elearning:{prefix}:{identifier}"
    
    def get(self, prefix: str, identifier: str) -> Optional[Any]:
        """Get cached value"""
        if not self.is_available():
            return None
        
        try:
            key = self._make_key(prefix, identifier)
            data = self.client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis GET error: {e}")
            return None
    
    def set(
        self,
        prefix: str,
        identifier: str,
        value: Any,
        expiration: Optional[int] = None
    ) -> bool:
        """Set cached value"""
        if not self.is_available():
            return False
        
        try:
            key = self._make_key(prefix, identifier)
            data = json.dumps(value)
            
            if expiration is None:
                expiration = CACHE_EXPIRATION.get(prefix, 3600)
            
            self.client.setex(key, expiration, data)
            return True
        except Exception as e:
            logger.error(f"Redis SET error: {e}")
            return False
    
    def delete(self, prefix: str, identifier: str) -> bool:
        """Delete cached value"""
        if not self.is_available():
            return False
        
        try:
            key = self._make_key(prefix, identifier)
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.is_available():
            return 0
        
        try:
            keys = self.client.keys(f"elearning:{pattern}*")
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis INVALIDATE error: {e}")
            return 0
    
    # ============= Specific Cache Operations =============
    
    def cache_recommendations(self, user_id: str, recommendations: List[dict]) -> bool:
        """Cache user recommendations"""
        return self.set("recommendations", user_id, recommendations)
    
    def get_recommendations(self, user_id: str) -> Optional[List[dict]]:
        """Get cached recommendations"""
        return self.get("recommendations", user_id)
    
    def cache_user_analytics(self, user_id: str, analytics: dict) -> bool:
        """Cache user analytics"""
        return self.set("analytics", f"user:{user_id}", analytics)
    
    def get_user_analytics(self, user_id: str) -> Optional[dict]:
        """Get cached user analytics"""
        return self.get("analytics", f"user:{user_id}")
    
    def cache_course_analytics(self, course_id: str, analytics: dict) -> bool:
        """Cache course analytics"""
        return self.set("analytics", f"course:{course_id}", analytics)
    
    def get_course_analytics(self, course_id: str) -> Optional[dict]:
        """Get cached course analytics"""
        return self.get("analytics", f"course:{course_id}")
    
    def add_to_leaderboard(
        self,
        leaderboard_name: str,
        user_id: str,
        score: float
    ) -> bool:
        """Add user to leaderboard (sorted set)"""
        if not self.is_available():
            return False
        
        try:
            key = self._make_key("leaderboard", leaderboard_name)
            self.client.zadd(key, {user_id: score})
            self.client.expire(key, CACHE_EXPIRATION["leaderboard"])
            return True
        except Exception as e:
            logger.error(f"Leaderboard ADD error: {e}")
            return False
    
    def get_leaderboard(
        self,
        leaderboard_name: str,
        top_n: int = 10,
        descending: bool = True
    ) -> Optional[List[tuple]]:
        """Get top N from leaderboard"""
        if not self.is_available():
            return None
        
        try:
            key = self._make_key("leaderboard", leaderboard_name)
            if descending:
                results = self.client.zrevrange(key, 0, top_n - 1, withscores=True)
            else:
                results = self.client.zrange(key, 0, top_n - 1, withscores=True)
            return results
        except Exception as e:
            logger.error(f"Leaderboard GET error: {e}")
            return None
    
    def cache_session(self, session_id: str, session_data: dict, expiration: int = 3600) -> bool:
        """Cache user session"""
        return self.set("session", session_id, session_data, expiration)
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get cached session"""
        return self.get("session", session_id)
    
    def increment_counter(self, counter_name: str, amount: int = 1) -> Optional[int]:
        """Increment a counter"""
        if not self.is_available():
            return None
        
        try:
            key = self._make_key("counter", counter_name)
            return self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Counter INCREMENT error: {e}")
            return None
    
    def get_counter(self, counter_name: str) -> Optional[int]:
        """Get counter value"""
        if not self.is_available():
            return None
        
        try:
            key = self._make_key("counter", counter_name)
            value = self.client.get(key)
            return int(value) if value else 0
        except Exception as e:
            logger.error(f"Counter GET error: {e}")
            return None


# Global cache instance
cache = RedisCache()


# Decorator for caching function results
def cached(prefix: str, expiration: Optional[int] = None):
    """Decorator to cache function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key from function arguments
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_result = cache.get(prefix, cache_key)
            if cached_result is not None:
                logger.debug(f"Cache HIT for {prefix}:{cache_key}")
                return cached_result
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache.set(prefix, cache_key, result, expiration)
            logger.debug(f"Cache MISS for {prefix}:{cache_key}")
            
            return result
        return wrapper
    return decorator