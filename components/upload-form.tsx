"use client";

import Image from "next/image";
import { useState } from "react";

export default function UploadForm() {
  const [brandName, setBrandName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState<string>("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [brandGuide, setBrandGuide] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<HTMLImageElement | null>(null);
  const [fileError, setFileError] = useState<string>("");

  const handleTextUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => setBrandGuide(reader.result as string);
      reader.readAsText(e.target.files[0]);
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setFileError("Invalid file type. Only PNG, JPEG, and WebP are accepted.");
      return;
    }

    setFileError("");
    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => setImagePreview(img);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="brandName" className="block text-sm font-medium mb-1">Brand Name *</label>
        <input
          id="brandName"
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="targetAudience" className="block text-sm font-medium mb-1">Target Audience *</label>
        <input
          id="targetAudience"
          type="text"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="platform" className="block text-sm font-medium mb-1">Platform *</label>
        <select
          id="platform"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a platform</option>
          <option value="web">Web</option>
          <option value="mobile">Mobile App</option>
          <option value="social">Social Media</option>
          <option value="email">Email</option>
        </select>
      </div>

      <div>
        <label htmlFor="campaignGoal" className="block text-sm font-medium mb-1">Campaign Goal *</label>
        <input
          id="campaignGoal"
          type="text"
          value={campaignGoal}
          onChange={(e) => setCampaignGoal(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="brandGuideText" className="block text-sm font-medium mb-1">Brand Guide *</label>
        <textarea
          id="brandGuideText"
          value={brandGuide}
          onChange={(e) => setBrandGuide(e.target.value)}
          required
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="textUpload" className="block text-sm font-medium mb-1">Optional Brand Guide (.txt)</label>
        <input
          id="textUpload"
          type="file"
          accept=".txt,text/plain"
          onChange={handleTextUpload}
          className="block w-full text-xs text-gray-500 file:mr-2 file:text-sm file:font-medium file:bg-blue-100 file:rounded-md hover:file:bg-blue-200 cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="imageUpload" className="block text-sm font-medium mb-1">Creative Image</label>
        <input
          id="imageUpload"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          onChange={handleImageUpload}
          className={`block w-full text-xs ${fileError ? "text-red-500 file:text-red-600" : "text-gray-500"} file:mr-2 file:text-sm file:font-medium file:bg-purple-100 file:rounded-md hover:file:bg-purple-200 cursor-pointer`}
        />
      </div>

      {fileError && <p className="text-red-600 text-xs">{fileError}</p>}

      {imagePreview && (
        <Image src={imagePreview.src} alt="Uploaded preview" fill className="rounded border object-contain max-h-48 w-full h-auto" sizes="(max-width: 768px) 100vw, 50vw" />
      )}

      {uploadedFile && (
        <p className="text-xs text-gray-500">
          Uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
        </p>
      )}

      <button
        type="submit"
        onClick={() => console.log("Submitting:", { brandName, targetAudience, platform, campaignGoal, brandGuide })}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit
      </button>

      <p className="text-xs text-gray-400">Click submit to log state (no API call)</p>
    </form>
  );
}
