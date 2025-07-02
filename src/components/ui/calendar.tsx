import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"
import "./calendar.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const isSunday = (date: Date) => date.getDay() === 0;
  
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white rounded-md", className)}
      modifiers={{
        sunday: isSunday,
      }}
      modifiersClassNames={{
        sunday: "text-red-500 font-semibold",
      }}
      classNames={{
        root: "rdp-root",
        months: "rdp-months flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "rdp-month space-y-4 w-full",
        month_caption: "rdp-month_caption flex justify-center pt-1 relative items-center mb-2",
        caption_label: "rdp-caption_label text-sm font-medium",
        nav: "rdp-nav space-x-1 flex items-center",
        nav_button: cn(
          "rdp-nav_button",
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        month_grid: "rdp-month_grid w-full border-collapse",
        weekdays: "rdp-weekdays",
        weekday: cn(
          "rdp-weekday",
          "text-muted-foreground w-9 h-9 font-normal text-[0.8rem] text-center",
          "[&:nth-child(1)]:text-red-500 [&:nth-child(1)]:font-semibold"
        ),
        week: "rdp-week grid grid-cols-7 mt-2",
        day: cn(
          "rdp-day",
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md",
          "[&:nth-child(1)]:text-red-500"
        ),
        day_button: cn(
          "rdp-day_button",
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        selected:
          "rdp-selected bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "rdp-today bg-accent text-accent-foreground font-semibold",
        outside: "rdp-outside text-muted-foreground opacity-50",
        disabled: "rdp-disabled text-muted-foreground opacity-50",
        range_middle:
          "rdp-range_middle aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "rdp-hidden invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }