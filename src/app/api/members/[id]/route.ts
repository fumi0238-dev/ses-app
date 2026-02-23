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
        work_preference: body.work_preference,
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
