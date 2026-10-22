import asyncio
import httpx

async def fetch_alfa():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://alfa-leetcode-api.onrender.com/shankar_gouda/profile", timeout=15)
        print("Alfa /profile:")
        print(res.text[:300])

        res2 = await client.get("https://alfa-leetcode-api.onrender.com/shankar_gouda/calendar", timeout=15)
        print("\nAlfa /calendar:")
        print(res2.text[:300])

async def fetch_graphql():
    query = """
    query userProfileCalendar($username: String!) {
      matchedUser(username: $username) {
        userCalendar {
          activeYears
          streak
          totalActiveDays
        }
      }
    }
    """
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://leetcode.com/",
        "Origin": "https://leetcode.com",
    }
    async with httpx.AsyncClient(headers=headers) as client:
        res = await client.post("https://leetcode.com/graphql", json={"query": query, "variables": {"username": "shankar_gouda"}})
        print("\nGraphQL userCalendar:")
        print(res.text)

if __name__ == "__main__":
    asyncio.run(fetch_alfa())
    asyncio.run(fetch_graphql())
