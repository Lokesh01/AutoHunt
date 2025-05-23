"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as z from "zod";
import type { CarStatus as CarStatusType } from "@/lib/generated/prisma";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MAX_IMAGE_SIZE } from "../../../constants";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { addCar, processCarImageWithAI } from "@/actions/cars";

// Predefined options
const fuelTypes: string[] = [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid",
  "Plug-in Hybrid",
];
const transmissions: string[] = ["Automatic", "Manual", "Semi-Automatic"];
const bodyTypes: string[] = [
  "SUV",
  "Sedan",
  "Hatchback",
  "Convertible",
  "Coupe",
  "Wagon",
  "Pickup",
];
const carStatuses: CarStatusType[] = ["AVAILABLE", "UNAVAILABLE", "SOLD"];

//for schema
const carFormSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.string().refine((val) => {
    const year = parseInt(val);
    return !isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 1;
  }, "Valid year required"),
  price: z.string().min(1, "Price is required"),
  mileage: z.string().min(1, "Mileage is required"),
  color: z.string().min(1, "Color is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  bodyType: z.string().min(1, "Body type is required"),
  seats: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD"]),
  featured: z.boolean().default(false),
  // Images are handled separately
});

const AddCarForm = () => {
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedAiImage, setUploadedAiImage] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("ai"); // assuming "ai" and "upload" are your only tabs
  const [imageError, setImageError] = useState<string>("");

  //initialize form with react-hook-form and zod
  const {
    register,
    setValue,
    getValues,
    formState: { errors },
    handleSubmit,
    watch,
  } = useForm({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      make: "",
      model: "",
      year: "",
      price: "",
      mileage: "",
      color: "",
      fuelType: "",
      transmission: "",
      bodyType: "",
      seats: "",
      description: "",
      status: "AVAILABLE",
      featured: false,
    },
  });

  //custom hook for api calls
  const {
    loading: addCarLoading,
    fn: addCarFn,
    data: addCarResult,
  } = useFetch(addCar);

  const {
    loading: processImageLoading,
    fn: processImageFn,
    data: processImageResult,
    error: processImageError,
  } = useFetch(processCarImageWithAI);

  // handle successful car addition
  useEffect(() => {
    if (addCarResult?.success) {
      toast.success("Car added successfully");
      router.push("/admin/cars");
    }
  }, [addCarResult, router]);

  useEffect(() => {
    if (processImageError) {
      toast.error(processImageError.message || "Failed to upload car");
    }
  }, [processImageError]);

  //handle successful AI processing
  useEffect(() => {
    if (processImageResult?.success && processImageResult.data) {
      const carDetails = processImageResult.data;
      // Update form with AI results
      setValue("make", carDetails.make);
      setValue("model", carDetails.model);
      setValue("year", carDetails.year.toString());
      setValue("color", carDetails.color);
      setValue("bodyType", carDetails.bodyType);
      setValue("fuelType", carDetails.fuelType);
      setValue("price", carDetails.price);
      setValue("mileage", carDetails.mileage);
      setValue("transmission", carDetails.transmission);
      setValue("description", carDetails.description);

      // add the image to the uploaded images array
      if (uploadedAiImage) {
        const reader = new FileReader();

        reader.onload = (e: ProgressEvent<FileReader>) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            setUploadedImages((prev) => [...prev, result]);
          }
        };

        reader.readAsDataURL(uploadedAiImage);
      }

      toast.success("Successfully extracted car details", {
        description: `Detected ${carDetails.year} ${carDetails.make} ${
          carDetails.model
        } with ${Math.round(carDetails.confidence * 100)}% confidence`,
      });

      // Switch to manual tab for the user to review and fill in missing details
      setActiveTab("manual");
    }
  }, [processImageResult, setValue, uploadedAiImage]);

  //process image with gemini ai
  const processWithAI = async () => {
    if (!uploadedAiImage) {
      toast.error("please upload an image first");
      return;
    }

    await processImageFn(uploadedAiImage);
  };

  // Handle AI image upload with dropzone
  const onAiDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploadedAiImage(file);

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setImagePreview(result);
      }
    };
    reader.readAsDataURL(file);
  }, []); //empty dependency array means create the function once and never update it again

  const { getRootProps: getAiRootProps, getInputProps: getAiInputProps } =
    useDropzone({
      onDrop: onAiDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      },
      maxFiles: 1,
      multiple: false,
    });

  //Handle multiple image uploads with dropzone
  const onMultiImagesDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter((file) => {
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error(
          `${file.name} exceeds ${
            MAX_IMAGE_SIZE / 1024 / 1024
          }MB limit and will be skipped`
        );
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    //simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);

        //process the images
        const newImages: string[] = [];
        validFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            newImages.push(e.target?.result as string);

            //when all images are processed
            if (newImages.length === validFiles.length) {
              setUploadedImages((prev) => [...prev, ...newImages]);
              setUploadProgress(0);
              setImageError("");
              toast.success(
                `Successfully uploaded ${validFiles.length} images`
              );
            }
          };
          reader.readAsDataURL(file);
        });
      }
    }, 200);
  }, []);

  const {
    getRootProps: getMultiImageRootProps,
    getInputProps: getMultiImageInputProps,
  } = useDropzone({
    onDrop: onMultiImagesDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: true,
  });

  //remove image from upload preview
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    // check if images are uploaded
    if (uploadedImages.length === 0) {
      setImageError("Please upload at least one image");
      return;
    }

    //prepare data for server action
    const carData = {
      ...data,
      year: parseInt(data.year),
      price: parseFloat(data.price),
      mileage: parseFloat(data.mileage),
      seats: data.seats ? parseInt(data.seats) : null,
    };

    //call the addcar function with our usefetch hook
    await addCarFn({
      carData,
      images: uploadedImages,
    });
  };

  return (
    <div>
      <Tabs
        defaultValue="ai"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai">AI Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Car Details</CardTitle>
              <CardDescription>
                Enter the details of the car you want to add.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* MAKE */}
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      {...register("make")}
                      placeholder="e.g Toyota"
                      className={errors.make ? "border-red-500" : ""}
                    />
                    {errors.make && (
                      <p className="text-xs text-red-500">
                        {errors.make.message}
                      </p>
                    )}
                  </div>

                  {/* Model */}
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      {...register("model")}
                      placeholder="e.g. Camry"
                      className={errors.model ? "border-red-500" : ""}
                    />
                    {errors.model && (
                      <p className="text-xs text-red-500">
                        {errors.model.message}
                      </p>
                    )}
                  </div>

                  {/* Year */}
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      {...register("year")}
                      placeholder="e.g. 2022"
                      className={errors.year ? "border-red-500" : ""}
                    />
                    {errors.year && (
                      <p className="text-xs text-red-500">
                        {errors.year.message}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      {...register("price")}
                      placeholder="e.g. 20000"
                      className={errors.price ? "border-red-500" : ""}
                    />
                    {errors.price && (
                      <p className="text-xs text-red-500">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  {/* Mileage */}
                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input
                      id="mileage"
                      {...register("mileage")}
                      placeholder="e.g. 50000"
                      className={errors.mileage ? "border-red-500" : ""}
                    />
                    {errors.mileage && (
                      <p className="text-xs text-red-500">
                        {errors.mileage.message}
                      </p>
                    )}
                  </div>

                  {/* Color */}
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      {...register("color")}
                      placeholder="e.g. Red"
                      className={errors.color ? "border-red-500" : ""}
                    />
                    {errors.color && (
                      <p className="text-xs text-red-500">
                        {errors.color.message}
                      </p>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div className="space-y-2">
                    <Label htmlFor="fuelType">Fuel Type</Label>
                    <Select
                      onValueChange={(value) => setValue("fuelType", value)}
                    >
                      <SelectTrigger
                        className={errors.fuelType ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select a fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuelTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.fuelType && (
                      <p className="text-xs text-red-500">
                        {errors.fuelType.message}
                      </p>
                    )}
                  </div>

                  {/* Transmission */}
                  <div className="space-y-2">
                    <Label htmlFor="transmission">Transmission</Label>
                    <Select
                      onValueChange={(value) => setValue("transmission", value)}
                      defaultValue={getValues("transmission")}
                    >
                      <SelectTrigger
                        className={errors.transmission ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select transmission" />
                      </SelectTrigger>
                      <SelectContent>
                        {transmissions.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.transmission && (
                      <p className="text-xs text-red-500">
                        {errors.transmission.message}
                      </p>
                    )}
                  </div>

                  {/* Body Type */}
                  <div className="space-y-2">
                    <Label htmlFor="bodyType">Body Type</Label>
                    <Select
                      onValueChange={(value) => setValue("bodyType", value)}
                      defaultValue={getValues("bodyType")}
                    >
                      <SelectTrigger
                        className={errors.bodyType ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.bodyType && (
                      <p className="text-xs text-red-500">
                        {errors.bodyType.message}
                      </p>
                    )}
                  </div>

                  {/* Seats */}
                  <div className="space-y-2">
                    <Label htmlFor="seats">
                      Number of Seats{" "}
                      <span className="text-sm text-gray-500">(Optional)</span>
                    </Label>
                    <Input
                      id="seats"
                      {...register("seats")}
                      placeholder="e.g. 4"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      onValueChange={(value) => setValue("status", value)}
                      defaultValue={getValues("status")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {carStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe the car in detail..."
                    className={`min-h-32 ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Featured */}
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <Checkbox
                    id="featured"
                    checked={watch("featured")}
                    onCheckedChange={(checked) => {
                      setValue("featured", checked);
                    }}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="featured">Feature this car</Label>
                    <p className="text-sm text-gray-500">
                      Featured cars appear on the homepage
                    </p>
                  </div>
                </div>

                {/* Image upload with dropzone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="images"
                    className={imageError ? "text-red-500" : ""}
                  >
                    Images{" "}
                    {imageError && <span className="text-red-500">*</span>}
                  </Label>
                  <div
                    {...getMultiImageRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition ${
                      imageError ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <input {...getMultiImageInputProps()} />
                    <div className="flex flex-col items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <span className="text-sm text-gray-600">
                        Drag and drop or click to upload multiple images
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        (JPG, PNG, WebP, max 5MB each)
                      </span>
                    </div>
                  </div>
                  {imageError && (
                    <p className="text-xs text-red-500 mt-1">{imageError}</p>
                  )}
                  {uploadProgress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div
                        className="bg-red-500 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  )}

                  {/* Image Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">
                        Uploaded Images ({uploadedImages.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {uploadedImages.map((image, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={image}
                              alt={`Car Image ${index}`}
                              height={50}
                              width={50}
                              className="h-28 w-full object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={addCarLoading}
                >
                  {addCarLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Adding
                      Car...
                    </>
                  ) : (
                    "Add Car"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Car Details</CardTitle>
              <CardDescription>
                Upload a car image, sit back, and let the AI take care of the
                details.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={imagePreview}
                        alt="car preview"
                        className="max-h-56 max-w-full object-contain mb-4"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImagePreview(null);
                            setUploadedAiImage(null);
                          }}
                        >
                          Remove
                        </Button>
                        <Button
                          onClick={processWithAI}
                          disabled={processImageLoading}
                          size="sm"
                        >
                          {processImageLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin " />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Camera className="mr-2 h-4 w-4" />
                              Extract Details
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      {...getAiRootProps()}
                      className="cursor-pointer hover:bg-gray-50 transition"
                    >
                      <input {...getAiInputProps()} />
                      <div className="flex flex-col items-center justify-center">
                        <Camera className="h-12 w-12 text-gray-400 mb-3" />
                        <span className="text-sm text-gray-600">
                          Drag & drop or click to upload a car image
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          (JPG, PNG, WebP, max 5MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {processImageLoading && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-md flex items-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    <div>
                      <p className="font-medium">Analyzing image...</p>
                      <p className="text-sm">
                        Gemini is extracting car details
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
                    How it works
                  </h3>
                  <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300 list-decimal pl-4">
                    <li>Upload a clear image of the car</li>
                    <li>
                      Click &quot;Extract Details&quot; to analyze with Gemini
                      AI
                    </li>
                    <li>Review the extracted information</li>
                    <li>Fill in any missing details manually</li>
                    <li>Add the car to your inventory</li>
                  </ol>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
                  <h3 className="font-medium mb-1 text-amber-800 dark:text-amber-200">
                    Tips for best results
                  </h3>
                  <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Use clear, well-lit images</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Try to capture the entire vehicle</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>For difficult models, use multiple views</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Always verify AI-extracted information</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddCarForm;
