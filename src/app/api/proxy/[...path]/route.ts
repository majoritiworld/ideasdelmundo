"use server";
import { CONFIG } from "@/lib/app-config";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from "next/server";

const SERVER_URL = CONFIG.serverUrl;

async function handleProxy(req: NextRequest, pathParam: { [key: string]: any }) {
  let pathArray: string[] = [];
  if (Array.isArray(pathParam.path)) {
    pathArray = pathParam.path;
  } else if (typeof pathParam === "object") {
    pathArray = Object.values(pathParam).flat();
  }

  if (!pathArray.length) {
    return NextResponse.json({ message: "Invalid request: No path provided" }, { status: 400 });
  }
  const endpoint = pathArray.join("/");
  const originalUrl = new URL(req.url);
  const queryString = originalUrl.search;
  const apiUrl = `${SERVER_URL}/${endpoint}${queryString}`;
  console.log(`🔄 Proxying request to: ${apiUrl}`);

  const contentType = req.headers.get("content-type") || "";
  let body: string | ArrayBuffer | undefined;

  if (req.method !== "GET" && req.method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      // Stream raw body through - parsing/re-serializing FormData can corrupt multipart
      body = await req.arrayBuffer();
      console.log("📝 Forwarding multipart body (raw)");
    } else {
      try {
        const data = await req.json();
        body = JSON.stringify(data);
        console.log("📝 Parsed body=", data);
      } catch (err) {
        console.log("🛑 Error parsing JSON:", err);
      }
    }
  }

  try {
    const incomingCookie = req.headers.get("cookie");
    const authorization = req.headers.get("authorization");

    const newHeaders = new Headers();
    // Forward Supabase auth cookie + Authorization so backend can identify the user
    if (incomingCookie) newHeaders.set("Cookie", incomingCookie);
    if (authorization) newHeaders.set("Authorization", authorization);
    // Copy other headers (except host - backend has its own)
    req.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "host") {
        newHeaders.set(key, value);
      }
    });
    // Override with our explicit auth headers (ensure cookie/authorization are set)
    if (incomingCookie) newHeaders.set("Cookie", incomingCookie);
    if (authorization) newHeaders.set("Authorization", authorization);

    if (!contentType.includes("multipart/form-data")) {
      newHeaders.set("Content-Type", "application/json");
      newHeaders.delete("content-length");
    }

    const requestOptions: RequestInit = {
      method: req.method || "GET",
      headers: newHeaders,
      body,
    };
    const response = await fetch(apiUrl, requestOptions);

    // Parse the backend response
    const responseContentType = response.headers.get("content-type");
    let responseData;
    if (responseContentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`✅ Received response from backend (${response.status})`);

    const nextResp = NextResponse.json(responseData, {
      status: response.status,
    });
    const setCookieValue = response.headers.get("set-cookie");
    console.log("setCookieValue: ", setCookieValue);
    if (setCookieValue) {
      nextResp.headers.set("Set-Cookie", setCookieValue || "");
    }

    return nextResp;
  } catch (error) {
    console.error(`❌ Proxy error: ${error instanceof Error ? error.message : "Unknown error"}`);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: any) {
  const resolved = await params;
  return handleProxy(req, resolved);
}

export async function POST(req: NextRequest, { params }: any) {
  const resolved = await params;
  return handleProxy(req, resolved);
}

export async function PUT(req: NextRequest, { params }: any) {
  const resolved = await params;
  return handleProxy(req, resolved);
}

export async function DELETE(req: NextRequest, { params }: any) {
  const resolved = await params;
  return handleProxy(req, resolved);
}

export async function PATCH(req: NextRequest, { params }: any) {
  const resolved = await params;
  return handleProxy(req, resolved);
}
