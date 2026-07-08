import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const MAX_PROFILE_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_EXTRACTED_TEXT_CHARS = 60000;

export type ProfileImportSourceType = "cv_pdf" | "linkedin_pdf";

export type ExtractedExperience = {
  title: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  description?: string;
};

export type ExtractedEducation = {
  school: string;
  degree?: string;
  field?: string;
  start_year?: string;
  end_year?: string;
  description?: string;
};

export type ExtractedCertification = {
  name: string;
  issuer?: string;
  issued_at?: string;
  credential_url?: string;
};

export type ExtractedProfile = {
  name?: string;
  headline?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience: ExtractedExperience[];
  education: ExtractedEducation[];
  certifications: ExtractedCertification[];
  links: {
    linkedin_url?: string;
    website_url?: string;
  };
  warnings: string[];
};

export const emptyExtractedProfile = (): ExtractedProfile => ({
  name: "",
  headline: "",
  location: "",
  bio: "",
  skills: [],
  experience: [],
  education: [],
  certifications: [],
  links: {
    linkedin_url: "",
    website_url: "",
  },
  warnings: [],
});

export const normalizeExtractedProfile = (value: unknown): ExtractedProfile => {
  const raw = (value || {}) as Partial<ExtractedProfile>;
  return {
    name: raw.name || "",
    headline: raw.headline || "",
    location: raw.location || "",
    bio: raw.bio || "",
    skills: Array.isArray(raw.skills) ? raw.skills.filter(Boolean).map(String) : [],
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    certifications: Array.isArray(raw.certifications) ? raw.certifications : [],
    links: {
      linkedin_url: raw.links?.linkedin_url || "",
      website_url: raw.links?.website_url || "",
    },
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter(Boolean).map(String) : [],
  };
};

export const validateProfilePdf = (file: File) => {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    throw new Error("Please upload a PDF file.");
  }

  if (file.size > MAX_PROFILE_DOCUMENT_BYTES) {
    throw new Error("PDF must be less than 10MB.");
  }
};

export const extractTextFromPdf = async (file: File) => {
  validateProfilePdf(file);

  const buffer = await file.arrayBuffer();
  const document = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) pages.push(pageText);

    if (pages.join("\n\n").length >= MAX_EXTRACTED_TEXT_CHARS) {
      break;
    }
  }

  const text = pages.join("\n\n").slice(0, MAX_EXTRACTED_TEXT_CHARS).trim();
  if (text.length < 100) {
    throw new Error("This PDF does not contain enough readable text. Try a text-based CV or LinkedIn PDF instead of a scanned image.");
  }

  return text;
};

export const dedupeStrings = (values: string[]) => {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      if (!value) return false;
      const key = value.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
