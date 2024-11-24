import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
}

export function TimePickerDemo({ date, setDate }: TimePickerProps) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <div className="grid gap-1">
        <Label htmlFor="hours">HH</Label>
        <Input
          id="hours"
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => {
            const newDate = new Date(date);
            newDate.setHours(parseInt(e.target.value) || 0);
            setDate(newDate);
          }}
          className="w-16"
        />
      </div>
      <span className="text-2xl mt-7">:</span>
      <div className="grid gap-1">
        <Label htmlFor="minutes">MM</Label>
        <Input
          id="minutes"
          type="number"
          min={0}
          max={59}
          value={minutes}
          onChange={(e) => {
            const newDate = new Date(date);
            newDate.setMinutes(parseInt(e.target.value) || 0);
            setDate(newDate);
          }}
          className="w-16"
        />
      </div>
    </div>
  );
} 