import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.project.update({
      where: { id },
      data: {
        status: body.status,
        shareable: body.shareable,
        share_note: body.share_note,
        added_date: body.added_date,
        source: body.source,
        project_name_original: body.project_name_original,
        project_name_rewrite: body.project_name_rewrite,
        client_price: body.client_price,
        purchase_price: body.purchase_price,
        purchase_price_num: body.purchase_price_num ? parseFloat(body.purchase_price_num) : null,
        role: body.role,
        location: body.location,
        work_style: body.work_style,
        period: body.period,
        headcount: body.headcount,
        required_skills: body.required_skills,
        preferred_skills: body.preferred_skills,
        required_skill_tags: body.required_skill_tags,
        preferred_skill_tags: body.preferred_skill_tags,
        industry_tags: body.industry_tags,
        required_experience_years: body.required_experience_years ? parseFloat(body.required_experience_years) : null,
        description_original: body.description_original,
        description_rewrite: body.description_rewrite,
        age_limit: body.age_limit,
        nationality: body.nationality,
        english: body.english,
        commercial_flow: body.commercial_flow,
        interview_count: body.interview_count,
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
    console.error('PUT /api/projects/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.project.update({
      where: { id },
      data: { deleted: true, updated_at: BigInt(Date.now()) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/projects/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
