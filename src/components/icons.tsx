
import type { LucideProps } from 'lucide-react';
import { PawPrint, Cat, Dog, Shield, Feather, Footprints, Landmark, Flame, Crown } from 'lucide-react';
import type { Title as TitleType } from '@/lib/types';


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

export const TitleIcon = ({ title, ...props }: { title: TitleType['name'] } & LucideProps) => {
    switch (title) {
        case '新手探險家':
            return <Feather {...props} />;
        case '城市漫遊者':
            return <Footprints {...props} />;
        case '區域專家':
            return <Landmark {...props} />;
        case '博學大師':
            return <Flame {...props} />;
        case '傳奇製圖師':
            return <Crown {...props} />;
        default:
            return <Feather {...props} />;
    }
}
