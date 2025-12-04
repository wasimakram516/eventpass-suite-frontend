/**
 * Batch upload media files with real-time S3 upload progress tracking
 * Uploads ALL media files in ONE request, then tracks progress

 */
export const batchUploadMediaWithProgress = async (eventId, data, onProgress) => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append("eventId", eventId);


        const mediaFiles = Array.isArray(data.mediaFiles) ? data.mediaFiles : [];
        const additionalData = data;

        mediaFiles.forEach((item) => {
            if (item.type === 'logo' && item.file) {
                formData.append("logo", item.file);
            } else if (item.type === 'backgroundEn' && item.file) {
                formData.append("backgroundEn", item.file);
            } else if (item.type === 'backgroundAr' && item.file) {
                formData.append("backgroundAr", item.file);
            } else if (item.type === 'brandingMedia' && item.file) {
                formData.append("brandingMedia", item.file);
            } else if (item.type === 'agenda' && item.file) {
                formData.append("agenda", item.file);
            }
        });


        const brandingItems = mediaFiles.filter(m => m.type === 'brandingMedia');
        if (brandingItems.length > 0) {
            const meta = brandingItems.map(item => ({
                name: item.name || "",
                website: item.website || ""
            }));
            formData.append("brandingMediaMeta", JSON.stringify(meta));
        }


        if (additionalData.removeLogo) formData.append("removeLogo", "true");
        if (additionalData.removeBackgroundEn) formData.append("removeBackgroundEn", "true");
        if (additionalData.removeBackgroundAr) formData.append("removeBackgroundAr", "true");
        if (additionalData.clearAllBrandingLogos) formData.append("clearAllBrandingLogos", "true");
        if (additionalData.brandingMediaUrls) {
            formData.append("brandingMediaUrls", typeof additionalData.brandingMediaUrls === 'string'
                ? additionalData.brandingMediaUrls
                : JSON.stringify(additionalData.brandingMediaUrls));
        }
        if (additionalData.removeBrandingLogoIds) {
            formData.append("removeBrandingLogoIds", typeof additionalData.removeBrandingLogoIds === 'string'
                ? additionalData.removeBrandingLogoIds
                : JSON.stringify(additionalData.removeBrandingLogoIds));
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        const uploadUrl = `${API_BASE_URL}/eventreg/events/batch-upload-media`;

        const xhr = new XMLHttpRequest();
        let responseBuffer = "";


        xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
                // This is HTTP upload progress, S3 progress comes from SSE events
            }
        });

        let isComplete = false;


        xhr.addEventListener("progress", () => {

            if (isComplete) return;

            const newData = xhr.responseText.substring(responseBuffer.length);
            responseBuffer = xhr.responseText;

            const lines = newData.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.substring(6));

                        if (data.error) {
                            isComplete = true;
                            reject(new Error(data.error));
                            return;
                        } else if (data.allComplete) {
                            isComplete = true;

                            if (onProgress && data.totalUploaded) {

                                for (let i = 0; i < data.totalUploaded; i++) {
                                    onProgress({ taskIndex: i, percent: 100, complete: true });
                                }
                            }
                            resolve(data);
                            return;
                        } else {

                            if (onProgress && data.percent !== undefined && !isComplete) {
                                onProgress(data);
                            }
                        }
                    } catch (e) {

                    }
                }
            }
        });


        xhr.addEventListener("load", () => {
            if (isComplete) return; // Already resolved/rejected

            if (xhr.status >= 200 && xhr.status < 300) {
                try {

                    const lines = xhr.responseText.split('\n');
                    let lastData = null;
                    for (let i = lines.length - 1; i >= 0; i--) {
                        if (lines[i].startsWith('data: ')) {
                            try {
                                lastData = JSON.parse(lines[i].substring(6));
                                if (lastData.allComplete || lastData.error) {
                                    break;
                                }
                            } catch (e) {

                            }
                        }
                    }

                    if (lastData?.allComplete) {
                        isComplete = true;
                        resolve(lastData);
                    } else if (lastData?.error) {
                        isComplete = true;
                        reject(new Error(lastData.error));
                    } else {
                        isComplete = true;
                        resolve({ totalUploaded: 0 });
                    }
                } catch (e) {
                    isComplete = true;
                    resolve({ totalUploaded: 0 });
                }
            } else {
                isComplete = true;
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.message || error.error || "Upload failed"));
                } catch (e) {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        });


        xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
            reject(new Error("Upload was aborted"));
        });


        const token = sessionStorage.getItem("accessToken");

        xhr.open("POST", uploadUrl);
        if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        }
        xhr.send(formData);
    });
};
