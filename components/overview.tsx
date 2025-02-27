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

type DataView = "hourly" | "daily" | "monthly" | "yearly";

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
  const [dataView, setDataView] = useState<DataView>("daily");
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
      case "hourly":
        setCurrentDate(addDays(currentDate, 1));
        break;
      case "daily":
        setCurrentDate(addMonths(currentDate, 1));
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
      case "hourly":
        setCurrentDate(subDays(currentDate, 1));
        break;
      case "daily":
        setCurrentDate(subMonths(currentDate, 1));
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
      case "hourly":
        return format(currentDate, "MMM d, yyyy");
      case "daily":
        return format(currentDate, "MMMM yyyy");
      case "monthly":
        return format(currentDate, "MMMM yyyy");
      case "yearly":
        return format(currentDate, "yyyy");
      default:
        return "";
    }
  };

  // Helper function to highlight the current time period
  const highlightCurrentPeriod = (data: any[]) => {
    if (!data.length) return data;
    
    // Find the index that corresponds to the current time period
    let currentIndex = -1;
    
    switch (dataView) {
      case "hourly": {
        const currentHour = new Date().getHours();
        currentIndex = data.findIndex(d => d.hour === currentHour);
        break;
      }
      case "daily": {
        const currentDay = currentDate.getDate();
        currentIndex = data.findIndex(d => d.day === currentDay);
        break;
      }
      case "monthly": {
        const currentMonth = currentDate.getMonth();
        currentIndex = data.findIndex(d => d.month === currentMonth);
        break;
      }
      case "yearly": {
        const currentYear = currentDate.getFullYear();
        currentIndex = data.findIndex(d => d.year === currentYear);
        break;
      }
    }
    
    // If we found the current period, highlight it
    if (currentIndex >= 0) {
      return data.map((item, index) => ({
        ...item,
        isCurrent: index === currentIndex
      }));
    }
    
    return data;
  };

  const processData = () => {
    if (!data || !data.length) return [];

    switch (dataView) {
      case "hourly": {
        const currentMonthData = data.find(month => 
          new Date(month.createdAt).getMonth() === currentDate.getMonth() &&
          new Date(month.createdAt).getFullYear() === currentDate.getFullYear()
        );

        if (!currentMonthData) return [];

        const currentDayData = currentMonthData.dailyData.find(day =>
          new Date(day.date).getDate() === currentDate.getDate()
        );

        if (!currentDayData) return [];

        // Sort hourly data by hour to ensure correct growth calculation
        const sortedHourlyData = [...currentDayData.hourlyData]
          .sort((a, b) => a.hour - b.hour);

        const hourlyData = sortedHourlyData.map(hour => ({
          name: `${String(hour.hour).padStart(2, '0')}:00`,
          total: hour.total,
          orderCount: hour.orderCount,
          hour: hour.hour // Keep hour for sorting
        }));
        
        return highlightCurrentPeriod(hourlyData);
      }

      case "daily": {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Create a template for all days in the month
        const daysTemplate = Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          return {
            name: format(new Date(currentYear, currentMonth, day), "d MMM"),
            day,
            total: 0,
            orderCount: 0,
            averageOrderValue: 0
          };
        });
        
        // Find the current month data
        const currentMonthData = data.find(month => 
          new Date(month.createdAt).getMonth() === currentMonth &&
          new Date(month.createdAt).getFullYear() === currentYear
        );
        
        if (currentMonthData && currentMonthData.dailyData) {
          // Sort daily data by date to ensure correct growth calculation
          const sortedDailyData = [...currentMonthData.dailyData]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Fill in actual data where available
          sortedDailyData.forEach(dayData => {
            const dayDate = new Date(dayData.date);
            const dayOfMonth = dayDate.getDate() - 1; // 0-based index
            
            if (dayOfMonth >= 0 && dayOfMonth < daysTemplate.length) {
              // Calculate total for the day
              const dayTotal = dayData.hourlyData.reduce((sum, hour) => sum + hour.total, 0);
              const dayOrderCount = dayData.hourlyData.reduce((sum, hour) => sum + hour.orderCount, 0);
              
              daysTemplate[dayOfMonth].total = dayTotal;
              daysTemplate[dayOfMonth].orderCount = dayOrderCount;
              daysTemplate[dayOfMonth].averageOrderValue = dayOrderCount > 0 
                ? dayTotal / dayOrderCount 
                : 0;
            }
          });
        }
        
        return highlightCurrentPeriod(daysTemplate);
      }

      case "monthly": {
        const currentYear = currentDate.getFullYear();
        
        // Create a template for all 12 months
        const monthsTemplate = Array.from({ length: 12 }, (_, i) => ({
          name: format(new Date(currentYear, i, 1), "MMM"),
          month: i,
          total: 0,
          orderCount: 0,
          averageOrderValue: 0
        }));
        
        // Filter and sort data for the current year
        const currentYearData = data
          .filter(item => new Date(item.createdAt).getFullYear() === currentYear)
          .sort((a, b) => new Date(a.createdAt).getMonth() - new Date(b.createdAt).getMonth());
        
        // Fill in actual data where available
        currentYearData.forEach(item => {
          const itemMonth = new Date(item.createdAt).getMonth();
          
          if (itemMonth >= 0 && itemMonth < 12) {
            monthsTemplate[itemMonth].total = item.total;
            monthsTemplate[itemMonth].orderCount = item.orderCount;
            monthsTemplate[itemMonth].averageOrderValue = item.averageOrderValue || 
              (item.orderCount > 0 ? item.total / item.orderCount : 0);
          }
        });
        
        return highlightCurrentPeriod(monthsTemplate);
      }

      case "yearly": {
        // Find min and max years in the data
        let minYear = Infinity;
        let maxYear = -Infinity;
        
        data.forEach(item => {
          const year = new Date(item.createdAt).getFullYear();
          minYear = Math.min(minYear, year);
          maxYear = Math.max(maxYear, year);
        });
        
        // If no data, use current year as reference
        if (minYear === Infinity) {
          minYear = currentDate.getFullYear() - 2;
          maxYear = currentDate.getFullYear() + 2;
        } else {
          // Add past and future years
          minYear = Math.min(minYear, currentDate.getFullYear() - 2);
          maxYear = Math.max(maxYear, currentDate.getFullYear() + 2);
        }
        
        // Create a template for all years in range
        const yearsTemplate = Array.from(
          { length: maxYear - minYear + 1 }, 
          (_, i) => ({
            name: (minYear + i).toString(),
            year: minYear + i,
            total: 0,
            orderCount: 0,
            averageOrderValue: 0
          })
        );
        
        // Group data by year and calculate totals
        const yearlyData = data.reduce((acc, month) => {
          const year = new Date(month.createdAt).getFullYear();
          
          if (!acc[year]) {
            acc[year] = {
              total: 0,
              orderCount: 0,
              totalValue: 0
            };
          }
          
          acc[year].total += month.total;
          acc[year].orderCount += month.orderCount;
          acc[year].totalValue += month.total;
          
          return acc;
        }, {} as Record<number, any>);
        
        // Fill in actual data where available
        yearsTemplate.forEach(yearTemplate => {
          const yearData = yearlyData[yearTemplate.year];
          if (yearData) {
            yearTemplate.total = yearData.total;
            yearTemplate.orderCount = yearData.orderCount;
            yearTemplate.averageOrderValue = yearData.orderCount 
              ? yearData.totalValue / yearData.orderCount 
              : 0;
          }
        });
        
        // Sort by year to ensure correct growth calculation
        const sortedData = yearsTemplate.sort((a, b) => a.year - b.year);
        return highlightCurrentPeriod(sortedData);
      }
    }
  };

  const chartData = useMemo(() => {
    return processData();
  }, [dataView, data, currentDate]);

  const stats = useMemo((): Stats | null => {
    if (!chartData.length) return null;
    
    // Get all totals for basic stats
    const allTotals = chartData.map(d => d.total);
    const nonZeroTotals = allTotals.filter(t => t > 0);
    
    if (!nonZeroTotals.length) return { max: 0, min: 0, avg: 0, growth: 0 };
    
    const max = Math.max(...nonZeroTotals);
    const min = Math.min(...nonZeroTotals);
    
    // Calculate weighted average based on order count
    const totalRevenue = chartData.reduce((sum, d) => sum + d.total, 0);
    const totalOrders = chartData.reduce((sum, d) => sum + (d.orderCount || 0), 0);
    const avg = totalOrders > 0 ? totalRevenue / totalOrders : 
      nonZeroTotals.reduce((a, b) => a + b, 0) / nonZeroTotals.length;
    
    // Calculate growth based on the view type
    let growth = 0;
    
    // Calculate growth differently based on the view type
    switch (dataView) {
      case "hourly": {
        // For hourly view, compare with previous hour
        const nonZeroData = chartData.filter(d => d.total > 0);
        
        if (nonZeroData.length >= 2) {
          const firstValue = nonZeroData[0].total;
          const lastValue = nonZeroData[nonZeroData.length - 1].total;
          
          growth = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        }
        break;
      }
      
      case "daily": {
        // For daily view, compare with previous day
        const nonZeroData = chartData.filter(d => d.total > 0);
        
        if (nonZeroData.length >= 2) {
          const firstValue = nonZeroData[0].total;
          const lastValue = nonZeroData[nonZeroData.length - 1].total;
          
          growth = firstValue ? ((lastValue - firstValue) / firstValue) * 100 : 0;
        }
        break;
      }
      
      case "monthly": {
        // For monthly view, compare current month with previous month
        const currentMonthIndex = currentDate.getMonth();
        const previousMonthIndex = currentMonthIndex > 0 ? currentMonthIndex - 1 : 11;
        
        const currentMonthData = chartData.find(d => d.month === currentMonthIndex);
        const previousMonthData = chartData.find(d => d.month === previousMonthIndex);
        
        if (currentMonthData && previousMonthData && previousMonthData.total > 0) {
          growth = ((currentMonthData.total - previousMonthData.total) / previousMonthData.total) * 100;
        } else if (currentMonthData && currentMonthData.total > 0) {
          // If no previous month data, show 100% growth
          growth = 100;
        }
        break;
      }
      
      case "yearly": {
        // For yearly view, compare current year with previous year
        const currentYear = currentDate.getFullYear();
        const previousYear = currentYear - 1;
        
        const currentYearData = chartData.find(d => d.year === currentYear);
        const previousYearData = chartData.find(d => d.year === previousYear);
        
        if (currentYearData && previousYearData && previousYearData.total > 0) {
          growth = ((currentYearData.total - previousYearData.total) / previousYearData.total) * 100;
        } else if (currentYearData && currentYearData.total > 0) {
          // If no previous year data, show 100% growth
          growth = 100;
        }
        break;
      }
    }

    return { max, min, avg, growth };
  }, [chartData, dataView, currentDate]);

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
            <TabsList className="grid w-full max-w-md grid-cols-4 bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-1">
              <TabsTrigger 
                value="hourly"
                className={cn(
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600",
                  "data-[state=active]:text-white rounded-lg",
                  "text-gray-400 data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500",
                  "transition-all duration-300"
                )}
              >
                Hourly
              </TabsTrigger>
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
                className="rounded-xl border border-gray-800/50 bg-[#0a101f]/95 backdrop-blur-sm shadow-xl"
                classNames={{
                  day_selected: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:bg-gradient-to-r hover:from-violet-500 hover:to-indigo-500 rounded-full",
                  day_today: "bg-gray-800/50 text-white rounded-full border border-violet-500",
                  day: "hover:bg-gray-800/50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-opacity-50 h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                  head_cell: "text-gray-400 font-medium rounded-full",
                  caption: "flex justify-center py-2 mb-4 relative items-center",
                  caption_label: "text-sm font-medium text-gray-200 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent",
                  nav_button: "bg-[#0a101f]/80 border border-gray-800/50 rounded-full p-1 hover:bg-gray-800/50 transition-all hover:scale-110",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  cell: "text-center p-0 relative [&:has([aria-selected])]:bg-gray-800/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  row: "flex w-full mt-2",
                  months: "space-y-4",
                  month: "space-y-4",
                  selected: "rounded-full bg-gradient-to-r from-violet-600 to-indigo-600",
                  disabled: "text-gray-500 opacity-50",
                }}
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
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  
                  // Highlight current period with a larger dot
                  if (payload.isCurrent) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#8B5CF6"
                        stroke="#030711"
                        strokeWidth={2}
                        className="glow-effect"
                      />
                    );
                  }
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#8B5CF6"
                      stroke="#030711"
                      strokeWidth={2}
                      className="glow-effect"
                    />
                  );
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
