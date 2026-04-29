import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { getEffectivePrice } from '@/lib/pricing';
import { fromZonedTime } from 'date-fns-tz';

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

    // 1. Fetch the Target Studio & Location Context
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { roomId: true, isSpecial: true, locationId: true, name: true, sessionDuration: true }
    });

    if (!studio) {
      return NextResponse.json({ error: 'Studio not found' }, { status: 404 });
    }

    const location = await prisma.location.findUnique({ where: { id: studio.locationId } });
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const timezone = location.timezone || 'UTC';

    // Parse the requested date in the location's local timezone
    const startOfDay = fromZonedTime(`${dateStr} 00:00:00`, timezone);
    const endOfDay = fromZonedTime(`${dateStr} 23:59:59.999`, timezone);
    
    if (isNaN(startOfDay.getTime())) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    // 2. Fetch all studios in the same physical room
    const siblingStudioIds = (await prisma.studio.findMany({
        where: { roomId: studio.roomId, locationId: studio.locationId },
        select: { id: true }
    })).map(s => s.id);

    // 3. Fetch Bookings and Manual Blocks for ALL sibling studios in this room
    const [bookings, manualBlocks, modeSchedules] = await Promise.all([
      prisma.booking.findMany({
        where: {
          studioId: { in: siblingStudioIds },
          status: { in: ['pending', 'confirmed'] },
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        },
        select: { startTime: true, endTime: true, status: true, groupId: true }
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
          locationId: studio.locationId,
          roomId: studio.roomId,
          startTime: { gte: startOfDay },
          endTime: { lte: endOfDay }
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          activeStudioId: true,
          roomId: true,
          locationId: true,
          discount: true,
          isActive: true
        }
      })
    ]);

    // 3.5 Filter out abandoned pending bookings (older than 15 minutes)
    const now = Date.now();
    const validBookings = bookings.filter(b => {
      if (b.status === 'confirmed') return true;
      if (b.status === 'pending' && b.groupId) {
         // Extract timestamp from groupId (e.g. pending_1777235765373_gzf1am)
         const parts = b.groupId.split('_');
         if (parts.length >= 2) {
            const timestamp = parseInt(parts[1], 10);
            if (!isNaN(timestamp)) {
               // If pending for more than 15 minutes, ignore it
               if (now - timestamp > 15 * 60 * 1000) {
                  return false;
               }
            }
         }
      }
      return true;
    }).map(b => ({ startTime: b.startTime, endTime: b.endTime }));

    // 4. Calculate Mode Blocks & Inactivity
    const modeBlocks: { startTime: Date, endTime: Date }[] = [];
    const activeOverrides: any[] = [];
    
    modeSchedules.forEach(schedule => {
      if (schedule.isActive === false) {
        modeBlocks.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });
        return;
      }

      const isAllowed = (!schedule.activeStudioId) || schedule.activeStudioId === studioId;
      
      if (!isAllowed) {
        modeBlocks.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        });
      } else {
        activeOverrides.push({
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          discount: schedule.discount,
          activeStudioId: schedule.activeStudioId
        });
      }
    });

    // Generate slots and enhance with pricing
    const SLOT_HOURS = location.availableHours || [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    for (const h of SLOT_HOURS) {
       // Create slot start time strictly in the location's timezone
       const hourStr = h < 10 ? `0${h}` : `${h}`;
       const slotStart = fromZonedTime(`${dateStr} ${hourStr}:00:00`, timezone);
       const slotEnd = new Date(slotStart.getTime() + (studio.sessionDuration * 60000));

       const pricing = await getEffectivePrice(studio.locationId, studioId, slotStart);
       if (pricing.isActive === false) {
          modeBlocks.push({
            startTime: slotStart,
            endTime: slotEnd
          });
       }

       const existingOverride = activeOverrides.find(o => o.startTime.getTime() === slotStart.getTime());

       if (existingOverride) {
          existingOverride.calculatedPrice = pricing.finalPrice;
          existingOverride.basePrice = pricing.basePrice;
          existingOverride.isActive = pricing.isActive;
       } else {
          activeOverrides.push({
             startTime: slotStart,
             endTime: slotEnd,
             calculatedPrice: pricing.finalPrice,
             basePrice: pricing.basePrice,
             isActive: pricing.isActive
          });
       }
    }

    const mergedBlocks = [...validBookings, ...manualBlocks];

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
