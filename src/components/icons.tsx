import type { LucideProps } from 'lucide-react';
import { PawPrint, Cat, Dog, Shield } from 'lucide-react';

export const PetIcon = ({ evolutionStage, ...props }: { evolutionStage: number } & LucideProps) => {
  switch (evolutionStage) {
    case 1:
      return <PawPrint {...props} />;
    case 2:
      return <Cat {...props} />;
    case 3:
      return <Dog {...props} />;
    case 4:
      return <Shield {...props} />;
    default:
      return <PawPrint {...props} />;
  }
};
