from app.main import app
for m in app.user_middleware:
    print(m)

# Let's inspect the actual middleware stack
print("\nActual middleware stack:")
current = app.middleware_stack
count = 0
while current:
    print(f"{count}: {current}")
    if hasattr(current, 'app'):
        current = current.app
    else:
        break
    count += 1
