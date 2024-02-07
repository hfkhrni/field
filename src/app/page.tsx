"use client";

import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "usehooks-ts";

type Tracks = SpotifyApi.RecommendationTrackObject[];

export default function Home() {
  const router = useRouter();
  const [trackInput, setTrackInput] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const token = Cookies.get("token");
  const [recommendations, setRecommendations] = useState<Tracks>([]);
  const [trackName, setTrackName] = useState<string>("hi");
  const { isIntersecting, ref } = useIntersectionObserver({
    threshold: 0.5,
  });

  console.log(isIntersecting);
  // if (!token) {
  //   throw new Error("No token found");
  // }
  // console.log("hi", token);
  const isLoggedIn = token !== undefined && token !== "";
  const player = useRef<Spotify.Player>();
  useEffect(() => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      player.current = new Spotify.Player({
        name: "Web Playback SDK Quick Start Player",
        getOAuthToken: (cb) => {
          cb(token as string);
        },
        volume: 0.5,
      });

      player.current.setName("field").then(() => {
        console.log("field");
      });

      player.current.connect();

      // Ready
      player.current.addListener("ready", ({ device_id }) => {
        console.log("Ready with Device ID", device_id);
      });

      // Not Ready
      player.current.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
      });
      player.current.addListener("initialization_error", ({ message }) => {
        console.error(message);
      });

      player.current.addListener("authentication_error", ({ message }) => {
        console.error(message);
      });

      player.current.addListener("account_error", ({ message }) => {
        console.error(message);
      });
    };
  }, []);

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
  }, []);

  console.log(recommendations.length);
  useEffect(() => {
    if (!isIntersecting) return;
    console.log("hi");
    if (recommendations.length >= 1000) return;
    refetch();
  }, [isIntersecting]);

  const { isLoading, error, data, refetch } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const data = await fetchRecs(getURI(trackInput));
      return data;
    },
    enabled: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const last = recommendations ? recommendations.at(-1)?.id : null;
  console.log(last);

  async function fetchRecs(uri: string) {
    const res = await axios.get("https://api.spotify.com/v1/recommendations", {
      params: {
        seed_tracks: uri,
        seed_genres: ["pop", "rock", "indie"],
        limit: 100,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.data) return;
    const data = res.data;
    setRecommendations([...recommendations, ...data.tracks]);
    return res.data;
  }

  function addToPlayback(uri: string) {
    axios.post(
      `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${encodeURIComponent(uri)}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  function playTrack(uri: string) {
    axios.put(
      `https://api.spotify.com/v1/me/player/play`,
      {
        uris: [`spotify:track:${encodeURIComponent(uri)}`],
        position_ms: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  }

  function togglePlay(action: string) {
    if (action === "play") {
      console.log(player.current);
      player.current?.togglePlay();
    }
    if (action === "next") {
      console.log(player.current);
      player.current?.nextTrack();
    }
    if (action === "seek") {
      console.log(player.current);
      player.current?.seek(25000);
    }
  }

  async function handleInput(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!trackInput) {
      return;
    }
    const trackURL = new URL(trackInput);
    if (trackURL.hostname !== "open.spotify.com") {
      throw new Error("Not a spotify url");
    }
    const uri = trackURL.pathname.split("/track/")[1];
    refetch();
  }

  function getURI(url: string) {
    const trackURL = new URL(trackInput);
    if (trackURL.hostname !== "open.spotify.com") {
      throw new Error("Not a spotify url");
    }
    const uri = trackURL.pathname.split("/track/")[1];
    return uri;
  }

  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="flex justify-between font-mono">
        {isLoggedIn ? (
          <>
            <form
              onSubmit={handleInput}
              className="flex-grow"
            >
              <input
                type="text"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
                placeholder="Enter spotify track url"
                className="bg-slate-500 w-full placeholder:text-white placeholder:pl-2 rounded-sm"
              ></input>
            </form>
            <button
              onClick={() => {
                Cookies.remove("token");
                router.refresh();
              }}
              className="hover:bg-blue-300 mx-2 font-mono"
            >
              OUT
            </button>
          </>
        ) : (
          <>
            <div className="flex-grow bg-slate-500">
              <p>log into spotify</p>
            </div>
            <a
              href="api/auth/login"
              className="bg-red-500 hover:bg-blue-300"
            >
              log in
            </a>
          </>
        )}
      </div>
      <div>
        <p>{trackName}</p>
      </div>
      <div className="grid lg:grid-cols-8 sm:grid-cols-6 grid-cols-4 w-full pb-12">
        {/* <p>{JSON.stringify(tracks)}</p>
         */}

        {recommendations
          ? recommendations.map(
              (t: SpotifyApi.RecommendationTrackObject, index) => (
                <div
                  onMouseOver={() => setTrackName(t.name)}
                  onClick={() => {
                    // router.push(`/track/${t["id"]}`);
                    playTrack(t["id"]);
                    togglePlay("next");
                  }}
                  key={`${t.id}-${index}`}
                  ref={t.id === last ? ref : null}
                >
                  <div>
                    <Image
                      src={t.album.images[0]?.url}
                      alt=""
                      width={300}
                      height={300}
                    />
                  </div>
                </div>
              ),
            )
          : null}
      </div>
      <div className="bg-slate-500 fixed bottom-0 w-full flex items-center justify-center">
        <button
          className="hover:bg-blue-300 rounded-sm font-mono px-2 py-1 m-2"
          onClick={() => togglePlay("previous")}
        >
          PRS
        </button>
        <button
          className="hover:bg-blue-300 rounded-sm font-mono px-2 py-1 m-2"
          onClick={() => togglePlay("play")}
        >
          PY
        </button>
        <button
          className="hover:bg-blue-300 rounded-sm font-mono px-2 py-1 m-2"
          onClick={() => togglePlay("next")}
        >
          NXT
        </button>
        <button
          className="hover:bg-blue-300 rounded-sm font-mono px-2 py-1 m-2"
          onClick={() => togglePlay("seek")}
        >
          seek
        </button>
      </div>
    </>
  );
}
