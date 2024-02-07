import { NextRequest } from "next/server";
import axios from "axios";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
      return Response.json({ error: "Missing code parameter" });
    }

    const queryParams = new URLSearchParams({
      code: code as string,
      redirect_uri: "http://localhost:3000/api/auth/callback",
      grant_type: "authorization_code",
    });

    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      method: "post",
      data: queryParams.toString(),
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    try {
      const response = await axios(authOptions);
      // return Response.redirect(`http://localhost:3000/}`);
      cookies().set("token", response.data.access_token);
      return Response.redirect(`http://localhost:3000/`);
    } catch (error) {
      console.error("Error:", error);
      return Response.json({ error: "Internal server error" });
    }
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ error: "Internal server error" });
  }
}
