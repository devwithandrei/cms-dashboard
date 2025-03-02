import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ComposedChart, Area, Bar, ReferenceLine, Line } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay } from "date-fns";
import { DollarSign, BarChart3, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { RefObject } from "react";

interface GraphData {
  name: string;
  total: number;
  orderCount: number;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  date: Date;
  isSelected?: boolean;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  month?: string;
  year?: number;
}

interface RevenueChartProps {
  chartData: GraphData[];
  chartRef: RefObject<HTMLDivElement>;
  isDragging: boolean;
  dragDelta: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  activeTab: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="bg-[#0a101f]/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-800/50"
      >
        <div className="font-bold text-lg mb-2 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">{label}</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 flex items-center">
              <DollarSign className="w-3 h-3 mr-1 text-violet-400" />
              Revenue:
            </span>
            <span className="font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              €{item.total.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400 flex items-center">
              <BarChart3 className="w-3 h-3 mr-1 text-blue-400" />
              Orders:
            </span>
            <span className="font-bold text-blue-400">
              {item.orderCount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-400">Growth:</span>
            <span className={cn(
              "font-bold flex items-center",
              item.growth > 0 ? "text-emerald-400" : 
              item.growth < 0 ? "text-red-400" : "text-gray-400"
            )}>
              {item.growth > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : 
               item.growth < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> : 
               <Minus className="w-3 h-3 mr-1" />}
              {Math.abs(item.growth).toFixed(1)}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  return null;
};

export const RevenueChart: React.FC<RevenueChartProps> = ({
  chartData,
  chartRef,
  isDragging,
  dragDelta,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  activeTab
}) => {
  return (
    <motion.div 
      className="h-[400px] w-full bg-[#0a101f]/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-800/50 cursor-grab active:cursor-grabbing overflow-x-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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
      <ResponsiveContainer width={chartData.length * 30 > 900 ? chartData.length * 30 : "100%"} height="100%">
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
            <linearGradient id="selectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A855F7" stopOpacity={0.5}/>
              <stop offset="50%" stopColor="#A855F7" stopOpacity={0.2}/>
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.1}/>
            </linearGradient>
            <filter id="selectedGlow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
              <stop offset="100%" stopColor="#6366F1" stopOpacity={1} />
            </linearGradient>
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
            tickFormatter={(value: number) => 
              activeTab === 'revenue' ? `€${value}` : value.toString()
            }
            className="text-gray-400"
            dx={-10}
            // Ensure the chart scales properly for large values
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />
          <Tooltip
            cursor={false}
            content={<CustomTooltip />}
            position={{ y: 0 }}
          />
          {/* Add a reference line for the selected date */}
          {chartData.findIndex(item => item.isSelected) > 0 && (
            <ReferenceLine
              x={chartData.find(item => item.isSelected)?.name}
              stroke="#A855F7"
              strokeWidth={1}
              strokeDasharray="3 3"
              className="opacity-50"
            />
          )}
          
          {/* Use Area chart for daily view */}
          {activeTab === 'revenue' && !chartData[0]?.month && (
            <Area
              type="monotone"
              dataKey="total"
              fill="url(#areaGradient)"
              stroke="url(#colorGradient)"
              strokeWidth={3}
              filter="url(#glow)"
              dot={(props: any) => {
                const { cx, cy, payload, index } = props;
                
                // Highlight selected date with a larger, more prominent dot
                if (payload.isSelected) {
                  return (
                    <g>
                      {/* Animated pulse effect for selected point using CSS animation */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={15}
                        fill="rgba(139, 92, 246, 0.15)"
                        className="animate-pulse"
                      />
                      {/* Outer glow */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="rgba(139, 92, 246, 0.2)"
                        filter="url(#selectedGlow)"
                      />
                      {/* Inner circle */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill="#A855F7"
                        stroke="#030711"
                        strokeWidth={2}
                        className="glow-effect"
                      />
                    </g>
                  );
                }
                
                // Special styling for today
                if (payload.isToday) {
                  return (
                    <g>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill="#10B981"
                        stroke="#030711"
                        strokeWidth={1.5}
                        className="glow-effect"
                      />
                    </g>
                  );
                }
                
                // Different styling for current month vs other months
                const isCurrentMonth = payload.isCurrentMonth;
                
                // Only render dots for every 3rd point to avoid overcrowding
                // except for current month points which are all shown
                if (!isCurrentMonth && index % 3 !== 0) {
                  // Return an invisible dot instead of null to satisfy TypeScript
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={0}
                      fill="transparent"
                      opacity={0}
                    />
                  );
                }
                
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isCurrentMonth ? 4 : 3}
                    fill={isCurrentMonth ? "#8B5CF6" : "#6366F1"}
                    stroke="#030711"
                    strokeWidth={isCurrentMonth ? 2 : 1}
                    className="glow-effect"
                    opacity={isCurrentMonth ? 1 : 0.7}
                  />
                );
              }}
              activeDot={(props: any) => {
                const { cx, cy } = props;
                return (
                  <g>
                    {/* Outer pulse with CSS animation */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={12}
                      fill="rgba(168, 85, 247, 0.2)"
                      className="animate-ping"
                      style={{ animationDuration: '2s', opacity: 0.6 }}
                    />
                    {/* Main dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={8}
                      fill="#A855F7"
                      stroke="#030711"
                      strokeWidth={2}
                      filter="url(#glow)"
                    />
                  </g>
                );
              }}
              animationBegin={0}
              animationDuration={2000}
              animationEasing="ease-out"
              connectNulls={true}
              isAnimationActive={true}
            />
          )}
          
          {/* Use modern Bar chart for monthly view */}
          {activeTab === 'revenue' && chartData[0]?.month && (
            <>
              {/* Add a subtle area under the bars for visual effect */}
              <defs>
                <linearGradient id="barAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="total"
                fill="url(#barAreaGradient)"
                stroke="none"
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={2000}
                animationEasing="ease-out"
              />
              
              {/* Modern bars for each day */}
              <Bar
                dataKey="total"
                barSize={16}
                maxBarSize={100}
                radius={[4, 4, 0, 0]}
                animationBegin={0}
                animationDuration={2000}
                animationEasing="ease-out"
                isAnimationActive={true}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  const isSelected = payload.isSelected;
                  
                  // Calculate gradient based on value (higher values get more vibrant colors)
                  const maxHeight = 200; // Approximate max height to keep bars at medium height
                  const normalizedHeight = Math.min(height, maxHeight);
                  const heightRatio = normalizedHeight / maxHeight;
                  
                  return (
                    <g>
                      {/* Glow effect for all bars */}
                      <defs>
                        <linearGradient id={`barGradient-${payload.name}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity={0.9 * heightRatio + 0.1} />
                          <stop offset="100%" stopColor="#6366F1" stopOpacity={0.7 * heightRatio + 0.1} />
                        </linearGradient>
                        <filter id={`barGlow-${payload.name}`} height="200%">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                          <feComposite in="blur" in2="SourceGraphic" operator="over" />
                        </filter>
                      </defs>
                      
                      {/* Highlight effect for selected bar */}
                      {isSelected && (
                        <>
                          <rect
                            x={x - 2}
                            y={y - 4}
                            width={width + 4}
                            height={height + 4}
                            fill="rgba(168, 85, 247, 0.2)"
                            rx={6}
                            ry={6}
                            className="animate-pulse"
                            style={{ animationDuration: '2s' }}
                          />
                          <rect
                            x={x - 1}
                            y={y - 2}
                            width={width + 2}
                            height={height + 2}
                            fill="rgba(168, 85, 247, 0.3)"
                            rx={5}
                            ry={5}
                          />
                        </>
                      )}
                      
                      {/* Main bar with modern gradient */}
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={normalizedHeight}
                        fill={`url(#barGradient-${payload.name})`}
                        rx={4}
                        ry={4}
                        filter={`url(#barGlow-${payload.name})`}
                        stroke={isSelected ? "#A855F7" : "transparent"}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                      
                      {/* Shine effect on top of the bar */}
                      <rect
                        x={x + width * 0.25}
                        y={y}
                        width={width * 0.5}
                        height={4}
                        fill="rgba(255, 255, 255, 0.3)"
                        rx={2}
                        ry={2}
                      />
                    </g>
                  );
                }}
              />
            </>
          )}
          
          {/* Add a subtle line on top for extra definition */}
          <Line
            type="monotone"
            dataKey="total"
            stroke="rgba(255, 255, 255, 0.6)"
            strokeWidth={1}
            dot={false}
            activeDot={false}
            isAnimationActive={true}
            animationBegin={1000}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          
          {/* Always include growth data for the tooltip */}
          <Bar 
            dataKey="growth" 
            fill="#10B981"
            barSize={6}
            yAxisId={1}
            hide={true} // Hide the bar but keep it in the tooltip
            shape={(props: any) => {
              const { x, y, width, height } = props;
              const color = props.payload.growth > 0 ? "#10B981" : 
                            props.payload.growth < 0 ? "#EF4444" : "#6B7280";
              return (
                <rect 
                  x={x} 
                  y={y}
                  width={width} 
                  height={height} 
                  fill={color} 
                  rx={4}
                  ry={4}
                />
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
