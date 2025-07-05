import React from 'react';
import { useDeFi } from '@/context/DeFiContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const CycleStatus: React.FC = () => {
  const { cycleInfo } = useDeFi();

  // Get current day (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const currentDay = new Date().getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;

  // Get day name
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[currentDay];

  // Calculate progress percentage (Monday = 0%, Sunday = 100%)
  // Adjust currentDay to make Monday=0 and Sunday=6
  const adjustedDay = currentDay === 0 ? 6 : currentDay - 1;
  const progress = (adjustedDay / 6) * 100;

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {cycleInfo.isEmergencyMode ? (
                <div className="flex items-center text-red-400">
                  <ShieldAlert className="mr-2" size={24} />
                  Emergency Mode
                </div>
              ) : (
                <div className="flex items-center text-white">
                  <Shield className="mr-2" size={24} />
                  System Status
                </div>
              )}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {cycleInfo.isEmergencyMode
                ? `Emergency: Day ${cycleInfo.emergencyDay} of 2`
                : dayName}
            </CardDescription>
          </div>
          <Badge
            variant={cycleInfo.isEmergencyMode ? "destructive" :
                    isWeekend ? "outline" : "default"}
            className={cycleInfo.isEmergencyMode ? "bg-red-600 hover:bg-red-700" :
                       isWeekend ? "border-slate-600 text-slate-300" : "bg-slate-700 text-white"}
          >
            {cycleInfo.isEmergencyMode ? "EMERGENCY" :
             isWeekend ? "EASY WITHDRAWAL" : "NORMAL"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!cycleInfo.isEmergencyMode && (
            <div>
              <div className="flex justify-between mb-1 text-xs text-slate-400">
                <span>Monday</span>
                <span>Friday</span>
                <span>Sunday</span>
              </div>
              <Progress
                value={progress}
                max={100}
                className="h-2"
              />
              <div className="flex justify-between mt-1">
                <span></span>
                <span className="text-xs border-l border-slate-600 h-2">&nbsp;</span>
                <span></span>
              </div>
            </div>
          )}

          <div className="bg-slate-700/50 p-3 rounded-md backdrop-blur-sm">
            <h4 className="font-medium text-sm mb-1 text-white">How to Take Money Out</h4>
            {cycleInfo.isEmergencyMode ? (
              cycleInfo.emergencyDay === 1 ? (
                <p className="text-xs text-red-400">
                  Only people with protected money can withdraw
                </p>
              ) : (
                <p className="text-xs text-amber-400">
                  Everyone can withdraw their money now
                </p>
              )
            ) : (
              isWeekend ? (
                <p className="text-xs text-green-400">
                  Weekend: You can withdraw any mix of protected and regular money
                </p>
              ) : (
                <p className="text-xs text-slate-300">
                  Weekday: You need equal amounts of protected and regular money to withdraw
                </p>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CycleStatus;
