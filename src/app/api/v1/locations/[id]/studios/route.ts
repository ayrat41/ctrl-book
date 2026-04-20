import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const locationId = p.id;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    
    if (!locationId) {
      return NextResponse.json({ error: 'Location ID is required' }, { status: 400 });
    }

    // Fetch all studios for this location
    let studios = await prisma.studio.findMany({
      where: {
        locationId: locationId,
      },
    });

    // If a date is provided, filter based on Mode Schedules
    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);

      const schedules = await prisma.studioModeSchedule.findMany({
        where: {
          locationId,
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        }
      });

      // Filter logic:
      // For each roomId that has schedules on this day, we only keep studios that match the scheduled modes.
      // If a roomId has NO schedules on this day, we show all studios for that room (fallback).
      
      const roomsWithSchedules = new Set(schedules.map(s => s.roomId));
      
      studios = studios.filter(studio => {
        if (!studio.roomId || !roomsWithSchedules.has(studio.roomId)) return true;

        // If this room HAS schedules today, check if this specific studio (or its type) is ever mentioned
        const roomSchedules = schedules.filter(s => s.roomId === studio.roomId);
        const isActiveInAnySlot = roomSchedules.some(s => 
          s.activeStudioId === studio.id || 
          (s.activeType && s.activeType === studio.type)
        );

        return isActiveInAnySlot;
      });
    }

    return NextResponse.json(studios, { status: 200 });
  } catch (error) {
    console.error('Error fetching studios for location:', error);
    return NextResponse.json({ error: 'Failed to fetch studios' }, { status: 500 });
  }
}
