import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Since we cannot scrape a private Amazon/DigiKey account securely from the server,
    // we return a mock set of data to demonstrate the UI flow.
    // In the future, a Chrome Extension will send this exact payload.

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockItems = [
      {
        component_name: "ESP32-WROOM-32D Wi-Fi + Bluetooth Module",
        quantity: 50,
        price: 3.50
      },
      {
        component_name: "10k Ohm 1/4W Metal Film Resistors (Pack of 100)",
        quantity: 10,
        price: 1.20
      },
      {
        component_name: "LM317 Voltage Regulator",
        quantity: 25,
        price: 0.45
      }
    ];

    return NextResponse.json({ 
      success: true, 
      items: mockItems,
      message: "Components extracted successfully (Mock Data)"
    });

  } catch (error: any) {
    console.error("Scraping error:", error);
    return NextResponse.json({ error: "Failed to extract data from URL" }, { status: 500 });
  }
}
