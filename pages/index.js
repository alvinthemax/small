import { useState, useEffect } from "react";

export default function Home() {
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/github")
      .then((res) => res.json())
      .then(setImages)
      .catch(console.error);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/images", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setMessage(data.message || data.error);

    if (res.ok) {
      const newImages = await fetch("/api/github").then((res) => res.json());
      setImages(newImages);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upload & Preview Images</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Upload
      </button>

      {message && <p className="mt-2 text-sm">{message}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {images.map((img) => (
          <div key={img.name} className="border p-2 rounded">
            <img src={img.url} alt={img.name} className="w-full h-auto" />
            <p className="text-xs mt-1 text-center">{img.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
