// Generate business days for calendar
const generateBusinessDays = () => {
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
                week: week,
                columnX: week * 5 + day // Calculate column position
            });
        }
    }

    return days;
};

// Add calendar background component
export default function CalendarBackground({ calendarOpacity }) {
    const businessDays = generateBusinessDays();

    return (
        <div
            className="calendar-background absolute top-0 left-0 w-full h-full z-[-10] pointer-events-none"
            style={{ opacity: calendarOpacity }}
        >
            {/* Clean White Header Background */}
            <div className="absolute top-[72px] left-0 w-full h-[120px] bg-white border-b-2 border-gray-200 z-[1]" />

            {/* Calendar Days Container */}
            <div className="absolute -top-12 left-0 w-full h-full flex">
                {businessDays.map((day, index) => (
                    <div
                        key={index}
                        className="flex-none w-[120px] bg-white border-r border-gray-200 relative"
                    >
                        {/* Clean Minimal Date Header */}
                        <div className="text-center py-[20px] px-[8px] bg-white border-r border-gray-200 mt-[172px] relative z-[2]">
                            <div className="text-[11px] font-medium text-gray-500 uppercase tracking-[0.5px] mb-2">
                                {day.dayName}
                            </div>
                            <div className="text-[32px] font-semibold text-gray-900 leading-none">
                                {day.dayNumber}
                            </div>
                        </div>

                        {/* Vertical separator lines extending full height */}
                        <div className="absolute top-[72px] bottom-0 right-0 w-px bg-gray-200 z-[5]" />
                    </div>
                ))}
            </div>
        </div>
    );
};