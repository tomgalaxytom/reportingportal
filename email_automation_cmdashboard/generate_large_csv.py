import pandas as pd

print("Generating 50,000 test email records...")

data = []
for i in range(1, 50001):
    data.append({
        "name": f"User {i}",
        "email": f"user{i}@example.com",
        "city": f"City {i % 10 + 1}"
    })

df = pd.DataFrame(data)
df.to_csv("large_emails.csv", index=False)
print("Successfully generated 'large_emails.csv' with 50,000 rows!")
