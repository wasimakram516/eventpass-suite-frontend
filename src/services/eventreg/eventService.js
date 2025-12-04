import api from "@/services/api";
import withApiHandler from "@/utils/withApiHandler";

// Get all events (CMS use, protected)
export const getAllPublicEventsByBusiness = withApiHandler(async (businessSlug) => {
  const { data } = await api.get(`/eventreg/events`, {
    params: { businessSlug },
  });
  return data;
});

// Get event by slug (public use)
export const getPublicEventBySlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/events/slug/${slug}`);
  return data;
});

// Get event by ID (CMS use)
export const getPublicEventById = withApiHandler(async (id) => {
  const { data } = await api.get(`/eventreg/events/${id}`);
  return data;
});

export const getEventsByBusinessId = withApiHandler(async (businessId) => {
  const { data } = await api.get(`/eventreg/events/business/${businessId}`);
  return data;
});

export const getEventsByBusinessSlug = withApiHandler(async (slug) => {
  const { data } = await api.get(`/eventreg/events/business/slug/${slug}`);
  return data.events;
});

// Create a new event (FormData with optional logo)
export const createPublicEvent = withApiHandler(
  async (formData) => {
    const { data } = await api.post("/eventreg/events", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update an event by ID (FormData with optional logo)
export const updatePublicEvent = withApiHandler(
  async (id, formData) => {
    const { data } = await api.put(`/eventreg/events/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  { showSuccess: true }
);

// Update event with progress tracking (for SSE streaming)
export const updatePublicEventWithProgress = async (id, formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const updateUrl = `${API_BASE_URL}/eventreg/events/${id}`;

    const xhr = new XMLHttpRequest();
    let responseBuffer = "";

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
              resolve(data.event || data);
              return;
            } else {

              if (onProgress && data.percent !== undefined && !isComplete) {
                onProgress(data);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    xhr.addEventListener("load", () => {
      if (isComplete) return;

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
                // Continue searching
              }
            }
          }

          if (lastData?.allComplete) {
            isComplete = true;
            resolve(lastData.event || lastData);
          } else if (lastData?.error) {
            isComplete = true;
            reject(new Error(lastData.error));
          } else {
            isComplete = true;
            try {
              const jsonData = JSON.parse(xhr.responseText);
              resolve(jsonData);
            } catch (e) {
              resolve({});
            }
          }
        } catch (e) {
          isComplete = true;
          resolve({});
        }
      } else {
        isComplete = true;
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || error.error || "Update failed"));
        } catch (e) {
          reject(new Error(`Update failed with status ${xhr.status}`));
        }
      }
    });


    xhr.addEventListener("error", () => {
      reject(new Error("Network error during update"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Update was aborted"));
    });


    const token = sessionStorage.getItem("accessToken");


    xhr.open("PUT", updateUrl);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }
    xhr.send(formData);
  });
};

// Delete an event by ID
export const deletePublicEvent = withApiHandler(
  async (id) => {
    const { data } = await api.delete(`/eventreg/events/${id}`);
    return data;
  },
  { showSuccess: true }
);
