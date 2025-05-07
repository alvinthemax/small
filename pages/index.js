import { useState, useEffect } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const fetchImages = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/github");
      if (!res.ok) throw new Error('Failed to fetch images');
      const data = await res.json();
      setImages(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load images");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Only JPG, PNG, GIF, or WebP images are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadResult(result);
      // Refresh image list after successful upload
      await fetchImages();
    } catch (err) {
      setError(err.message || "Something went wrong");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload & Preview Images</h1>

      <div className="mb-4">
        <input
          type="file"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setError("");
            setUploadResult(null);
          }}
          className="mb-2 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          accept="image/*"
        />
        <button
          onClick={handleUpload}
          disabled={isLoading || !file}
          className={`px-4 py-2 rounded text-white ${isLoading || !file ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 border rounded bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {uploadResult && (
        <div className="p-4 mb-4 border rounded bg-green-50 text-green-800">
          <p className="font-bold">✓ Upload successful!</p>
          <p>File name: {uploadResult.fileName}</p>
          <p>
            Link:{" "}
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              {uploadResult.url}
            </a>
          </p>
          <img 
            src={uploadResult.url} 
            alt="Uploaded preview" 
            className="mt-2 max-h-40 border rounded"
          />
        </div>
      )}

      <hr className="my-6" />

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold">Image Gallery</h2>
        <button 
          onClick={fetchImages} 
          disabled={isFetching}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isFetching && images.length === 0 ? (
        <p className="text-gray-500 mt-4">Loading images...</p>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {images.map((img) => (
            <div key={img.name} className="border rounded overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <img 
                  src={img.url} 
                  alt={img.name} 
                  className="object-contain w-full h-full p-1"
                  loading="lazy"
                />
              </div>
              <p className="text-xs p-2 truncate" title={img.name}>{img.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No images found.</p>
      )}
    </div>
  );
}
