import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.project.findMany({
      where: { deleted: false },
      orderBy: { created_at: 'asc' },
    });
    const result = records.map(r => ({
      ...r,
      created_at: r.created_at.toString(),
      updated_at: r.updated_at.toString(),
      purchase_price_num: r.purchase_price_num?.toString() ?? '',
      required_experience_years: r.required_experience_years?.toString() ?? '',
    }));
    return NextResponse.json(result);
  } catch (e) {
    console.error('GET /api/projects error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.project.create({
      data: {
        status: body.status ?? '',
        shareable: body.shareable ?? '',
        share_note: body.share_note ?? '',
        added_date: body.added_date ?? '',
        source: body.source ?? '',
        project_name_original: body.project_name_original ?? '',
        project_name_rewrite: body.project_name_rewrite ?? '',
        client_price: body.client_price ?? '',
        purchase_price: body.purchase_price ?? '',
        purchase_price_num: body.purchase_price_num ? parseFloat(body.purchase_price_num) : null,
        role: body.role ?? '',
        location: body.location ?? '',
        work_style: body.work_style ?? '',
        period: body.period ?? '',
        headcount: body.headcount ?? '',
        required_skills: body.required_skills ?? '',
        preferred_skills: body.preferred_skills ?? '',
        required_skill_tags: body.required_skill_tags ?? '',
        preferred_skill_tags: body.preferred_skill_tags ?? '',
        industry_tags: body.industry_tags ?? '',
        required_experience_years: body.required_experience_years ? parseFloat(body.required_experience_years) : null,
        description_original: body.description_original ?? '',
        description_rewrite: body.description_rewrite ?? '',
        age_limit: body.age_limit ?? '',
        nationality: body.nationality ?? '',
        english: body.english ?? '',
        commercial_flow: body.commercial_flow ?? '',
        interview_count: body.interview_count ?? '',
        client_price_min: body.client_price_min ? parseInt(body.client_price_min) : null,
        client_price_max: body.client_price_max ? parseInt(body.client_price_max) : null,
        purchase_price_min: body.purchase_price_min ? parseInt(body.purchase_price_min) : null,
        purchase_price_max: body.purchase_price_max ? parseInt(body.purchase_price_max) : null,
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
      purchase_price_num: record.purchase_price_num?.toString() ?? '',
      required_experience_years: record.required_experience_years?.toString() ?? '',
    });
  } catch (e) {
    console.error('POST /api/projects error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
