import asyncio
import httpx

async def fetch_graphql():
    query = """
    query userProblemsSolved($username: String!) {
        matchedUser(username: $username) {
            submitStats { acSubmissionNum { difficulty count } }
            userCalendar {
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
        print("\nGraphQL Combined:")
        print(res.text)

if __name__ == "__main__":
    asyncio.run(fetch_graphql())
