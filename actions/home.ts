"use server";

import aj from "@/lib/arcjet";
import { db } from "@/lib/prisma";
import type { Car } from "@/lib/generated/prisma";
import { request } from "@arcjet/next";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Function to serialize car data
function serializeCarData(car: Car) {
  return {
    ...car,
    price: car.price ? parseFloat(car.price.toString()) : 0,
    createdAt: car.createdAt?.toISOString(),
    updatedAt: car.updatedAt?.toISOString(),
  };
}

//get featured cars for homepage
export async function getFeaturedCars(limit: number = 3) {
  try {
    const cars = await db.car.findMany({
      where: {
        featured: true,
        status: "AVAILABLE",
      },
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    });

    return cars.map(serializeCarData);
  } catch (error) {
    throw new Error(
      "Error fetching featured cars:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}

//convert file to base64
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  return buffer.toString("base64");
}

// process car image with Gemini AI
export async function processImageSearch(file: File) {
  try {
    //get request data for ArcJet
    const req = await request();

    //check rate limit
    const decision = await aj.protect(req, {
      requested: 1, //specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. please try again later.");
      }
      throw new Error("Request blocked!");
    }

    //check if api key available
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    //initialize gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    //convert image file to base64
    const base64Image = await fileToBase64(file);

    //create image part for the model
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: file.type,
      },
    };

    // Define the prompt for car search extraction
    const prompt = `
     Analyze this car image and extract the following information for a search query:
     1. Make (manufacturer)
     2. Body type (SUV, Sedan, Hatchback, etc.)
     3. Color

     Format your response as a clean JSON object with these fields:
     {
       "make": "",
       "bodyType": "",
       "color": "",
       "confidence": 0.0
     }

     For confidence, provide a value between 0 and 1 representing how confident you are in your overall identification.
     Only respond with the JSON object, nothing else.
   `;

    //get response from gemini
    const result = await model.generateContent([imagePart, prompt]);
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    //parse the json response
    try {
      const carDetails = JSON.parse(cleanedText);

      //return success response with data
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
    throw new Error(
      "AI Search error:" +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
