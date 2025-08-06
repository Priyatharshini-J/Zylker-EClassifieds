import { useRef, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { RootState } from "../store";
import { FaSave, FaTimes, FaTrash, FaUpload } from "react-icons/fa";
import {
  BASE_URL,
  STRATUS_BUCKET_NAME,
  STRATUS_BUCKET_URL,
} from "../constants";
import DeleteConfirmationDialog from "../components/DeleteConfirmationDialog";
import axios from "axios";

const SellerProductPage = () => {
  const DC = STRATUS_BUCKET_URL.split(".")[2];
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useSelector((state: RootState) => state.product);
  const product = products.find((p) => p.id === id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState(
    product
      ? {
          name: product.name,
          code: product.code,
          price: product.price,
          description: product.description,
          images: [...product.images],
        }
      : {
          name: "",
          code: "",
          price: 0,
          description: "",
          images: [],
        }
  );

  useEffect(() => {
    if (product?.images) {
      setOriginalImages([...product.images]);
    }
  }, [product]);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, e.target!.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl && !formData.images.includes(newImageUrl)) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImageUrl],
      }));

      setNewImageUrl("");
      setShowUrlInput(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== imageUrl),
    }));
  };
  // Function to handle product submission for both adding and editing a product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Create an instance for the Stratus bucket
    const stratus = (window as any).catalyst.stratus;
    const bucket = stratus.bucket(STRATUS_BUCKET_NAME);
    // try {
    //   // CASE 1: Adding a new product
    //   if (id === "new") {
    //     const uploadedImageUrls: string[] = [];
    //     const newImages = formData.images;

    //     // Upload each image to Stratus
    //     for (let i = 0; i < newImages.length; i++) {
    //       const ms = Date.now(); // Unique timestamp for filename
    //       const key = formData.name; // Folder name based on product name
    //       const fileData = dataURLToFile(newImages[i], `image${i}.jpg`); // Convert base64 to file
    //       // Upload the image to stratus bucket
    //       const putObject = await bucket.putObject(`${key}/${ms}`, fileData);
    //       await putObject.start();
    //       await putObject.abort();
    //       // Construct URL of uploaded image
    //       const fileUrl = `${STRATUS_BUCKET_URL}/${key}/${ms}`;
    //       uploadedImageUrls.push(fileUrl);
    //     }
    //     try {
    //       // Send product data to backend to store in ZOHO CRM Product's module
    //       await axios.post(
    //         `${BASE_URL}/server/zylker_eclassifieds_routes_handler/crmProduct`,
    //         {
    //           name: formData.name,
    //           code: formData.code,
    //           uploadedImageUrls: uploadedImageUrls.join(","),
    //           description: formData.description,
    //           price: formData.price,
    //         }
    //       );

    //       setSuccessMessage("Product added successfully !!!");
    //       setShowSuccessModal(true);
    //     } catch (error) {
    //       setSuccessMessage("Error occured while adding the product.");
    //       setShowFailureModal(true);
    //       console.error("Error in Add New Product:", error);
    //     } finally {
    //       setIsLoading(false);
    //     }
    //   }
    //   // CASE 2: Editing an existing product
    //   else {
    //     // Identify removed images: present in original but not in product form
    //     const removedImages = originalImages.filter(
    //       (img) => !formData.images.includes(img)
    //     );
    //     // Identify new images: present in form but not in original, and are base64
    //     const newImages = formData.images.filter(
    //       (img) => !originalImages.includes(img) && img.startsWith("data:")
    //     );
    //     // Delete removed images from Stratus
    //     for (const url of removedImages) {
    //       const key = url.split(`.${DC}/`)[1];
    //       const checkObjectAvailability = await bucket.headObject(key);
    //       if (checkObjectAvailability) await bucket.deleteObject(key);
    //     }

    //     const uploadedImageUrls: string[] = [];
    //     for (let i = 0; i < newImages.length; i++) {
    //       const ms = Date.now(); // Unique timestamp for filename
    //       const key = product?.images[0].split("/")[3]; // Extract folder name from old image URL
    //       const fileData = dataURLToFile(newImages[i], `image${i}.jpg`);
    //       // Upload the image to stratus bucket
    //       const putObject = await bucket.putObject(`${key}/${ms}`, fileData);
    //       await putObject.start();
    //       await putObject.abort();
    //       // Construct final URL from image prefix and file path
    //       const fileUrl =
    //         product?.images[0].split(`.${DC}/`)[0] + `.${DC}/` + key + "/" + ms;
    //       uploadedImageUrls.push(fileUrl);
    //     }

    //     // Prepare final image list: keep existing (excluding removed), add new
    //     const finalImages = originalImages
    //       .filter((img) => !removedImages.includes(img))
    //       .concat(uploadedImageUrls);
    //     // Update local state with final image list
    //     setOriginalImages(finalImages);

    //     try {
    //       // Send updated product data to backend for editing in ZOHO CRM Product's module
    //       await axios.put(
    //         `${BASE_URL}/server/zylker_eclassifieds_routes_handler/crmProduct/${id}`,
    //         {
    //           Product_Name: formData.name,
    //           Product_Code: formData.code,
    //           ImageUrls: finalImages.join(","),
    //           Description: formData.description,
    //           Unit_Price: formData.price,
    //         }
    //       );
    //       setSuccessMessage("Product Edited successfully !!!");
    //       setShowSuccessModal(true);
    //     } catch (error) {
    //       console.error("Error in Edit Product:", error);
    //       setSuccessMessage("Error occured while editing product");
    //       setShowFailureModal(true);
    //     } finally {
    //       setIsLoading(false);
    //     }
    //   }

    //   // After successful create/edit, navigate to seller dashboard
    //   setTimeout(() => {
    //     navigate("/seller/dashboard");
    //   }, 2000);
    // } catch (error) {
    //   console.log(`Error occured while editing - ${error}`);
    // }
  };

  // Function to handle the deletion of a product
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Make DELETE request to remove the product from CRM
      await axios.delete(
        `${BASE_URL}/server/zylker_eclassifieds_routes_handler/crmProduct/${id}`,
        {
          withCredentials: true,
        }
      );
      setIsDeleteDialogOpen(false);
      setSuccessMessage("Product deleted successfully");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to delete product:", error);
      setIsDeleteDialogOpen(false);
      setSuccessMessage("Product deletion failed");
      setShowFailureModal(true);
    } finally {
      setIsLoading(false);
    }
    setTimeout(() => {
      navigate("/seller/dashboard");
    }, 2000);
  };

  if (!product && id !== "new") {
    return <div>Product not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-2xl font-bold mb-8">
        {id === "new" ? "Add New Product" : "Edit Product"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {formData.images.map((imageUrl, index) => (
              <div key={imageUrl} className="relative group">
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <FaUpload />
                <span>Upload Image</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            {showUrlInput && (
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isLoading}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
          >
            <FaTrash />
            <span>Delete</span>
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <FaSave />
            <span>Save</span>
          </button>
        </div>
      </form>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold text-green-600">
              {successMessage}
            </h2>
            <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      {showFailureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold text-red-600">
              {successMessage}
            </h2>
            <p className="mt-2 text-gray-600">Redirecting to dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductPage;

function dataURLToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
