import type { ErrorActionId, ErrorKind } from "./types";

type KindCopy = {
  eyebrow: string;
  title: string;
  description: string;
  tips: string[];
  codeLabel?: string;
};

export const ERROR_BUTTON_LABELS: Record<ErrorActionId, string> = {
  goBack: "Go Back",
  goHome: "Go to Home",
  goDashboard: "Go to Dashboard",
  retry: "Retry Again",
  loginNow: "Login Now",
  contactSupport: "Contact Support",
  contactAdmin: "Contact Admin",
  goStatus: "Go to Status Page",
  retryLater: "Retry Later",
};

export const ERROR_TIPS_HEADING = "What you can do?";

export const ERROR_COPY: Record<ErrorKind | "forbidden", KindCopy> = {
  bad_request: {
    eyebrow: "400 Bad Request",
    title: "Bad Request",
    description:
      "The server could not understand the request due to invalid syntax or parameters.",
    tips: [
      "Check the data you entered.",
      "Ensure all required fields are filled.",
      "Try again with valid information.",
    ],
  },
  unauthorized: {
    eyebrow: "401 Unauthorized",
    title: "Unauthorized",
    description: "Your session has expired or you are not logged in.",
    tips: [
      "Please log in to access this page.",
      "If the problem persists, try clearing your browser cookies.",
    ],
  },
  forbidden: {
    eyebrow: "403 Forbidden",
    title: "Forbidden",
    description: "You don't have permission to access this resource.",
    tips: [
      "Contact your administrator for access.",
      "Return to the previous page.",
    ],
  },
  page_not_found: {
    eyebrow: "404 Page Not Found",
    title: "Page Not Found",
    description:
      "The page you are looking for doesn't exist or has been moved.",
    tips: [
      "Check the URL for spelling mistakes.",
      "Go back to the previous page.",
      "Visit our homepage or use the menu.",
    ],
  },
  api_not_found: {
    eyebrow: "404 API Not Found",
    title: "API Not Found",
    description:
      "The requested API endpoint or resource could not be found on the server.",
    tips: [
      "Verify the API endpoint URL.",
      "Ensure the resource exists.",
      "Contact support if the issue continues.",
    ],
  },
  timeout: {
    eyebrow: "408 Request Timeout",
    title: "Request Timeout",
    description: "The server took too long to respond to your request.",
    tips: [
      "Check your internet connection.",
      "Try again in a few moments.",
      "If the issue persists, contact support.",
    ],
  },
  internal: {
    eyebrow: "500 Internal Server Error",
    title: "Something Went Wrong",
    description:
      "The server encountered an unexpected error while processing your request.",
    tips: [
      "Try again in a few moments.",
      "Return to the previous page.",
      "If the issue persists, contact support.",
    ],
  },
  bad_gateway: {
    eyebrow: "502 Bad Gateway",
    title: "Bad Gateway",
    description:
      "The server, while acting as a gateway or proxy, received an invalid response.",
    tips: [
      "Try again in a few minutes.",
      "Check your network connection.",
      "If the issue persists, contact support.",
    ],
  },
  service_unavailable: {
    eyebrow: "503 Service Unavailable",
    title: "Service Unavailable",
    description:
      "The server is currently unable to handle the request due to maintenance or being overloaded.",
    tips: [
      "Try again after some time.",
      "Check our status page for updates.",
      "If the issue persists, contact support.",
    ],
  },
  gateway_timeout: {
    eyebrow: "504 Gateway Timeout",
    title: "Gateway Timeout",
    description: "The upstream server took too long to respond to the request.",
    tips: [
      "Try again in a few minutes.",
      "Check your network connection.",
      "If the issue persists, contact support.",
    ],
  },
  network: {
    eyebrow: "Network Error",
    codeLabel: "Offline",
    title: "Network Error",
    description:
      "Unable to connect to the server. Please check your internet connection and try again.",
    tips: [
      "Check your internet connection.",
      "Try again.",
      "If you are connected, contact support.",
    ],
  },
  unexpected: {
    eyebrow: "Unexpected Error",
    title: "Something Went Wrong",
    description: "An unexpected error occurred while loading this page.",
    tips: [
      "Try again.",
      "Go back to the previous page.",
      "If the issue persists, contact support.",
    ],
  },
};
