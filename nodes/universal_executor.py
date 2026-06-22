# Enhanced UniversalExecutor with retries and error handling

import asyncio
import time
from functools import wraps

def retry(max_retries=3, delay=1):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    await asyncio.sleep(delay * (2 ** attempt))
            return None
        return wrapper
    return decorator

class UniversalExecutor:
    # ... existing code enhanced with @retry on critical methods
    @retry()
    async def execute_workflow(self, workflow_name: str, inputs: dict):
        # Integration with Vellum + custom MX nodes
        pass

# New custom nodes integration added