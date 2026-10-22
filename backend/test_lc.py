import asyncio
from app.sync import fetch_leetcode_profile

async def main():
    print("Testing Alfa API via Render...")
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get("https://alfa-leetcode-api.onrender.com/shankar_gouda/solved", timeout=15)
            print("Alfa API Status:", resp.status_code)
            print("Alfa API Data:", resp.text[:200])
    except Exception as e:
        print("Alfa API Failed:", e)

    print("\nTesting GraphQL directly...")
    try:
        data = await fetch_leetcode_profile("shankar_gouda")
        print("GraphQL returned:")
        print(data)
    except Exception as e:
        print("GraphQL Failed:", e)

if __name__ == "__main__":
    asyncio.run(main())
