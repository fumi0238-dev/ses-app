import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        desired_price_num: body.desired_price_num ? parseFloat(body.desired_price_num) : null,
        contact: body.contact ?? '',
        desired_position: body.desired_position ?? '',
        skill_sheet_url: body.skill_sheet_url ?? '',
        proposal_text: body.proposal_text ?? '',
        sales_comment: body.sales_comment ?? '',
        skills_summary: body.skills_summary ?? '',
        skill_tags: body.skill_tags ?? '',
        industry_tags: body.industry_tags ?? '',
        experience_years: body.experience_years ? parseFloat(body.experience_years) : null,
        experience_summary: body.experience_summary ?? '',
        nearest_station: body.nearest_station ?? '',
        available_date: body.available_date ?? '',
        work_preference: body.work_preference ?? '',
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
