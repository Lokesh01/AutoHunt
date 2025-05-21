"use server";
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

// Import Prisma types directly from generated types
import {
  Prisma,
  type Car as PrismaCar,
  type CarStatus,
} from "@/lib/generated/prisma";
import { createClient } from "@/lib/supabase";

// Define TypeScript interfaces
interface CarAIResponse {
  make: string;
  model: string;
  year: number;
  color: string;
  price: string;
  mileage: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  description: string;
  confidence: number;
}

interface ProcessImageResponse {
  success: boolean;
  data?: CarAIResponse;
  error?: string;
}

// Define what we expect from user input (allows string values that will be converted)
interface AddCarParams {
  carData: {
    make: string;
    model: string;
    year: number;
    price: string | number;
    mileage: string | number;
    color: string;
    fuelType: string;
    transmission: string;
    bodyType: string;
    seats: number | null;
    description: string;
    status: CarStatus;
    featured: boolean;
  };
  images: string[]; // base64 encoded image strings
}

interface AddCarResponse {
  success: boolean;
  error?: string;
}

// Function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

// Gemini AI integration for car image processing
export async function processCarImageWithAI(
  file: File
): Promise<ProcessImageResponse> {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image file to base64
    const base64Image = await fileToBase64(file);

    // Create image part for the model
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Define the prompt for car detail extraction
    const prompt = `
      Analyze this car image and extract the following information:
      1. Make (manufacturer)
      2. Model
      3. Year (approximately)
      4. Color
      5. Body type (SUV, Sedan, Hatchback, etc.)
      6. Mileage
      7. Fuel type (your best guess)
      8. Transmission type (your best guess)
      9. Price (your best guess)
      9. Short Description as to be added to a car listing

      Format your response as a clean JSON object with these fields:
      {
        "make": "",
        "model": "",
        "year": 0000,
        "color": "",
        "price": "",
        "mileage": "",
        "bodyType": "",
        "fuelType": "",
        "transmission": "",
        "description": "",
        "confidence": 0.0
      }

      For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
      Only respond with the JSON object, nothing else.
    `;

    // Get response from Gemini
    const result = await model.generateContent([imagePart, prompt]);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    // Parse the JSON response
    try {
      const carDetails = JSON.parse(cleanedText) as CarAIResponse;

      // Validate the response format
      const requiredFields = [
        "make",
        "model",
        "year",
        "color",
        "bodyType",
        "price",
        "mileage",
        "fuelType",
        "transmission",
        "description",
        "confidence",
      ];

      const missingFields = requiredFields.filter(
        (field) => !(field in carDetails)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `AI response missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Return success response with data
      return {
        success: true,
        data: carDetails,
      };
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", text);
      return {
        success: false,
        error: "Failed to parse AI response",
      };
    }
  } catch (error) {
    console.error(
      "Gemini API error:",
      error instanceof Error ? error.message : String(error)
    );
    throw new Error(
      `Gemini API error: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function addCar({
  carData,
  images,
}: AddCarParams): Promise<AddCarResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Create the car data with proper types based on Prisma schema
    const carCreateData: Prisma.CarCreateInput = {
      id: uuidv4(),
      make: carData.make,
      model: carData.model,
      year: carData.year,
      price:
        typeof carData.price === "string"
          ? new Prisma.Decimal(carData.price)
          : new Prisma.Decimal(carData.price.toString()),
      mileage:
        typeof carData.mileage === "string"
          ? parseInt(carData.mileage, 10)
          : carData.mileage,
      color: carData.color,
      fuelType: carData.fuelType,
      transmission: carData.transmission,
      bodyType: carData.bodyType,
      seats: carData.seats,
      description: carData.description,
      status: carData.status,
      featured: carData.featured,
      images: [], // Will be populated after upload
    };

    // Create unique folder name for this car's images
    const carId = carCreateData.id;
    const folderPath = `cars/${carId}`;

    // Initialize supabase client for server-side operations
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Upload all images to supabase storage
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const base64Data = images[i];

      // Skip if image data is not valid
      if (!base64Data || !base64Data.startsWith("data:image/")) {
        console.warn("Skipping invalid image data");
        continue;
      }

      // Extract the base64 part (remove the data:image/xyz; base64, prefix)
      const base64 = base64Data.split(",")[1];
      const imageBuffer = Buffer.from(base64, "base64");

      // Determine file extension from the data URL
      const mimeMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
      const fileExtension = mimeMatch ? mimeMatch[1] : "jpeg";

      // Create filename
      const fileName = `image-${Date.now()}-${i}.${fileExtension}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload file buffer directly
      const { data, error } = await supabase.storage
        .from("car-images")
        .upload(filePath, imageBuffer, {
          contentType: `image/${fileExtension}`,
        });

      if (error) {
        console.log("Error uploading image:", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get the public URL for the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/autohunt-images/${filePath}`; // disable cache in config
      imageUrls.push(publicUrl);
    }

    if (imageUrls.length === 0) {
      throw new Error("No valid images were uploaded");
    }

    // Add the car to the database with the image URLs
    const car = await db.car.create({
      data: {
        ...carCreateData,
        images: imageUrls, // Store the array of image URLs
      },
    });

    // Revalidate the cars list page
    revalidatePath("/admin/cars");
    return {
      success: true,
    };
  } catch (error) {
    throw new Error(
      `Error adding car: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
