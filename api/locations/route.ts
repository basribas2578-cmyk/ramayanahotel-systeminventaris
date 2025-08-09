import { NextResponse } from "next/server"
import { dbFetchLocations } from "@/lib/mock-db"

export async function GET() {
  try {
    const locations = await dbFetchLocations()
    return NextResponse.json(locations)
  } catch (error) {
    console.error("Error fetching locations:", error)
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Location name is required" }, { status: 400 })
    }

    // In a real app, you would save to database
    const newLocation = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(newLocation, { status: 201 })
  } catch (error) {
    console.error("Error creating location:", error)
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 })
  }
}
