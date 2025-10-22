import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient(true);
  const { id } = params;

  // 1. Fetch certificate and relations
  const { data: cert, error } = await supabase
    .from("certificates")
    .select(
      `
      id,
      certificate_number,
      verification_code,
      issued_date,
      expiry_date,
      status,
      certification_program:id ( name, description, start_date, end_date ),
      organization:organization_id ( name ),
      employee:employee_id ( full_name )
      `
    )
    .eq("id", id)
    .single();

  if (error || !cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  // 2. Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 Landscape
  const { width, height } = page.getSize();

  // Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primary = rgb(0.2, 0.2, 0.2);
  const accent = rgb(0.1, 0.3, 0.6);

  const margin = 50;

  // Platform / Branding
  page.drawText("CERTIFIED Platform", {
    x: width - 220,
    y: height - margin,
    size: 16,
    font: fontBold,
    color: accent,
  });

  // Organization
  page.drawText(cert.organization.name, {
    x: margin,
    y: height - margin - 40,
    size: 18,
    font: fontBold,
    color: primary,
  });

  // Congratulatory title
  page.drawText("Certificate of Completion", {
    x: width / 2 - 150,
    y: height - 150,
    size: 22,
    font: fontBold,
    color: accent,
  });

  // Employee Name (big + bold)
  page.drawText(cert.employee.full_name, {
    x: width / 2 - 200,
    y: height / 2,
    size: 32,
    font: fontBold,
    color: primary,
  });

  // Program Info
  page.drawText(`For successfully completing: ${cert.program.name}`, {
    x: width / 2 - 250,
    y: height / 2 - 50,
    size: 16,
    font: fontRegular,
    color: primary,
  });

  if (cert.program.description) {
    page.drawText(cert.program.description, {
      x: width / 2 - 250,
      y: height / 2 - 80,
      size: 12,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: 500,
    });
  }

  // Dates
  page.drawText(
    `Duration: ${new Date(cert.program.start_date).toLocaleDateString()} - ${new Date(
      cert.program.end_date
    ).toLocaleDateString()}`,
    {
      x: width / 2 - 200,
      y: height / 2 - 120,
      size: 12,
      font: fontRegular,
      color: primary,
    }
  );

  page.drawText(`Issued: ${new Date(cert.issued_date).toLocaleDateString()}`, {
    x: margin,
    y: margin + 90,
    size: 10,
    font: fontRegular,
    color: primary,
  });

  if (cert.expiry_date) {
    page.drawText(`Expiry: ${new Date(cert.expiry_date).toLocaleDateString()}`, {
      x: margin,
      y: margin + 75,
      size: 10,
      font: fontRegular,
      color: primary,
    });
  }

  // Certificate Number
  page.drawText(`Certificate No: ${cert.certificate_number}`, {
    x: margin,
    y: margin + 50,
    size: 10,
    font: fontRegular,
    color: primary,
  });

  // QR Code (verification link)
  const qrData = await QRCode.toDataURL(
    `https://yourdomain.com/verify/${cert.verification_code}`
  );
  const qrImage = await pdfDoc.embedPng(qrData);
  const qrSize = 80;
  page.drawImage(qrImage, {
    x: width - margin - qrSize,
    y: margin,
    width: qrSize,
    height: qrSize,
  });

  // Signature placeholder
  page.drawText("Authorized Signature", {
    x: width / 2 - 100,
    y: margin + 20,
    size: 12,
    font: fontRegular,
    color: primary,
  });

  // Finalize
  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=certificate-${cert.certificate_number}.pdf`,
    },
  });
}
