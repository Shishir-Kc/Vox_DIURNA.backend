from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os
import asyncio

_ = load_dotenv()

GROQ_API_KEY: str = str(os.getenv("GROQ_API"))

with open("Ai/Cloud/prompt.txt", "r") as prompt:
    system_prompt = prompt.read()


async def correct_spelling(user_content: str):
    model = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=GROQ_API_KEY,  # type: ignore[arg-type]
    )
    response = model.invoke(
        [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_content,
            },
        ]
    )
    if not response.content == "false":
        return {
            "Content":response.content,
            "Changed":True
            }
    
    return {
            "Content":None,
            "Changed":False
            }


if __name__ == "__main__":
    print(asyncio.run(correct_spelling(user_content=input(":>"))))
