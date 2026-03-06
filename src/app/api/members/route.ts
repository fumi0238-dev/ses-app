import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { safeParseFloat, safeParseInt } from '@/lib/helpers';

export async function GET() {
  try {
    const records = await prisma.member.findMany({
      where: { deleted: false },
      orderBy: { created_at: 'asc' },
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
      updated_at: r.updated_at.toString(),
      desired_price_num: r.desired_price_num?.toString() ?? '',
      experience_years: r.experience_years?.toString() ?? '',
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/members error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.member.create({
      data: {
        process: body.process ?? '',
        affiliation: body.affiliation ?? '',
        full_name: body.full_name ?? '',
        initial: body.initial ?? '',
        contract_employee: body.contract_employee ?? '',
        desired_price: body.desired_price ?? '',
        desired_price_num: safeParseFloat(body.desired_price_num),
        contact: body.contact ?? '',
        desired_position: body.desired_position ?? '',
        skill_sheet_url: body.skill_sheet_url ?? '',
        proposal_text: body.proposal_text ?? '',
        sales_comment: body.sales_comment ?? '',
        skills_summary: body.skills_summary ?? '',
        skill_tags: body.skill_tags ?? '',
        industry_tags: body.industry_tags ?? '',
        experience_years: safeParseFloat(body.experience_years),
        experience_summary: body.experience_summary ?? '',
        nearest_station: body.nearest_station ?? '',
        available_date: body.available_date ?? '',
        available_immediately: body.available_immediately ?? false,
        work_preference: body.work_preference ?? '',
        shareable: body.shareable ?? '',
        share_note: body.share_note ?? '',
        desired_price_min: safeParseInt(body.desired_price_min),
        desired_price_max: safeParseInt(body.desired_price_max),
        work_style_category: body.work_style_category ?? null,
        work_style_office_days: body.work_style_office_days ?? null,
        work_style_initial_onsite: body.work_style_initial_onsite ?? false,
        work_style_transition_onsite: body.work_style_transition_onsite ?? false,
        work_style_note: body.work_style_note ?? null,
        created_at: now,
        updated_at: now,
      },
    });
    return NextResponse.json({
      ...record,
      created_at: record.created_at.toString(),
      updated_at: record.updated_at.toString(),
      desired_price_num: record.desired_price_num?.toString() ?? '',
      experience_years: record.experience_years?.toString() ?? '',
    });
  } catch (e) {
    console.error('POST /api/members error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
