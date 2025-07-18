'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { createQuiz } from '@/app/actions';
import type { PointOfInterest, QuizData, QuizQuestion } from '@/lib/types';
import { CheckCircle, XCircle, BrainCircuit, RotateCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type QuizModalProps = {
  poi: PointOfInterest | null;
  isOpen: boolean;
  onClose: () => void;
};

export const QuizModal = ({ poi, isOpen, onClose }: QuizModalProps) => {
  const [quizData, setQuizData] = React.useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showResult, setShowResult] = React.useState(false);
  const [score, setScore] = React.useState(0);
  const { toast } = useToast();

  const fetchQuiz = React.useCallback(async () => {
    if (!poi) return;
    setIsLoading(true);
    setQuizData(null);
    try {
      const data = await createQuiz(poi.areaDescription);
      if (data) {
        setQuizData(data);
      } else {
        toast({ title: "Quiz Generation Failed", description: "Could not generate a quiz for this area.", variant: "destructive"});
        onClose();
      }
    } catch (e) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive"});
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [poi, onClose, toast]);

  React.useEffect(() => {
    if (isOpen && poi) {
      fetchQuiz();
    } else {
      setQuizData(null);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
    }
  }, [isOpen, poi, fetchQuiz]);

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    if (selectedAnswer === quizData?.questions[currentQuestionIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setCurrentQuestionIndex(i => i + 1);
  };
  
  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswerIndex;
  const isQuizFinished = quizData ? currentQuestionIndex === quizData.questions.length - 1 : false;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }

    if (!currentQuestion) {
      return (
        <div className="text-center">
            <p className="text-lg">Quiz Complete!</p>
            <p className="text-4xl font-bold font-headline my-4 text-primary">{score} / {quizData?.questions.length}</p>
            <p className="text-muted-foreground">You've earned {score * 10} bonus XP!</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1} of {quizData?.questions.length}</p>
        <p className="text-lg font-semibold">{currentQuestion.question}</p>
        <RadioGroup
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          disabled={showResult}
          className="space-y-2"
        >
          {currentQuestion.answers.map((answer, index) => {
             const isSelected = selectedAnswer === index;
             const isCorrectAnswer = currentQuestion.correctAnswerIndex === index;
            return (
              <Label
                key={index}
                htmlFor={`answer-${index}`}
                className={cn(
                  "flex items-center gap-4 rounded-md border p-4 transition-colors",
                  showResult && isCorrectAnswer && "border-green-500 bg-green-500/10",
                  showResult && isSelected && !isCorrectAnswer && "border-red-500 bg-red-500/10",
                  !showResult && "hover:bg-muted/50 cursor-pointer"
                )}
              >
                <RadioGroupItem value={index.toString()} id={`answer-${index}`} />
                <span>{answer}</span>
              </Label>
            )
          })}
        </RadioGroup>
        {showResult && (
          <Alert variant={isCorrect ? "default" : "destructive"} className={cn(isCorrect ? "border-green-500" : "")}>
            {isCorrect ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
            <AlertTitle>{isCorrect ? "Correct!" : "Incorrect!"}</AlertTitle>
            <AlertDescription>
              {isCorrect ? "Great job explorer!" : `The correct answer was: ${currentQuestion.answers[currentQuestion.correctAnswerIndex]}`}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };
  
  const renderFooter = () => {
    if (isLoading) return null;

    if (!currentQuestion) {
        return <Button onClick={onClose} className="w-full">Close</Button>
    }

    if (showResult) {
        return isQuizFinished ? (
            <Button onClick={handleNextQuestion} className="w-full bg-accent hover:bg-accent/90">Finish Quiz</Button>
        ) : (
            <Button onClick={handleNextQuestion} className="w-full">Next Question</Button>
        )
    }

    return <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null} className="w-full">Check Answer</Button>
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
            <BrainCircuit /> Area Quiz: {poi?.name}
          </DialogTitle>
          <DialogDescription>
            Test your knowledge about this newly discovered area!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderContent()}</div>
        <DialogFooter>
          {renderFooter()}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
