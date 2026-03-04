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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            {Icon && (
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            {stat.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    {stat.description}
                                </div>
                            )}
                            {stat.trend && (
                                <p className={`text-xs mt-1 ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
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
