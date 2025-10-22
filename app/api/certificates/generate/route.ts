import { NextResponse } from "next/server"import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"import { createClient } from "@/lib/supabase/server"

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

import QRCode from "qrcode"import QRCode from "qrcode"

import { z } from "zod"import { z } from "zod"



// Define types for the database responses// Define types for the database responses

interface Certificate {interface Certificate {

  certificate_id: string  certificate_id: string

  issued_at: string  issued_at: string

  score: number  score: number

  employee: {  employee: {

    full_name: string    full_name: string

  }  }

  program: {  program: {

    name: string    name: string

    description: string    description: string

    start_date: string    start_date: string

    end_date: string    end_date: string

    organization: {    organization: {

      name: string      name: string

    }    }

  }  }

}}



// Input validation schema// Input validation schema

const generateRequestSchema = z.object({const generateRequestSchema = z.object({

  certificate_id: z.string()  certificate_id: z.string()

})})



export async function POST(req: Request) {export async function POST(req: Request) {

  try {  try {

    const body = await req.json()    const body = await req.json()

    const { certificate_id } = generateRequestSchema.parse(body)    const { certificate_id } = generateRequestSchema.parse(body)

        

    const supabase = createClient()    const supabase = createClient()



    // Fetch certificate + program + employee + org with type safety    // Fetch certificate + program + employee + org with type safety

    const { data: cert, error } = await supabase    const { data: cert, error } = await supabase

      .from("certificates")      .from("certificates")

      .select(`      .select(`

        certificate_id, issued_at, score,        certificate_id, issued_at, score,

        employee:employee_id(full_name),        employee:employee_id(full_name),

        program:program_id(name, description, start_date, end_date, organization:organization_id(name))        program:program_id(name, description, start_date, end_date, organization:organization_id(name))

      `)      `)

      .eq("certificate_id", certificate_id)      .eq("certificate_id", certificate_id)

      .single()      .single()



    const certificateData = cert as Certificate | null    const certificateData = cert as Certificate | null



    if (error || !certificateData) {    if (error || !cert) {

      console.error("Certificate fetch error:", error)      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })

      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })    }

    }

    // Generate PDF

    // Generate PDF with type-safe access    const pdfDoc = await PDFDocument.create()

    const pdfDoc = await PDFDocument.create()    const page = pdfDoc.addPage([842, 595])

    const page = pdfDoc.addPage([842, 595]) // A4 landscape    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)    const { width, height } = page.getSize()

    const { width, height } = page.getSize()

    // Background

    // Background    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.95, 0.95, 0.92) })

    page.drawRectangle({

      x: 0,    // Header

      y: 0,    page.drawText("CERTIFIED Platform", { x: width - 200, y: height - 40, size: 14, font, color: rgb(0, 0.4, 0.7) })

      width,    page.drawText(cert.program.organization.name, { x: width / 2 - 80, y: height - 60, size: 18, font })

      height,

      color: rgb(0.95, 0.95, 0.92)    // Body

    })    page.drawText("Congratulations!", { x: width / 2 - 80, y: height - 120, size: 20, font, color: rgb(0, 0.6, 0.2) })

    page.drawText(cert.employee.full_name, { x: width / 2 - 100, y: height - 180, size: 28, font })

    // Header    page.drawText(`${cert.program.name} - ${cert.program.description}`, { x: width / 2 - 150, y: height - 230, size: 16, font })

    page.drawText("CERTIFIED Platform", {    page.drawText(`Duration: ${cert.program.start_date} - ${cert.program.end_date}`, { x: width / 2 - 150, y: height - 260, size: 12, font })

      x: width - 200,    page.drawText(`Certificate ID: ${cert.certificate_id}`, { x: 50, y: 80, size: 12, font })

      y: height - 40,

      size: 14,    // QR

      font,    const qrData = await QRCode.toDataURL(`https://yourdomain.com/certificates/verify/${cert.certificate_id}`)

      color: rgb(0, 0.4, 0.7)    const qrImage = await pdfDoc.embedPng(qrData)

    })    page.drawImage(qrImage, { x: width - 150, y: 50, width: 100, height: 100 })

    

    page.drawText(certificateData.program.organization.name, {    // Signature

      x: width / 2 - 80,    page.drawText("Authorized Signature", { x: width / 2 - 60, y: 60, size: 12, font })

      y: height - 60,

      size: 18,    const pdfBytes = await pdfDoc.save()

      font

    })    return new NextResponse(pdfBytes, {

      status: 200,

    // Body      headers: {

    page.drawText("Congratulations!", {        "Content-Type": "application/pdf",

      x: width / 2 - 80,        "Content-Disposition": `attachment; filename="${cert.certificate_id}.pdf"`,

      y: height - 120,      },

      size: 20,    })

      font,  } catch (err) {

      color: rgb(0, 0.6, 0.2)    console.error(err)

    })    return NextResponse.json({ error: "Server error" }, { status: 500 })

      }

    page.drawText(certificateData.employee.full_name, {}

      x: width / 2 - 100,
      y: height - 180,
      size: 28,
      font
    })
    
    page.drawText(`${certificateData.program.name} - ${certificateData.program.description}`, {
      x: width / 2 - 150,
      y: height - 230,
      size: 16,
      font
    })
    
    page.drawText(`Duration: ${certificateData.program.start_date} - ${certificateData.program.end_date}`, {
      x: width / 2 - 150,
      y: height - 260,
      size: 12,
      font
    })
    
    page.drawText(`Certificate ID: ${certificateData.certificate_id}`, {
      x: 50,
      y: 80,
      size: 12,
      font
    })

    // Generate and add QR code
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${certificateData.certificate_id}`
      const qrData = await QRCode.toDataURL(verifyUrl)
      const qrImage = await pdfDoc.embedPng(qrData)
      
      page.drawImage(qrImage, {
        x: width - 150,
        y: 50,
        width: 100,
        height: 100
      })
    } catch (qrError) {
      console.error("QR code generation error:", qrError)
    }

    // Add signature line
    page.drawText("Authorized Signature", {
      x: width / 2 - 60,
      y: 60,
      size: 12,
      font
    })

    // Generate final PDF
    const pdfBytes = await pdfDoc.save()

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificateData.certificate_id}.pdf"`,
      },
    })
  } catch (err) {
    console.error("Certificate generation error:", err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : "Server error" 
    }, { 
      status: 500 
    })
  }
}