import { useState } from "react";
import "../App.css";

function ReportPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [status, setStatus] = useState({ message: "", type: "" });
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState("");

  const BACKEND_URL = "http://localhost:3001";

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStatus({ message: "", type: "" });
      setVerificationFailed(false);
      setImageAnalysis("");
      verifyLiveLocation(file);
    }
  };

  const verifyLiveLocation = (file) => {
    if (!navigator.geolocation) {
      setStatus({
        message: "Geolocation is not supported by your browser.",
        type: "error",
      });
      return;
    }

    setStatus({ message: "🛰️ Fetching your live location...", type: "info" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setStatus({ message: `📍 Location found! Verifying...`, type: "info" });
        submitForVerification({ latitude, longitude }, file);
      },
      (error) => {
        let message =
          "Could not get your location. Please enable location services.";
        if (error.code === error.PERMISSION_DENIED) {
          message =
            "Location access was denied. Please enable it in your browser settings.";
        }
        setStatus({ message, type: "error" });
      }
    );
  };

  const submitForVerification = async (coordinates, file) => {
    setStatus({ message: "🛰️ Verifying coordinates...", type: "info" });
    try {
      const response = await fetch(`${BACKEND_URL}/api/verify-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error("Server responded with an error.");
      }

      const result = await response.json();
      if (result.isValid) {
        setStatus({
          message: `✅ Valid Location! ${result.message}`,
          type: "success",
        });
        setVerificationFailed(false);
        analyzeImage(file);
      } else {
        setStatus({
          message: `⚠️ Location Invalid. You must be on-site (within a mangrove forest area) to submit a photo.`,
          type: "error",
        });
        setVerificationFailed(true);
      }
    } catch (error) {
      setStatus({
        message: "Could not connect to the verification server.",
        type: "error",
      });
    }
  };

  const analyzeImage = async (file) => {
    setStatus({ message: "Analyzing image with Gemini...", type: "info" });
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${BACKEND_URL}/api/analyze-image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image analysis server responded with an error.");
      }

      const result = await response.json();
      setImageAnalysis(result.analysis);
      setStatus({ message: "Image analysis complete.", type: "success" });
    } catch (error) {
      setStatus({
        message: "Could not connect to the image analysis server.",
        type: "error",
      });
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      setVerificationFailed(false);
      setStatus({ message: "", type: "" });
      verifyLiveLocation(selectedFile);
    }
  };

  return (
    <div className="container">
      <h2>Mangrove Protection Project</h2>
      <p>
        Upload a photo to report potential mangrove damage. Your live location
        will be used for verification.
      </p>

      <input
        type="file"
        id="file-input"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {imagePreview && (
        <img id="image-preview" src={imagePreview} alt="Selected Preview" />
      )}

      {!verificationFailed ? (
        <button
          onClick={() => document.getElementById("file-input").click()}
          className="btn-primary"
        >
          {selectedFile
            ? "Upload a Different Photo"
            : "Upload Photo & Verify Location"}
        </button>
      ) : (
        <button onClick={handleRetry} className="btn-retry">
          Retry Verification
        </button>
      )}

      {status.message && (
        <div id="status" className={status.type}>
          {status.message}
        </div>
      )}

      {imageAnalysis && (
        <div className="image-display-box">
          <h3>Image Analysis Result:</h3>
          {imageAnalysis.includes("The uploaded image is not of a mangrove") ? (
            <p className="error-message">{imageAnalysis}</p>
          ) : (
            imageAnalysis.split("\n").map((line, index) => {
              if (!line.trim()) return null; // Don't render empty lines
              const parts = line.split(":");
              const key = parts[0];
              const value = parts.slice(1).join(":");
              return (
                <div key={index} className="analysis-line">
                  <strong>{key}:</strong>
                  <span>{value.trim()}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default ReportPage;
