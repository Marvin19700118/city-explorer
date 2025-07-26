
import type { LucideProps } from 'lucide-react';
import { Feather, Footprints, Landmark, Flame, Crown } from 'lucide-react';
import type { Title as TitleType } from '@/lib/types';

export const TitleIcon = ({ title, ...props }: { title: TitleType['name'] } & LucideProps) => {
    switch (title) {
        case '新手探險家':
            return <Feather {...props} />;
        case '城市漫遊者':
            return <Footprints {...props} />;
        case '區域專家':
            return <Landmark {...props} />;
        case '專業導遊':
            return <Flame {...props} />;
        case '金牌專業導覽員':
            return <Crown {...props} />;
        default:
            return <Feather {...props} />;
    }
}
