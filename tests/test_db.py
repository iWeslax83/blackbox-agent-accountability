from blackbox.db import get_pool, POOL_MAX_SIZE

def test_pool_is_singleton_and_bounded():
    p1 = get_pool()
    p2 = get_pool()
    assert p1 is p2                      # one shared pool
    assert p1.max_size == POOL_MAX_SIZE  # bounded for the free tier
    assert POOL_MAX_SIZE <= 7            # well under Supabase free direct-conn ceiling
