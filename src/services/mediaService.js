import api from "./api";
import withApiHandler from "@/utils/withApiHandler";

/**
 * Universal Media Deletion Service
 * Deletes media files from S3 or Cloudinary
 * Optionally updates event records when eventId and mediaType 
 */
export const deleteMedia = withApiHandler(
    async ({
        fileUrl,
        storageType = "s3",
        eventId,
        mediaType,
        eventType = "public",
        removeBrandingLogoIds
    }) => {
        if (!fileUrl) {
            throw new Error("File URL is required");
        }

        const payload = {
            fileUrl,
            storageType,
        };

        // Add optional parameters if provided
        if (eventId) payload.eventId = eventId;
        if (mediaType) payload.mediaType = mediaType;
        if (eventType) payload.eventType = eventType;
        if (removeBrandingLogoIds) payload.removeBrandingLogoIds = removeBrandingLogoIds;

        const { data } = await api.post("/media/delete", payload);

        return data;
    },
    { showSuccess: true }
);

