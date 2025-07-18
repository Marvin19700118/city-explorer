export type Pet = {
  name: string;
  level: number;
  xp: number;
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

export type GuideData = {
  guideText: string;
  audioDataUri: string;
};

export type Settings = {
  fogOpacity: number;
  areaNotifications: boolean;
};
