import os
from groq import Groq

# 1. Initialize the client
# The client automatically looks for the 'GROQ_API_KEY' environment variable.
client = Groq()

# 2. Retrieve your model from the environment variables
# If GROQ_MODEL isn't set, it defaults to 'llama-3.3-70b-versatile'
model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

# 3. Send the message and get a response
try:
    completion = client.chat.completions.create(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": "Hi!"
            }
        ],
    )
    
    # 4. Print the model's reply
    print("Model Response:")
    print(completion.choices[0].message.content)

except Exception as e:
    print(f"An error occurred: {e}")
