// API configuration for the application
export const API_BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://apisci.hoangvu.id.vn"
        : "http://localhost:8088";

// List of endpoints
export const API_ENDPOINTS = {
    UPLOAD_PDF: "/upload-pdf",
    GENERATE_EXAM: (sessionId: string) => `/generate-exam/${sessionId}`,
    EXAM_DATA: (sessionId: string) => `/exam-data/${sessionId}`,
    SESSION_INFO: (sessionId: string) => `/session-info/${sessionId}`,
    DOWNLOAD_RESULT: (sessionId: string) => `/download-result/${sessionId}`,
};
