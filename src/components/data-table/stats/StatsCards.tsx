import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface StatCard {
    title: string;
    value: number | string;
    icon?: LucideIcon;
    description?: string | ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

interface StatsCardsProps {
    stats: StatCard[];
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6 px-4 sm:px-0">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index} className="shadow-sm border-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-0 sm:p-6 sm:pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">
                                {stat.title}
                            </CardTitle>
                            {Icon && (
                                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                        </CardHeader>
                        <CardContent className="p-3 pt-1 sm:p-6 sm:pt-0">
                            <div className="text-xl sm:text-2xl font-bold">{stat.value}</div>
                            {stat.description && (
                                <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                    {stat.description}
                                </div>
                            )}
                            {stat.trend && (
                                <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-bold ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.trend.isPositive ? '↑' : '↓'} {Math.abs(stat.trend.value)}%
                                </p>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
