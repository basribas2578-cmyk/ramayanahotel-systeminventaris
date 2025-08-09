import { NextResponse } from "next/server"
import { dbFetchCategories } from "@/lib/mock-db"

export async function GET() {
  try {
    const categories = await dbFetchCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Basic validation
    if (!body.name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    }

    // In a real app, you would save to database
    const newCategory = {
      id: Date.now().toString(),
      name: body.name,
      description: body.description || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(newCategory, { status: 201 })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
