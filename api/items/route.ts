import { NextResponse } from "next/server"
import { dbFetchItems } from "@/lib/mock-db"

export async function GET() {
  try {
    const items = await dbFetchItems()
    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}
