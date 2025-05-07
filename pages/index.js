import { useState, useEffect } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/github")
      .then((res) => res.json())
      .then(setImages)
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Upload failed");
        setUploadResult(null);
        return;
      }

      setUploadResult(result);
      setError("");

      // Refresh image list
      const newImages = await fetch("/api/github").then((res) => res.json());
      setImages(newImages);
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload & Preview Images</h1>

      <div className="mb-4">
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-2"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Upload
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {uploadResult && (
        <div className="p-4 mb-4 border rounded bg-green-50 text-green-800">
          <p><strong>Upload successful!</strong></p>
          <p>File name: {uploadResult.fileName}</p>
          <p>
            Link:{" "}
            <a
              href={uploadResult.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              {uploadResult.url}
            </a>
          </p>
        </div>
      )}

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-2">Image Gallery</h2>
      {images?.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {images.map((img) => (
            <div key={img.name} className="border p-2 rounded">
              <img src={img.url} alt={img.name} className="w-full h-auto" />
              <p className="text-xs mt-1 text-center">{img.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">No images found.</p>
      )}
    </div>
  );
}
