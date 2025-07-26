
import { z } from 'zod';
import type { LucideIcon } from 'lucide-react';

export type Pet = {
  name: string;
  level: number;
  xp: number; // XP for the current level
  totalXp: number; // Total accumulated XP across all levels
  xpToNextLevel: number;
  evolutionStage: number;
};

export type QuizQuestion = {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
};

export type QuizData = {
  questions: QuizQuestion[];
};

export type PointOfInterest = {
  id: string;
  name: string;
  position: { lat: number; lng: number };
  areaDescription: string;
  discovered: boolean;
  county: string; // e.g., '台北市'
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type Trip = {
  id: string;
  date: string;
  distance: number;
  path: LatLng[];
  startTime: string | null;
  endTime: string | null;
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

// Data structure for cloud sync
export type GameSaveData = {
    pet: Pet;
    pois: PointOfInterest[];
    trips: Trip[];
    cityPoints: CityPoints;
    settings: Settings;
    lastUpdated: string;
}

// AI Related types

// For generate-location-intro.ts
export const GenerateLocationIntroInputSchema = z.object({
  locationName: z.string().describe('A description of the area, like "信義區" or "台灣台北市中正區".'),
});
export type GenerateLocationIntroInput = z.infer<typeof GenerateLocationIntroInputSchema>;

export const GenerateLocationIntroOutputSchema = z.object({
  introduction: z.string().describe('A fun, engaging introduction to the area, around 100-150 words.'),
  audioDataUri: z.string().describe('A data URI of the introduction audio in WAV format.'),
});
export type GenerateLocationIntroOutput = z.infer<typeof GenerateLocationIntroOutputSchema>;

// For generate-area-quiz.ts
export const GenerateAreaQuizInputSchema = z.object({
  areaDescription: z.string().describe('A detailed description of the area for which the quiz is to be generated.'),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type GenerateAreaQuizInput = z.infer<typeof GenerateAreaQuizInputSchema>;

export const GenerateAreaQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      answers: z.array(z.string()).describe('An array of 4 possible answers to the question.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the answers array.'),
    })
  ).describe('An array of quiz questions, their answers, and correct answer indices.'),
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
