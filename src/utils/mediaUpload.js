import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "@/config/env";

// Validate AWS configuration
const validateAWSConfig = () => {
    if (!env.aws.region || !env.aws.accessKeyId || !env.aws.secretAccessKey || !env.aws.s3Bucket) {
        throw new Error(
            "AWS configuration is missing. Please set NEXT_PUBLIC_AWS_REGION, NEXT_PUBLIC_AWS_ACCESS_KEY_ID, NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY, and NEXT_PUBLIC_S3_BUCKET environment variables."
        );
    }
};

// Initialize S3 client
let s3Client = null;

const getS3Client = () => {
    if (!s3Client) {
        validateAWSConfig();
        s3Client = new S3Client({
            region: env.aws.region,
            credentials: {
                accessKeyId: env.aws.accessKeyId,
                secretAccessKey: env.aws.secretAccessKey,
            },
        });
    }
    return s3Client;
};

/**
 * Generate folder path for S3 storage
 */
const getFolderPath = (businessSlug, moduleName, mimetype, originalname) => {
    let folder = "others";
    if (mimetype.startsWith("image/")) folder = "images";
    else if (mimetype.startsWith("video/")) folder = "videos";
    else if (mimetype === "application/pdf") folder = "pdfs";

    const timestamp = Date.now();
    const fileName = originalname.replace(/[^a-zA-Z0-9.-]/g, "_"); // Sanitize filename
    return `${businessSlug}/${moduleName}/${folder}/${timestamp}_${fileName}`;
};

/**
 * Generate presigned URL for S3 upload
 */
const getPresignedUrl = async (businessSlug, moduleName, fileName, fileType) => {
    validateAWSConfig();

    const key = getFolderPath(businessSlug, moduleName, fileType, fileName);
    const dispositionType = "inline";

    const command = new PutObjectCommand({
        Bucket: env.aws.s3Bucket,
        Key: key,
        ContentType: fileType,
        ContentDisposition: `${dispositionType}; filename="${fileName}"`,
    });

    try {
        const client = getS3Client();
        const uploadURL = await getSignedUrl(client, command, { expiresIn: 3600 });
        const fileUrl = `${env.aws.cloudfrontUrl || ''}/${key}`;

        return { uploadURL, key, fileUrl };
    } catch (error) {
        console.error("Error generating presigned URL:", error);
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
    }
};

/**
 * Generic media upload utility for uploading files to S3 via presigned URLs
 */
export const uploadMediaFiles = async ({ files, businessSlug, moduleName, onProgress }) => {
    if (!files || files.length === 0) return [];

    const uploads = files.map((file) => ({
        file,
        label: file.name,
        percent: 0,
        loaded: 0,
        total: file.size,
        error: null,
        url: null,
    }));


    if (onProgress) {
        onProgress([...uploads]);
    }

    const uploadPromises = uploads.map(async (upload) => {
        try {

            const { uploadURL, fileUrl } = await getPresignedUrl(
                businessSlug,
                moduleName,
                upload.file.name,
                upload.file.type
            );

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", uploadURL, true);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        upload.percent = Math.round((event.loaded / event.total) * 100);
                        upload.loaded = event.loaded;
                        upload.total = event.total;
                        if (onProgress) {
                            onProgress([...uploads]);
                        }
                    }
                };

                xhr.onload = () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        upload.percent = 100;
                        upload.url = fileUrl;
                        if (onProgress) {
                            onProgress([...uploads]);
                        }
                        resolve();
                    } else {
                        let errorMessage = `Upload failed (${xhr.status})`;
                        let responseText = "";
                        try {
                            responseText = xhr.responseText || "";

                            if (responseText.includes("<Error>")) {
                                const parser = new DOMParser();
                                const xmlDoc = parser.parseFromString(responseText, "text/xml");
                                const code = xmlDoc.querySelector("Code")?.textContent || "";
                                const message = xmlDoc.querySelector("Message")?.textContent || "";
                                if (code || message) {
                                    responseText = `${code}: ${message}`;
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing response:", e);
                        }

                        console.error("Upload error details:", {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            responseText: responseText,
                            uploadURL: uploadURL.substring(0, 100) + "...",
                        });

                        if (xhr.status === 403) {
                            errorMessage = `Access denied (403). ${responseText || "Please check:\n1. AWS credentials are set correctly\n2. IAM user has s3:PutObject permission\n3. S3 bucket CORS allows PUT from your origin\n4. Bucket policy allows uploads"}`;
                        } else if (xhr.status === 400) {
                            errorMessage = `Bad request (400). ${responseText || "Please check file format and size."}`;
                        }
                        upload.error = errorMessage;
                        if (onProgress) {
                            onProgress([...uploads]);
                        }
                        reject(new Error(errorMessage));
                    }
                };

                xhr.onerror = () => {
                    upload.error = "Network error during upload";
                    if (onProgress) {
                        onProgress([...uploads]);
                    }
                    reject(new Error("Network error during upload"));
                };


                xhr.setRequestHeader("Content-Type", upload.file.type);
                xhr.setRequestHeader("Content-Disposition", `inline; filename="${upload.file.name}"`);
                xhr.send(upload.file);
            });

            return fileUrl;
        } catch (error) {
            upload.error = error.message || "Upload failed";
            if (onProgress) {
                onProgress([...uploads]);
            }
            throw error;
        }
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
};

/**
 * Upload a single file
 */
export const uploadSingleFile = async ({ file, businessSlug, moduleName, onProgress }) => {
    const [url] = await uploadMediaFiles({
        files: [file],
        businessSlug,
        moduleName,
        onProgress: (uploads) => {
            if (uploads[0] && onProgress) {
                onProgress(uploads[0].percent, uploads[0].loaded, uploads[0].total);
            }
        },
    });
    return url;
};
