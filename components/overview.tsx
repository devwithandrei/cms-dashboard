"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState, useMemo, useRef } from "react";
import { format, subDays, addDays, isSameDay, isToday } from "date-fns";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, DollarSign, BarChart3 } from "lucide-react";
import { RevenueChart } from "./revenue-chart";

interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  growth: number; // Growth percentage compared to previous period
  trend: 'up' | 'down' | 'stable'; // Trend indicator
  date: Date; // Date property for sorting and reference
  isSelected?: boolean; // Added for chart highlighting
  isCurrentMonth?: boolean; // Added for styling
  isToday?: boolean; // Added for today highlighting
  month?: string; // Month name for monthly view
  year?: number; // Year for monthly view
}

interface OverviewProps {
  data: GraphData[];
}

export const Overview: React.FC<OverviewProps> = ({
  data = []
}) => {
  // View mode state (daily or monthly)
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const activeTab = "revenue";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const controls = useAnimation();
  const chartRef = useRef<HTMLDivElement>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  useEffect(() => {
    controls.start({ opacity: 1, y: 0 });
    
    // Start the chart animation sequence
    const animationTimer = setTimeout(() => {
      setAnimationComplete(true);
    }, 1500);
    
    return () => clearTimeout(animationTimer);
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
  }, [currentDate]);

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
    if (viewMode === 'daily') {
      setCurrentDate(addDays(currentDate, 1));
    } else {
      // For monthly view, navigate to next month
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setCurrentDate(nextMonth);
    }
  };

  const navigateBackward = () => {
    if (viewMode === 'daily') {
      setCurrentDate(subDays(currentDate, 1));
    } else {
      // For monthly view, navigate to previous month
      const prevMonth = new Date(currentDate);
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setCurrentDate(prevMonth);
    }
  };

  const getCurrentLabel = () => {
    if (viewMode === 'daily') {
      return format(currentDate, "MMMM d, yyyy");
    } else {
      return format(currentDate, "MMMM yyyy");
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setCurrentDate(date);
    // The scrolling will be handled by the useEffect hook
  };

  // Calculate overall stats
  const stats = useMemo(() => {
    if (!data.length) return { totalRevenue: 0, totalOrders: 0, avgGrowth: 0 };
    
    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
    const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);
    
    // Calculate average growth (excluding zero values)
    const growthValues = data.filter(item => item.growth !== 0).map(item => item.growth);
    const avgGrowth = growthValues.length > 0 
      ? growthValues.reduce((sum, val) => sum + val, 0) / growthValues.length 
      : 0;
    
    return { totalRevenue, totalOrders, avgGrowth };
  }, [data]);

  // Process data for monthly view
  const monthlyData = useMemo(() => {
    if (!data.length) return [];
    
    // Filter data to only include items with date property
    const validData = [...data].filter(item => item.date instanceof Date);
    
    // Group data by month and year
    const monthlyGroups = new Map();
    
    validData.forEach(item => {
      const date = new Date(item.date);
      const monthYear = format(date, 'MMM yyyy');
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      if (!monthlyGroups.has(monthYear)) {
        monthlyGroups.set(monthYear, {
          name: monthYear,
          total: 0,
          orderCount: 0,
          date: new Date(year, monthIndex, 1), // First day of month
          month: format(date, 'MMMM'),
          year: year,
          isCurrentMonth: date.getMonth() === currentDate.getMonth() && 
                          date.getFullYear() === currentDate.getFullYear(),
          isSelected: date.getMonth() === currentDate.getMonth() && 
                      date.getFullYear() === currentDate.getFullYear()
        });
      }
      
      const monthData = monthlyGroups.get(monthYear);
      monthData.total += item.total;
      monthData.orderCount += item.orderCount;
    });
    
    // Convert to array and sort by date
    const result = Array.from(monthlyGroups.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // Calculate growth for each month
    result.forEach((item, index) => {
      if (index > 0) {
        const prevMonth = result[index - 1];
        if (prevMonth.total > 0) {
          item.growth = ((item.total - prevMonth.total) / prevMonth.total) * 100;
        } else if (item.total > 0) {
          item.growth = 100; // If previous month was 0 and current is positive
        } else {
          item.growth = 0;
        }
        
        // Determine trend
        if (item.growth > 5) {
          item.trend = "up";
        } else if (item.growth < -5) {
          item.trend = "down";
        } else {
          item.trend = "stable";
        }
      } else {
        item.growth = 0;
        item.trend = "stable";
      }
    });
    
    return result;
  }, [data, currentDate]);

  // Get data for the selected metric and highlight the selected date
  const dailyChartData = useMemo(() => {
    if (!data.length) return [];
      
    // Filter data to only include items with date property and sort by date
    const sortedData = [...data]
      .filter((item) => item.date instanceof Date)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  
    // Always show all available data points for the revenue line
    // Create a map for quick lookup of data by date
    const dataMap = new Map(
      sortedData.map((item) => [format(item.date, "yyyy-MM-dd"), item])
    );
  
    // Find the earliest and latest dates in the data
    const earliestDate = sortedData[0].date;
    const latestDate = sortedData[sortedData.length - 1].date;
    
    // Calculate the number of days between earliest and latest dates
    const dayCount = Math.round((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Generate an array of all dates in the range
    const displayData = [];
    for (let i = 0; i < dayCount; i++) {
      const currentDateInRange = addDays(
        new Date(earliestDate),
        i
      );
      
      const dateKey = format(currentDateInRange, "yyyy-MM-dd");
      let dataPoint = dataMap.get(dateKey);
  
      if (!dataPoint) {
        // If no data for this date, create a placeholder with zero values
        dataPoint = {
          name: format(currentDateInRange, "MMM dd"),
          total: 0,
          orderCount: 0,
          growth: 0,
          trend: "stable" as const,
          date: currentDateInRange,
          isSelected: isSameDay(currentDateInRange, currentDate),
          isCurrentMonth: currentDateInRange.getMonth() === currentDate.getMonth(),
          isToday: isToday(currentDateInRange),
        };
      } else {
        // Ensure the name is in the correct format (MMM dd)
        dataPoint = {
          ...dataPoint,
          name: format(dataPoint.date, "MMM dd"),
          isSelected: isSameDay(dataPoint.date, currentDate),
          isCurrentMonth: currentDateInRange.getMonth() === currentDate.getMonth(),
          isToday: isToday(currentDateInRange),
        };
      }
      displayData.push(dataPoint);
    }
  
    return displayData;
  }, [data, activeTab, currentDate]);
  
  // Get data for the current month (for monthly view)
  const currentMonthData = useMemo(() => {
    if (!data.length) return [];
    
    // Filter the original data to get only items with date property
    const validData = [...data].filter(item => item.date instanceof Date);
    
    // Create a map for quick lookup of data by date
    const dataMap = new Map(
      validData.map(item => [format(item.date, "yyyy-MM-dd"), item])
    );
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    // Get the last day of the month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Calculate the number of days in the month
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Generate an array of all days in the month
    const monthData: GraphData[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateKey = format(date, "yyyy-MM-dd");
      let dataPoint = dataMap.get(dateKey);
      
      if (!dataPoint) {
        // If no data for this date, create a placeholder with zero values
        dataPoint = {
          name: format(date, "dd"), // Just show the day number for monthly view
          total: 0,
          orderCount: 0,
          growth: 0,
          trend: "stable" as const,
          date: date,
          isSelected: isSameDay(date, currentDate),
          isCurrentMonth: true,
          isToday: isToday(date),
          month: format(date, 'MMMM'),
          year: date.getFullYear()
        };
      } else {
        // Ensure the name is in the correct format (just the day number)
        dataPoint = {
          ...dataPoint,
          name: format(date, "dd"), // Just show the day number for monthly view
          isSelected: isSameDay(date, currentDate),
          isCurrentMonth: true,
          isToday: isToday(date),
          month: format(date, 'MMMM'),
          year: date.getFullYear()
        };
      }
      
      monthData.push(dataPoint);
    }
    
    // Calculate growth for each day compared to previous day
    monthData.forEach((item, index) => {
      if (index > 0) {
        const prevDay = monthData[index - 1];
        if (prevDay.total > 0) {
          item.growth = ((item.total - prevDay.total) / prevDay.total) * 100;
        } else if (item.total > 0) {
          item.growth = 100; // If previous day was 0 and current is positive
        } else {
          item.growth = 0;
        }
        
        // Determine trend
        if (item.growth > 5) {
          item.trend = "up";
        } else if (item.growth < -5) {
          item.trend = "down";
        } else {
          item.trend = "stable";
        }
      } else {
        // For the first day of the month, compare with the last day of previous month if available
        const lastDayOfPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const lastDayKey = format(lastDayOfPrevMonth, "yyyy-MM-dd");
        const lastDayData = dataMap.get(lastDayKey);
        
        if (lastDayData && lastDayData.total > 0) {
          item.growth = ((item.total - lastDayData.total) / lastDayData.total) * 100;
        } else if (item.total > 0) {
          item.growth = 100;
        } else {
          item.growth = 0;
        }
        
        // Determine trend
        if (item.growth > 5) {
          item.trend = "up";
        } else if (item.growth < -5) {
          item.trend = "down";
        } else {
          item.trend = "stable";
        }
      }
    });
    
    return monthData;
  }, [data, currentDate]);
  
  // Choose which data to display based on view mode
  const chartData = useMemo(() => {
    return viewMode === 'daily' ? dailyChartData : currentMonthData;
  }, [viewMode, dailyChartData, currentMonthData]);
  
  // Get the selected day's or month's revenue
  const selectedRevenue = useMemo(() => {
    if (!data.length) return 0;
    
    if (viewMode === 'daily') {
      // Find an exact match for the selected day using the date property
      const exactMatch = data.find(item => 
        item.date instanceof Date && 
        isSameDay(item.date, currentDate)
      );
      
      return exactMatch ? exactMatch.total : 0;
    } else {
      // For monthly view, find the matching month in our processed monthly data
      const monthMatch = monthlyData.find(item => 
        item.date.getMonth() === currentDate.getMonth() && 
        item.date.getFullYear() === currentDate.getFullYear()
      );
      
      return monthMatch ? monthMatch.total : 0;
    }
  }, [data, currentDate, viewMode, monthlyData]);
  
  // Scroll to the selected date when currentDate changes
  useEffect(() => {
    if (!chartRef.current || !chartData.length) return;
    
    // Find the index of the selected date in the chart data
    const selectedIndex = chartData.findIndex(item => {
      if (viewMode === 'daily') {
        return item.date instanceof Date && isSameDay(item.date, currentDate);
      } else {
        return item.date instanceof Date && 
               item.date.getMonth() === currentDate.getMonth() && 
               item.date.getFullYear() === currentDate.getFullYear();
      }
    });
    
    // If found, scroll to that position in the chart
    if (selectedIndex >= 0) {
      const chartContainer = chartRef.current;
      const itemWidth = viewMode === 'daily' ? 30 : 100; // Monthly data points are wider
      const scrollPosition = Math.max(0, (selectedIndex * itemWidth) - (chartContainer.clientWidth / 2) + (itemWidth / 2));
      
      // Use smooth scrolling for better UX
      chartContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentDate, chartData, viewMode]);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div 
          className="bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-800/50 overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="absolute -right-10 -top-10 w-32 h-32 bg-violet-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          />
          <div className="text-sm text-gray-400">Total Revenue</div>
          <motion.div 
            className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            €{stats.totalRevenue.toFixed(2)}
          </motion.div>
          <div className={cn(
            "text-xs flex items-center mt-1",
            stats.avgGrowth > 0 ? "text-emerald-400" : 
            stats.avgGrowth < 0 ? "text-red-400" : "text-gray-400"
          )}>
            {stats.avgGrowth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
             stats.avgGrowth < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : 
             <Minus className="w-3 h-3 mr-1" />}
            {Math.abs(stats.avgGrowth).toFixed(1)}% avg growth
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-800/50 overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="absolute -right-10 -top-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 7, 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
          />
          <div className="text-sm text-gray-400">Total Orders</div>
          <motion.div 
            className="text-2xl font-bold text-blue-400"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            {stats.totalOrders}
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-800/50 overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <motion.div 
            className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 9, 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 2
            }}
          />
          <div className="text-sm text-gray-400">
            {viewMode === 'daily' ? 'Selected Day Revenue' : 'Selected Month Revenue'}
          </div>
          <motion.div 
            className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, type: "spring" }}
          >
            €{selectedRevenue.toFixed(2)}
          </motion.div>
          <div className="text-xs text-gray-400 mt-1">
            {viewMode === 'daily' 
              ? format(currentDate, "MMMM d, yyyy")
              : format(currentDate, "MMMM yyyy")}
          </div>
        </motion.div>
      </div>

      {/* Chart Controls */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Revenue Analytics
          </h2>
          
          {/* View mode toggle */}
          <div className="flex items-center bg-[#0a101f]/70 rounded-lg p-1 ml-2">
            <motion.button
              onClick={() => setViewMode('daily')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                viewMode === 'daily' 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-gray-200"
              )}
              whileHover={{ scale: viewMode === 'daily' ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Daily
            </motion.button>
            <motion.button
              onClick={() => setViewMode('monthly')}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-all",
                viewMode === 'monthly' 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg" 
                  : "text-gray-400 hover:text-gray-200"
              )}
              whileHover={{ scale: viewMode === 'monthly' ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Monthly
            </motion.button>
          </div>
          
          <Popover open={showInfoTooltip} onOpenChange={setShowInfoTooltip}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="w-6 h-6 rounded-full bg-[#0a101f]/50 border border-gray-800/50 hover:bg-gray-800/50"
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
              >
                <Info className="h-3 w-3 text-gray-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-[#0a101f]/95 backdrop-blur-sm border border-gray-800/50 text-gray-300 text-sm">
              <p>This chart shows your {viewMode} revenue trends. You can:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Switch between daily and monthly views</li>
                <li>Drag the chart to navigate through {viewMode === 'daily' ? 'dates' : 'months'}</li>
                <li>Click on data points to see detailed information</li>
                <li>Use the calendar to jump to specific dates</li>
                <li>Use arrow buttons to navigate {viewMode === 'daily' ? 'day by day' : 'month by month'}</li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-4">
          <motion.button
            onClick={navigateBackward}
            className="p-2 bg-[#0a101f]/50 backdrop-blur-sm rounded-full shadow-lg border border-gray-800/50 hover:bg-gray-800/30 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          </motion.button>
          
          <motion.h2 
            className="text-lg font-semibold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
            key={currentDate.toString() + viewMode}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {viewMode === 'daily' 
              ? format(currentDate, "MMMM d, yyyy")
              : format(currentDate, "MMMM yyyy")}
          </motion.h2>
          
          <Popover>
            <PopoverTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 p-0 bg-[#0a101f]/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-800/50 flex items-center justify-center"
              >
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </motion.button>
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
          
          <motion.button
            onClick={navigateForward}
            className="p-2 bg-[#0a101f]/50 backdrop-blur-sm rounded-full shadow-lg border border-gray-800/50 hover:bg-gray-800/30 transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Chart */}
      <RevenueChart 
        chartData={chartData}
        chartRef={chartRef}
        isDragging={isDragging}
        dragDelta={dragDelta}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        activeTab={activeTab}
      />
    </motion.div>
  );
};
