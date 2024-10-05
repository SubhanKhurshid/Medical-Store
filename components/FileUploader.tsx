import React, { ChangeEvent, useState } from "react";
import { FiUpload } from "react-icons/fi"; // Using an upload icon for better visuals

interface FileUploaderProps {
    onFileSelect: (file: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                if (reader.result) {
                    onFileSelect(reader.result as string);
                    setImagePreview(reader.result as string);
                    setFileName(file.name);
                }
            };
        }
    };

    return (
        <div className="file-uploader">
            <label
                className="flex items-center justify-center w-full py-4 px-6 bg-emerald-50 border-2 border-dashed border-emerald-400 text-emerald-600 rounded-lg cursor-pointer hover:bg-emerald-100 transition-all duration-200"
                htmlFor="file-upload"
            >
                <FiUpload className="mr-2" />
                Upload Image
                <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                />
            </label>

            {/* Display the image preview or file name */}
            {imagePreview && (
                <img
                    src={imagePreview}
                    alt="Uploaded Preview"
                    className="mt-4 w-full h-auto rounded-lg"
                />
            )}
            {fileName && !imagePreview && (
                <p className="mt-4 text-sm text-gray-600">{fileName}</p>
            )}
        </div>
    );
};

export default FileUploader;
