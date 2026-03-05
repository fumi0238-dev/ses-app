import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = BigInt(Date.now());
    const record = await prisma.member.update({
      where: { id },
      data: {
        process: body.process,
        affiliation: body.affiliation,
        full_name: body.full_name,
        initial: body.initial,
        contract_employee: body.contract_employee,
        desired_price: body.desired_price,
        desired_price_num: body.desired_price_num ? parseFloat(body.desired_price_num) : null,
        contact: body.contact,
        desired_position: body.desired_position,
        skill_sheet_url: body.skill_sheet_url,
        proposal_text: body.proposal_text,
        sales_comment: body.sales_comment,
        skills_summary: body.skills_summary,
        skill_tags: body.skill_tags,
        industry_tags: body.industry_tags,
        experience_years: body.experience_years ? parseFloat(body.experience_years) : null,
        experience_summary: body.experience_summary,
        nearest_station: body.nearest_station,
        available_date: body.available_date,
        available_immediately: body.available_immediately !== undefined ? body.available_immediately : undefined,
        work_preference: body.work_preference,
        shareable: body.shareable,
        share_note: body.share_note,
        desired_price_min: body.desired_price_min !== undefined ? (body.desired_price_min ? parseInt(body.desired_price_min) : null) : undefined,
        desired_price_max: body.desired_price_max !== undefined ? (body.desired_price_max ? parseInt(body.desired_price_max) : null) : undefined,
        work_style_category: body.work_style_category !== undefined ? body.work_style_category : undefined,
        work_style_office_days: body.work_style_office_days !== undefined ? body.work_style_office_days : undefined,
        work_style_initial_onsite: body.work_style_initial_onsite !== undefined ? body.work_style_initial_onsite : undefined,
        work_style_transition_onsite: body.work_style_transition_onsite !== undefined ? body.work_style_transition_onsite : undefined,
        work_style_note: body.work_style_note !== undefined ? body.work_style_note : undefined,
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
    console.error('PUT /api/members/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.member.update({
      where: { id },
      data: { deleted: true, updated_at: BigInt(Date.now()) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/members/[id] error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
