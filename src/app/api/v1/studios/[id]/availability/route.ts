import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getEffectivePrice } from '@/lib/pricing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const studioId = p.id;
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get('date');

    if (!studioId) {
      return NextResponse.json({ error: 'Studio ID is required' }, { status: 400 });
    }

    if (!dateStr) {
      return NextResponse.json({ error: 'date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
    }

    // Parse the requested date perfectly aligned to the exact local bounds
    const [year, month, day] = dateStr.split('-');
    const startOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0, 0);
    
    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }
    
    const endOfDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59, 999);

    // 1. Fetch the Target Studio to check for Room IDs
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { roomId: true, type: true, locationId: true, name: true }
    });

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    // 2. Fetch all studios in the same physical room (including self)
    const siblingStudioIds = studio.roomId 
      ? (await prisma.studio.findMany({
          where: { roomId: studio.roomId },
          select: { id: true }
        })).map(s => s.id)
      : [studioId];

    // 3. Fetch Bookings and Manual Blocks for ALL sibling studios in this room
    const [bookings, manualBlocks, modeSchedules] = await Promise.all([
      prisma.booking.findMany({
        where: {
          studioId: { in: siblingStudioIds },
          status: { in: ['pending', 'confirmed'] },
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        },
        select: { startTime: true, endTime: true }
      }),
      prisma.blockedSlot.findMany({
        where: {
          studioId: { in: siblingStudioIds },
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        },
        select: { startTime: true, endTime: true }
      }),
      prisma.studioModeSchedule.findMany({
        where: {
          roomId: studio.roomId || (studio.name.includes("White") ? "ROOM_A" : "ROOM_B"),
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          activeStudioId: true,
          activeType: true,
          roomId: true,
          locationId: true,
          discount: true,
          isActive: true
        }
      })
    ]);

    // 4. Calculate Mode Blocks & Inactivity
    const modeBlocks: { startTime: Date, endTime: Date }[] = [];
    const activeOverrides: any[] = [];
    
    modeSchedules.forEach(schedule => {
      // If the slot is manually set to inactive, block it for everyone
      if (schedule.isActive === false) {
        modeBlocks.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });
        return;
      }

      const isAllowed = (!schedule.activeStudioId && !schedule.activeType) ||
                        schedule.activeStudioId === studioId || 
                        (schedule.activeType && schedule.activeType === studio.type);
      
      if (!isAllowed) {
        // Different mode active in the same room
        modeBlocks.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });
      } else {
        // We are the active mode or allowed! Let's pass this override to the client for discounts/style names.
        activeOverrides.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          discount: schedule.discount,
          activeStudioId: schedule.activeStudioId
        });
      }
    });

    // Enhance overrides with the strictly calculated effective price
    const location = await prisma.location.findUnique({ where: { id: studio.locationId } });
    const SLOT_HOURS = location?.availableHours || [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    for (const h of SLOT_HOURS) {
       const slotStart = new Date(startOfDay);
       slotStart.setHours(h, 0, 0, 0);

       const pricing = await getEffectivePrice(studio.locationId, studioId, slotStart);
       if (pricing.isActive === false) {
          modeBlocks.push({
            startTime: slotStart,
            endTime: new Date(slotStart.getTime() + (studio.sessionDuration * 60000))
          });
       }

       const existingOverride = activeOverrides.find(o => o.startTime.getTime() === slotStart.getTime());

       if (existingOverride) {
          existingOverride.calculatedPrice = pricing.finalPrice;
          existingOverride.basePrice = pricing.basePrice;
          existingOverride.isActive = pricing.isActive;
       } else {
          // Send default prices for slots with no manual override
          activeOverrides.push({
             startTime: slotStart,
             endTime: new Date(slotStart.getTime() + (studio.sessionDuration * 60000)),
             calculatedPrice: pricing.finalPrice,
             basePrice: pricing.basePrice,
             isActive: pricing.isActive
          });
       }
    }

    const mergedBlocks = [...bookings, ...manualBlocks];

    return NextResponse.json({
      studioId,
      date: dateStr,
      blockedSlots: mergedBlocks,
      inactiveSlots: modeBlocks,
      overrides: activeOverrides
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching studio availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
