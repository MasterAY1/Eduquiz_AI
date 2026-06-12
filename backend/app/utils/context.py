"""Context variables for asynchronous request-scoped storage."""

import contextvars
import uuid

# Context variables to track request correlation metrics downstream
request_id_ctx: contextvars.ContextVar[uuid.UUID | None] = contextvars.ContextVar(
    "request_id", default=None
)
user_id_ctx: contextvars.ContextVar[uuid.UUID | None] = contextvars.ContextVar(
    "user_id", default=None
)
client_ip_ctx: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "client_ip", default=None
)
user_agent_ctx: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "user_agent", default=None
)
