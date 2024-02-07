import { redirect } from "next/navigation";
import { generateRandomString } from "@/lib/utils";

export async function GET(request: Request) {
  const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;

  const scope =
    "streaming \
user-read-email \
user-read-private";

  const state = generateRandomString(16);

  const auth_query_parameters = new URLSearchParams({
    response_type: "code",
    client_id: spotify_client_id!,
    scope: scope,
    redirect_uri: "http://localhost:3000/api/auth/callback",
    state: state,
  });

  return Response.redirect(
    `https://accounts.spotify.com/authorize/?${auth_query_parameters.toString()}`,
  );
}
