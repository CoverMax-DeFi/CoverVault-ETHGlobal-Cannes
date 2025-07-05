
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface StatCardProps {
  title: React.ReactNode;
  value: string | number;
  description?: string;
  label?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  label,
  icon,
  trend,
  className = '',
}) => {
  return (
    <Card className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div>
            <div className="flex items-center">
              <div className="text-sm font-medium text-gray-500">{title}</div>
              {label && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="ml-1 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{label}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {description && (
              <div className="mt-1">
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            )}
          </div>
          {icon && (
            <div className="h-12 w-12 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
