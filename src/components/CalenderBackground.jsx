// 📅 Dynamic Timeline Generation based on project data
const generateTimelineColumns = (timeline) => {
  const columns = [];
  
  if (!timeline || !timeline.startDate || !timeline.endDate) {
    console.warn('⚠️ No timeline data available, using default calendar');
    return generateDefaultBusinessDays();
  }

  const { startDate, endDate, timelineType } = timeline;
  console.log(`📅 Generating ${timelineType} columns from ${startDate.toDateString()} to ${endDate.toDateString()}`);

  switch (timelineType) {
    case 'daily':
      return generateDailyColumns(startDate, endDate);
    case 'weekly': 
      return generateWeeklyColumns(startDate, endDate);
    case 'monthly':
      return generateMonthlyColumns(startDate, endDate);
    default:
      return generateDailyColumns(startDate, endDate);
  }
};

// Generate daily business day columns (excludes weekends)
const generateDailyColumns = (startDate, endDate) => {
  const columns = [];
  let currentDate = new Date(startDate);
  let columnIndex = 0;

  // Start from Monday of the start week
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentDate.setDate(currentDate.getDate() + daysToMonday);

  while (currentDate <= endDate) {
    // Only include Monday through Friday
    if (currentDate.getDay() >= 1 && currentDate.getDay() <= 5) {
      columns.push({
        date: new Date(currentDate),
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
        columnIndex: columnIndex++,
        type: 'day',
        width: 120
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return columns;
};

// Generate weekly columns
const generateWeeklyColumns = (startDate, endDate) => {
  const columns = [];
  let currentDate = new Date(startDate);
  let columnIndex = 0;

  // Start from Monday of the start week
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentDate.setDate(currentDate.getDate() + daysToMonday);

  while (currentDate <= endDate) {
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(currentDate.getDate() + 4); // Friday

    columns.push({
      date: new Date(currentDate),
      dayName: 'Week',
      dayNumber: `${currentDate.getDate()}-${weekEnd.getDate()}`,
      month: currentDate.toLocaleDateString('en-US', { month: 'short' }),
      columnIndex: columnIndex++,
      type: 'week',
      width: 160,
      endDate: weekEnd
    });

    currentDate.setDate(currentDate.getDate() + 7); // Next Monday
  }

  return columns;
};

// Generate monthly columns
const generateMonthlyColumns = (startDate, endDate) => {
  const columns = [];
  let currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  let columnIndex = 0;

  while (currentDate <= endDate) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    columns.push({
      date: new Date(currentDate),
      dayName: 'Month',
      dayNumber: currentDate.toLocaleDateString('en-US', { month: 'short' }),
      month: currentDate.getFullYear().toString(),
      columnIndex: columnIndex++,
      type: 'month',
      width: 200,
      endDate: monthEnd
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return columns;
};

// Fallback to default business days for 8 weeks
const generateDefaultBusinessDays = () => {
    const days = [];
    const startDate = new Date(); // Start from today

    // Find the Monday of this week
    const dayOfWeek = startDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(startDate);
    monday.setDate(startDate.getDate() + daysToMonday);

    // Generate 8 weeks of business days (Monday through Friday)
    for (let week = 0; week < 8; week++) {
        for (let day = 0; day < 5; day++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + (week * 7) + day);
            days.push({
                date: currentDay,
                dayName: currentDay.toLocaleDateString('en-US', { weekday: 'short' }),
                dayNumber: currentDay.getDate(),
                month: currentDay.toLocaleDateString('en-US', { month: 'short' }),
                columnIndex: week * 5 + day,
                type: 'day',
                width: 120
            });
        }
    }

    return days;
};

// Enhanced calendar background component with dynamic timeline
export default function CalendarBackground({ calendarOpacity, timeline, timelineColumns, timelineWidth }) {
    // Use pre-calculated timeline columns if provided, otherwise generate fallback
    const columns = timelineColumns && timelineColumns.length > 0 
      ? timelineColumns 
      : generateDefaultBusinessDays();

    console.log(`📅 Calendar: Rendering ${columns.length} ${columns[0]?.type || 'default'} columns, width: ${timelineWidth}px`);

    return (
        <div 
            className="absolute top-0 left-0 h-full pointer-events-none"
            style={{
                opacity: calendarOpacity,
                width: timelineWidth || Math.max(1600, window.innerWidth),
                height: '100%'
            }}
        >
            {/* Dynamic Timeline Columns Container */}
            <div 
                className="absolute top-0 left-0 h-full flex"
                style={{
                    width: timelineWidth || Math.max(1600, window.innerWidth),
                    height: '100%'
                }}
            >
                {columns.map((column, index) => (
                    <div 
                        key={index} 
                        className="flex-none bg-white border-r border-gray-200 relative"
                        style={{ width: `${column.width}px` }}
                    >
                        {/* Vertical separator lines extending full height from header to bottom */}
                        <div className="absolute top-[72px] bottom-0 right-0 w-px bg-gray-200 z-[5]" />
                    </div>
                ))}
            </div>
        </div>
    );
};