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
};

export type LatLng = {
  lat: number;
  lng: number;
};
