
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type Locale = 'en' | 'zh';

export const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  answers: z.array(z.string()).describe('An array of 4 possible answers to the question.'),
  correctAnswerIndex: z
    .number()
    .describe('The index of the correct answer in the answers array.'),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;


export type QuizData = {
  questions: QuizQuestion[];
};

export type PoiType = 'general' | 'trailhead' | 'summit' | 'waterfall' | 'viewpoint' | 'temple';

export type TrailDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';

export type TrailPoint = {
  lat: number;
  lng: number;
  elevation?: number;
};

export type TrailWaypoint = {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  poiType: PoiType;
  elevation?: number;
};

export type Trail = {
  id: string;
  name: string;
  difficulty: TrailDifficulty;
  points: TrailPoint[];
  waypoints: TrailWaypoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  walkedPoints: number[];
  walkedDistanceKm: number;
  completionPercent: number;
  manuallyCompleted?: boolean;
  importedAt: string;
  // Metadata from Excel database
  district?: string;
  description?: string;
  entranceAddress?: string;
  googleMapsUrl?: string;
  centerLat?: number;
  centerLng?: number;
};

export type PointOfInterest = {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  areaDescription: string;
  discovered: boolean;
  county: string;
  district: string;
  previousQuestions?: string[];
  poiType?: PoiType;
  quizzable?: boolean;
  visitCount?: number;
  lastVisitedAt?: string;
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type ActivityType = '步行' | '登山' | '腳踏車';

export type Trip = {
  id: string;
  name?: string;
  notes?: string;
  date: string;
  distance: number;
  path: LatLng[];
  startTime: string | null;
  endTime: string | null;
  elevationGainM?: number;
  trailId?: string;
  activityType?: ActivityType;
};

export type Settings = {
  fogOpacity: number;
  areaNotifications: boolean;
};

export type CityPoints = {
  [cityName: string]: number;
};

export type Title = {
    levelThreshold: number;
    name: string;
    icon: React.ElementType;
}

export type CurrentArea = {
    city: string;
    district: string;
    village?: string;
    fullAddress: string;
    county: string;
};

// Data structure for cloud sync
export type GameSaveData = {
    pois: PointOfInterest[];
    trips: Trip[];
    cityPoints: CityPoints;
    settings: Settings;
    lastUpdated: string;
}

export type AskedQuestionHistory = {
  [district: string]: string[];
}

// AI Related types

// For generate-location-intro.ts
export const GenerateLocationIntroInputSchema = z.object({
  locationName: z.string().describe('A description of the area, like "信義區" or "台灣台北市中正區".'),
});
export type GenerateLocationIntroInput = z.infer<typeof GenerateLocationIntroInputSchema>;

export const GenerateLocationIntroOutputSchema = z.object({
  introduction: z.string().describe('A fun, engaging introduction to the area, around 100-150 words.'),
  audioDataUri: z.string().nullable().describe('A data URI of the introduction audio in WAV format.'),
});
export type GenerateLocationIntroOutput = z.infer<typeof GenerateLocationIntroOutputSchema>;

// For generate-area-quiz.ts
export const GenerateAreaQuizInputSchema = z.object({
  areaDescription: z.string().describe('A detailed description of the area for which the quiz is to be generated.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  previousQuestions: z.array(z.string()).optional().describe('A list of previously asked questions to avoid repetition.'),
});
export type GenerateAreaQuizInput = z.infer<typeof GenerateAreaQuizInputSchema>;

export const GenerateAreaQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of quiz questions, their answers, and correct answer indices.'),
});
export type GenerateAreaQuizOutput = z.infer<typeof GenerateAreaQuizOutputSchema>;

// For generate-chatbot-response.ts
export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ChatbotInputSchema = z.object({
  locationName: z.string().describe('The name of the location, e.g., a district or city.'),
  query: z.string().describe("The user's latest query."),
  history: z.array(MessageSchema).describe('The conversation history.'),
  photoDataUri: z.string().optional().describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

export const ChatbotResponseSchema = z.object({
  response: z.string(),
});
export type ChatbotResponse = z.infer<typeof ChatbotResponseSchema>;


// For generate-restaurant-description.ts
export const GenerateRestaurantDescriptionInputSchema = z.object({
    restaurantName: z.string().describe("The name of the restaurant."),
    restaurantAddress: z.string().describe("The address of the restaurant."),
});
export type GenerateRestaurantDescriptionInput = z.infer<typeof GenerateRestaurantDescriptionInputSchema>;

export const GenerateRestaurantDescriptionOutputSchema = z.object({
    description: z.string().describe("A short, engaging description of the restaurant (50-70 words).")
});
export type GenerateRestaurantDescriptionOutput = z.infer<typeof GenerateRestaurantDescriptionOutputSchema>;


// For generate-attraction-info.ts
export const GenerateAttractionInfoInputSchema = z.object({
    attractionName: z.string().describe("The name of the tourist attraction."),
    attractionAddress: z.string().describe("The address of the tourist attraction."),
});
export type GenerateAttractionInfoInput = z.infer<typeof GenerateAttractionInfoInputSchema>;

export const GenerateAttractionInfoOutputSchema = z.object({
    introduction: z.string().describe("A short, engaging introduction of the attraction (100-150 words)."),
    quiz: z.array(QuizQuestionSchema).describe('An array of 3 quiz questions about the attraction.'),
    audioDataUri: z.string().nullable().describe('A data URI of the introduction audio in WAV format.'),
});
export type GenerateAttractionInfoOutput = z.infer<typeof GenerateAttractionInfoOutputSchema>;
