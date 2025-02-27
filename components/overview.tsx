"use client";

import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Area } from "recharts";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import { format, subDays, addDays, subMonths, addMonths, subYears, addYears } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type DataView = "daily" | "monthly" | "yearly";

interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  averageOrderValue: number;
  dailyData: {
    date: Date;
    total: number;
    orderCount: number;
    hourlyData: {
      hour: number;
      total: number;
      orderCount: number;
    }[];
  }[];
  createdAt: Date;
}

interface Stats {
  max: number;
  min: number;
  avg: number;
  growth: number;
}

interface OverviewProps {
  data: GraphData[];
}

export const Overview: React.FC<OverviewProps> = ({
  data = []
}) => {
  const [dataView, setDataView] = useState<DataView>("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const controls = useAnimation();
  const chartRef = useRef<any>(null);

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
  }, [controls]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        navigateBackward();
      } else if (e.key === "ArrowRight") {
        navigateForward();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentDate, dataView]);

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragDelta(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const delta = e.clientX - startX;
    setDragDelta(delta);

    if (Math.abs(delta) > 100) {
      if (delta > 0) {
        navigateBackward();
        setIsDragging(false);
        setDragDelta(0);
      } else {
        navigateForward();
        setIsDragging(false);
        setDragDelta(0);
      }
    }
  };

  const onMouseUp = () => {
    setIsDragging(false);
    setDragDelta(0);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setDragDelta(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const delta = e.touches[0].clientX - startX;
    setDragDelta(delta);

    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        navigateBackward();
        setIsDragging(false);
        setDragDelta(0);
      } else {
        navigateForward();
        setIsDragging(false);
        setDragDelta(0);
      }
    }
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    setDragDelta(0);
  };

  const navigateForward = () => {
    switch (dataView) {
      case "daily":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "monthly":
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case "yearly":
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };

  const navigateBackward = () => {
    switch (dataView) {
      case "daily":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "monthly":
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case "yearly":
        setCurrentDate(subYears(currentDate, 1));
        break;
    }
  };

  const getCurrentLabel = () => {
    switch (dataView) {
      case "daily":
        return format(currentDate, "MMM d, yyyy");
      case "monthly":
        return format(currentDate, "MMMM yyyy");
      case "yearly":
        return format(currentDate, "yyyy");
      default:
        return "";
    }
  };

  const processData = () => {
    if (!data || !data.length) return [];

    switch (dataView) {
      case "daily": {
        const currentMonthData = data.find(month => 
          new Date(month.createdAt).getMonth() === currentDate.getMonth() &&
          new Date(month.createdAt).getFullYear() === currentDate.getFullYear()
        );

        if (!currentMonthData) return [];

        const currentDayData = currentMonthData.dailyData.find(day =>
          new Date(day.date).getDate() === currentDate.getDate()
        );

        if (!currentDayData) return [];

        return currentDayData.hourlyData.map(hour => ({
          name: `${String(hour.hour).padStart(2, '0')}:00`,
          total: hour.total,
          orderCount: hour.orderCount
        }));
      }

      case "monthly": {
        const currentYearData = data.filter(month =>
          new Date(month.createdAt).getFullYear() === currentDate.getFullYear()
        );

        return currentYearData.map(month => ({
          name: month.name,
          total: month.total,
          orderCount: month.orderCount,
          averageOrderValue: month.averageOrderValue
        }));
      }

      case "yearly":
      default: {
        return data.map(month => ({
          name: month.name,
          total: month.total,
          orderCount: month.orderCount,
          averageOrderValue: month.averageOrderValue
        }));
      }
    }
  };

  const chartData = useMemo(() => {
    return processData();
  }, [dataView, data, currentDate]);

  const stats = useMemo((): Stats | null => {
    if (!chartData.length) return null;
    
    const totals = chartData.map(d => d.total).filter(t => t > 0);
    if (!totals.length) return { max: 0, min: 0, avg: 0, growth: 0 };
    
    const max = Math.max(...totals);
    const min = Math.min(...totals);
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    
    const firstValue = totals[0] || 0;
    const lastValue = totals[totals.length - 1] || 0;
    const growth = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return { max, min, avg, growth };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentData = payload[0].payload;
      
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0a101f]/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-800/50"
        >
          <div className="font-bold text-lg mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{label}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Revenue:</span>
              <span className="font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                €{(currentData.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-400">Orders:</span>
              <span className="font-bold text-blue-400">
                {currentData.orderCount || 0}
              </span>
            </div>
            {currentData.averageOrderValue && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Avg. Order:</span>
                <span className="font-bold text-purple-400">
                  €{currentData.averageOrderValue.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      );
    }
    return null;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setCurrentDate(date);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
    >
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex justify-center flex-grow">
          <Tabs value={dataView} onValueChange={(value) => setDataView(value as DataView)}>
            <TabsList className="grid w-full max-w-md grid-cols-3 bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-1">
              <TabsTrigger 
                value="daily"
                className={cn(
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600",
                  "data-[state=active]:text-white rounded-lg",
                  "text-gray-400 data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500",
                  "transition-all duration-300"
                )}
              >
                Daily
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className={cn(
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600",
                  "data-[state=active]:text-white rounded-lg",
                  "text-gray-400 data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500",
                  "transition-all duration-300"
                )}
              >
                Monthly
              </TabsTrigger>
              <TabsTrigger 
                value="yearly"
                className={cn(
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600",
                  "data-[state=active]:text-white rounded-lg",
                  "text-gray-400 data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500",
                  "transition-all duration-300"
                )}
              >
                Yearly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            {getCurrentLabel()}
          </h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-10 h-10 p-0 bg-[#0a101f]/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800/50",
                  "hover:scale-110 transition-transform"
                )}
              >
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                className="rounded-md border bg-[#0a101f]/95 backdrop-blur-sm"
              />
            </PopoverContent>
          </Popover>
        </div>

        {stats && (
          <div className="flex gap-4 flex-wrap">
            <motion.div 
              className="bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-800/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-gray-400">Growth</div>
              <div className={cn(
                "text-lg font-bold",
                stats.growth > 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {stats.growth ? `${stats.growth.toFixed(1)}%` : '0%'}
              </div>
            </motion.div>
            <motion.div 
              className="bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-800/50"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-gray-400">Average</div>
              <div className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                €{stats.avg.toFixed(2)}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <div className="relative chart-container">
        <div 
          className="h-[400px] w-full bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-800/50 cursor-grab active:cursor-grabbing overflow-hidden"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{
            transform: `translateX(${dragDelta}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          ref={chartRef}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ left: 10 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-800/50"
                vertical={false}
                horizontal={true}
              />
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                className="text-gray-400"
                dy={10}
                interval="preserveStartEnd"
                minTickGap={5}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `€${value}`}
                className="text-gray-400"
                dx={-10}
              />
              <Tooltip
                cursor={false}
                content={CustomTooltip}
                position={{ y: 0 }}
              />
              <Area
                type="monotone"
                dataKey="total"
                fill="url(#areaGradient)"
                stroke="#8B5CF6"
                strokeWidth={2}
                filter="url(#glow)"
                dot={{
                  fill: "#8B5CF6",
                  stroke: "#030711",
                  strokeWidth: 2,
                  r: 4,
                  className: "glow-effect"
                }}
                activeDot={{
                  r: 6,
                  fill: "#8B5CF6",
                  stroke: "#030711",
                  strokeWidth: 2,
                  className: "glow-effect"
                }}
                isAnimationActive={!isDragging}
                animationBegin={0}
                animationDuration={2000}
                animationEasing="ease-in-out"
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute inset-y-0 left-0 flex items-center">
          <button
            onClick={navigateBackward}
            className="p-2 bg-[#0a101f]/50 backdrop-blur-sm rounded-full shadow-lg border border-gray-800/50 transform -translate-x-1/2 hover:scale-110 transition-transform"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={navigateForward}
            className="p-2 bg-[#0a101f]/50 backdrop-blur-sm rounded-full shadow-lg border border-gray-800/50 transform translate-x-1/2 hover:scale-110 transition-transform"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
