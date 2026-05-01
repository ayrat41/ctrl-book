import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startStr = searchParams.get('start');
    const endStr = searchParams.get('end');
    const locationId = searchParams.get('locationId');

    if (!startStr || !endStr) {
      return NextResponse.json({ error: 'Missing start or end date' }, { status: 400 });
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    let studioFilter = {};
    if (locationId && locationId !== 'all') {
      const studios = await prisma.studio.findMany({
        where: { locationId },
        select: { id: true }
      });
      studioFilter = { in: studios.map(s => s.id) };
    }

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: startDate },
        endTime: { lte: endDate },
        status: { in: ['confirmed', 'pending'] },
        ...(Object.keys(studioFilter).length > 0 ? { studioId: studioFilter } : {})
      },
      include: {
        customer: { select: { fullName: true, email: true, phone: true } },
        studio: { select: { name: true, roomId: true, locationId: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    // Also need studios to calculate capacity
    const studios = await prisma.studio.findMany({
      where: locationId && locationId !== 'all' ? { locationId } : {}
    });

    const locations = await prisma.location.findMany({
      where: locationId && locationId !== 'all' ? { id: locationId } : {}
    });

    return NextResponse.json({
      bookings,
      studios,
      locations
    });

  } catch (error) {
    console.error('Error fetching calendar data:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
